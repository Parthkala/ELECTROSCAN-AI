import os
import pymupdf as fitz
import cv2
import numpy as np
from typing import List, Dict, Any

GRID_COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
GRID_ROWS = [1, 2, 3, 4, 5, 6, 7, 8]

def calculate_grid_ref(norm_x: float, norm_y: float) -> str:
    """Calculates architectural grid reference (e.g. 'B-4') from normalized coordinates."""
    col_idx = max(0, min(int(norm_x * 12), 11))
    row_idx = max(0, min(int(norm_y * 8), 7))
    return f"{GRID_COLS[col_idx]}-{GRID_ROWS[row_idx]}"

def render_document(file_path: str, output_dir: str, dpi: float = 150.0) -> List[Dict[str, Any]]:
    """
    Renders PDF, PNG, or JPG into 150 DPI raster sheet images.
    Returns list of sheet descriptor dicts.
    """
    os.makedirs(output_dir, exist_ok=True)
    ext = os.path.splitext(file_path)[1].lower()
    sheets = []

    if ext == ".pdf":
        doc = fitz.open(file_path)
        zoom = dpi / 72.0
        matrix = fitz.Matrix(zoom, zoom)

        for idx, page in enumerate(doc):
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            sheet_filename = f"sheet_{idx + 1}.png"
            sheet_path = os.path.join(output_dir, sheet_filename)
            pix.save(sheet_path)

            sheets.append({
                "sheet_index": idx,
                "name": f"Sheet {idx + 1}",
                "width": pix.width,
                "height": pix.height,
                "dpi": dpi,
                "image_path": sheet_path
            })
        doc.close()

    elif ext in [".png", ".jpg", ".jpeg"]:
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Could not read image file at {file_path}")
        h, w = img.shape[:2]
        sheet_filename = "sheet_1.png"
        sheet_path = os.path.join(output_dir, sheet_filename)
        cv2.imwrite(sheet_path, img)

        sheets.append({
            "sheet_index": 0,
            "name": "Sheet 1",
            "width": w,
            "height": h,
            "dpi": dpi,
            "image_path": sheet_path
        })
    else:
        raise ValueError(f"Unsupported document format: {ext}")

    return sheets
