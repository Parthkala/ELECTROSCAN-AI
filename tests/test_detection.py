import os
import json
import time
import cv2
import pytest
from backend.app.detection import TemplateMatchingDetector, compute_iou
from backend.app.render import render_document
from backend.app.sample_gen import ensure_sample_plan

def test_sample_detection_benchmark(capsys):
    ensure_sample_plan()

    sample_pdf = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "sample_electrical_plan.pdf")
    gt_file = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "ground_truth.json")
    rendered_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "rendered")

    sheets = render_document(sample_pdf, rendered_dir, dpi=150.0)
    assert len(sheets) == 2

    templates = []
    for sym_id, name in [('lighting_fixture', 'Lighting Fixture'), ('power_outlet', 'Power Outlet'), ('switch', 'Switch')]:
        t_path = os.path.join(os.path.dirname(__file__), "..", "data", "templates", f"{sym_id}.png")
        assert os.path.isfile(t_path)
        t_img = cv2.imread(t_path, cv2.IMREAD_GRAYSCALE)
        templates.append({'id': sym_id, 'name': name, 'template_img': t_img})

    detector = TemplateMatchingDetector()
    config = {'score_floor': 0.55, 'auto_threshold': 0.80, 'nms_iou': 0.30}

    t0 = time.time()
    all_detections = []
    for s in sheets:
        sheet_gray = cv2.imread(s['image_path'], cv2.IMREAD_GRAYSCALE)
        dets = detector.detect(sheet_gray, templates, config)
        all_detections.append(dets)
    duration = time.time() - t0

    # Under 60s requirement
    assert duration < 60.0, f"Detection took {duration:.2f}s, expected < 60s"

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    total_gt = 0
    tp = 0
    fp = 0

    for idx, sheet_gt in enumerate(gt_data['sheets']):
        gt_symbols = [s for s in sheet_gt['symbols'] if not s.get('is_distractor')]
        total_gt += len(gt_symbols)
        matched_gt = set()

        for det in all_detections[idx]:
            match_found = False
            for g_idx, g in enumerate(gt_symbols):
                if g_idx in matched_gt:
                    continue
                if det.symbol_id == g['symbol_id'] and compute_iou(det.bbox, g['bbox']) > 0.25:
                    matched_gt.add(g_idx)
                    match_found = True
                    break
            if match_found:
                tp += 1
            else:
                fp += 1

    fn = total_gt - tp
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / total_gt if total_gt > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    print("\n" + "=" * 50)
    print(" ELECTROSCAN AI DETECTION BENCHMARK RESULTS")
    print("=" * 50)
    print(f" Processing Time : {duration:.2f} seconds (2 x A3 sheets)")
    print(f" Ground Truth    : {total_gt} electrical symbols")
    print(f" True Positives  : {tp}")
    print(f" False Positives : {fp}")
    print(f" False Negatives : {fn}")
    print(f" Actual Precision: {precision * 100:.1f}%")
    print(f" Actual Recall   : {recall * 100:.1f}%")
    print(f" Actual F1 Score : {f1 * 100:.1f}%")
    print("=" * 50 + "\n")

    assert recall >= 0.85, f"Recall {recall*100:.1f}% below minimum 85%"
    assert precision >= 0.70, f"Precision {precision*100:.1f}% below minimum 70%"
