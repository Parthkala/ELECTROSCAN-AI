import os
import json
from typing import Dict, Any
from .db import get_db
from .detection import compute_iou

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
GT_PATH = os.path.join(DATA_DIR, "samples", "ground_truth.json")

def evaluate_project_benchmark(project_id: str) -> Dict[str, Any]:
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    proj = cur.fetchone()
    if not proj:
        conn.close()
        raise ValueError("Project not found")

    cur.execute("SELECT * FROM detections WHERE project_id = ?", (project_id,))
    detections = [dict(d) for d in cur.fetchall()]

    # If this is the sample project or ground_truth is available
    if not os.path.isfile(GT_PATH):
        conn.close()
        return {"status": "no_ground_truth", "message": "Ground truth is available for the seeded sample project."}

    with open(GT_PATH, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    # Flatten ground truth symbols across sheets
    gt_all = []
    for sheet in gt_data.get("sheets", []):
        s_idx = sheet.get("sheet_index", 0)
        for s in sheet.get("symbols", []):
            if not s.get("is_distractor"):
                gt_all.append({**s, "sheet_index": s_idx})

    total_gt = len(gt_all)
    matched_gt = set()
    tp = 0
    fp = 0

    per_symbol = {}
    for d in detections:
        d_box = [d["bbox_x0"], d["bbox_y0"], d["bbox_x1"], d["bbox_y1"]]
        s_id = d["symbol_id"]
        if s_id not in per_symbol:
            per_symbol[s_id] = {"gt": 0, "tp": 0, "fp": 0, "fn": 0}

        match_found = False
        for g_idx, g in enumerate(gt_all):
            if g_idx in matched_gt:
                continue
            if g["symbol_id"] == s_id and compute_iou(d_box, g["bbox"]) > 0.25:
                matched_gt.add(g_idx)
                match_found = True
                break

        if match_found:
            tp += 1
            per_symbol[s_id]["tp"] += 1
        else:
            fp += 1
            per_symbol[s_id]["fp"] += 1

    fn = total_gt - tp

    for g_idx, g in enumerate(gt_all):
        s_id = g["symbol_id"]
        if s_id not in per_symbol:
            per_symbol[s_id] = {"gt": 0, "tp": 0, "fp": 0, "fn": 0}
        per_symbol[s_id]["gt"] += 1
        if g_idx not in matched_gt:
            per_symbol[s_id]["fn"] += 1

    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / total_gt, 4) if total_gt > 0 else 0.0
    f1 = round(2 * precision * recall / (precision + recall), 4) if (precision + recall) > 0 else 0.0

    ai_time_sec = float(proj["processing_time_sec"] or 15.0)
    # Manual estimation calculation: industry avg ~45 seconds per drawing symbol manual count
    manual_benchmark_min = round((total_gt * 45) / 60.0, 1)

    result = {
        "project_id": project_id,
        "total_ground_truth": total_gt,
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "ai_processing_sec": ai_time_sec,
        "manual_benchmark_min": manual_benchmark_min,
        "time_saved_pct": round(((manual_benchmark_min * 60 - ai_time_sec) / (manual_benchmark_min * 60)) * 100, 1) if manual_benchmark_min > 0 else 0.0,
        "per_symbol": per_symbol
    }

    # Save to benchmarks table
    cur.execute("""
    INSERT INTO benchmarks (project_id, total_ground_truth, true_positives, false_positives, false_negatives,
                           precision, recall, f1_score, ai_processing_sec, manual_benchmark_min, detailed_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
        total_ground_truth=excluded.total_ground_truth,
        true_positives=excluded.true_positives,
        false_positives=excluded.false_positives,
        false_negatives=excluded.false_negatives,
        precision=excluded.precision,
        recall=excluded.recall,
        f1_score=excluded.f1_score,
        ai_processing_sec=excluded.ai_processing_sec,
        manual_benchmark_min=excluded.manual_benchmark_min,
        detailed_json=excluded.detailed_json
    """, (
        project_id, total_gt, tp, fp, fn, precision, recall, f1,
        ai_time_sec, manual_benchmark_min, json.dumps(result)
    ))
    conn.commit()
    conn.close()

    return result
