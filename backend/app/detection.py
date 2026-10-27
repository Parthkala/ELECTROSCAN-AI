import os
import cv2
import numpy as np
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass

from .render import calculate_grid_ref

@dataclass
class RawDetection:
    symbol_id: str
    symbol_name: str
    confidence: float
    bbox: List[float]  # [x0, y0, x1, y1] normalized to [0, 1]
    pixel_bbox: Tuple[int, int, int, int]  # (x0, y0, x1, y1)
    grid_ref: str
    status: str  # 'auto' or 'flagged'

class BaseDetector(ABC):
    @abstractmethod
    def detect(self, sheet_gray: np.ndarray, templates: List[Dict[str, Any]], config: Dict[str, Any]) -> List[RawDetection]:
        """
        Runs symbol detection on a grayscale sheet image.
        templates: list of dicts with 'id', 'name', 'template_img' (np.ndarray)
        config: dict with 'score_floor', 'auto_threshold', 'nms_iou'
        """
        pass

def compute_iou(boxA, boxB) -> float:
    # box format: [x0, y0, x1, y1]
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    boxAArea = max(0.0, boxA[2] - boxA[0]) * max(0.0, boxA[3] - boxA[1])
    boxBArea = max(0.0, boxB[2] - boxB[0]) * max(0.0, boxB[3] - boxB[1])

    union = boxAArea + boxBArea - interArea
    if union <= 0:
        return 0.0
    return interArea / union

def non_max_suppression_fast(boxes: List[RawDetection], iou_threshold: float = 0.3) -> List[RawDetection]:
    if not boxes:
        return []

    # Sort boxes by confidence descending
    sorted_boxes = sorted(boxes, key=lambda b: b.confidence, reverse=True)
    kept: List[RawDetection] = []

    for candidate in sorted_boxes:
        overlap = False
        for k in kept:
            if compute_iou(candidate.bbox, k.bbox) > iou_threshold:
                overlap = True
                break
        if not overlap:
            kept.append(candidate)

    return kept

class TemplateMatchingDetector(BaseDetector):
    def __init__(self, scales: List[float] = None, rotations: List[int] = None):
        self.scales = scales or [0.80, 0.90, 1.0, 1.12, 1.25]
        self.rotations = rotations or [0, 90, 180, 270]

    def _rotate_image(self, image: np.ndarray, angle: int) -> np.ndarray:
        if angle == 0:
            return image
        elif angle == 90:
            return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
        elif angle == 180:
            return cv2.rotate(image, cv2.ROTATE_180)
        elif angle == 270:
            return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
        return image

    def detect(self, sheet_gray: np.ndarray, templates: List[Dict[str, Any]], config: Dict[str, Any]) -> List[RawDetection]:
        score_floor = config.get("score_floor", 0.55)
        auto_threshold = config.get("auto_threshold", 0.80)
        nms_iou = config.get("nms_iou", 0.30)

        sheet_h, sheet_w = sheet_gray.shape[:2]
        all_candidates: List[RawDetection] = []

        for tmpl_info in templates:
            tmpl_id = tmpl_info["id"]
            tmpl_name = tmpl_info["name"]
            tmpl_raw = tmpl_info["template_img"]

            if tmpl_raw is None or tmpl_raw.size == 0:
                continue

            base_h, base_w = tmpl_raw.shape[:2]

            for rot in self.rotations:
                rot_tmpl = self._rotate_image(tmpl_raw, rot)
                th, tw = rot_tmpl.shape[:2]

                for scale in self.scales:
                    sw = int(tw * scale)
                    sh = int(th * scale)
                    if sw <= 4 or sh <= 4 or sw >= sheet_w or sh >= sheet_h:
                        continue

                    scaled_tmpl = cv2.resize(rot_tmpl, (sw, sh), interpolation=cv2.INTER_AREA)

                    # Normalized Cross-Correlation
                    res = cv2.matchTemplate(sheet_gray, scaled_tmpl, cv2.TM_CCOEFF_NORMED)

                    # Filter points above score floor
                    loc_y, loc_x = np.where(res >= score_floor)
                    if len(loc_x) == 0:
                        continue

                    for x_px, y_px in zip(loc_x, loc_y):
                        conf = float(res[y_px, x_px])
                        x0_norm = x_px / sheet_w
                        y0_norm = y_px / sheet_h
                        x1_norm = (x_px + sw) / sheet_w
                        y1_norm = (y_px + sh) / sheet_h

                        center_x = (x_px + sw / 2.0) / sheet_w
                        center_y = (y_px + sh / 2.0) / sheet_h
                        grid = calculate_grid_ref(center_x, center_y)

                        status = "auto" if conf >= auto_threshold else "flagged"

                        all_candidates.append(RawDetection(
                            symbol_id=tmpl_id,
                            symbol_name=tmpl_name,
                            confidence=round(conf, 4),
                            bbox=[round(x0_norm, 4), round(y0_norm, 4), round(x1_norm, 4), round(y1_norm, 4)],
                            pixel_bbox=(int(x_px), int(y_px), int(x_px + sw), int(y_px + sh)),
                            grid_ref=grid,
                            status=status
                        ))

        # 1. Non-maximum suppression across candidates of each class
        per_symbol_kept: List[RawDetection] = []
        symbol_ids = set(c.symbol_id for c in all_candidates)
        for s_id in symbol_ids:
            class_boxes = [c for c in all_candidates if c.symbol_id == s_id]
            suppressed = non_max_suppression_fast(class_boxes, iou_threshold=nms_iou)
            per_symbol_kept.extend(suppressed)

        # 2. Conflict resolution across different classes (keep highest confidence)
        final_detections = non_max_suppression_fast(per_symbol_kept, iou_threshold=nms_iou)

        return final_detections
