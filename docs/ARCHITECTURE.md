# System Architecture — ElectroScan AI

## Overview
ElectroScan AI is designed as a modular, local-first web application that operates completely offline without cloud APIs or recurring SaaS dependencies.

```
+-------------------------------------------------------------------------------+
|                                Frontend (SPA)                                 |
|   React + Vite + Tailwind CSS + Lucide Icons + Recharts + HTML5 Canvas Pan/Zoom|
+---------------------------------------+---------------------------------------+
                                        | REST (JSON / Multipart / Binary Blobs)
+---------------------------------------v---------------------------------------+
|                            Backend (FastAPI)                                  |
|   - FastAPI routing & middleware                                              |
|   - Static file server (/ -> backend/static)                                  |
|   - Background worker pool for takeoff pipelines                              |
+-------+------------------+------------------+------------------+--------------+
        |                  |                  |                  |
+-------v-------+  +-------v-------+  +-------v-------+  +-------v-------+
|  Render Pipe  |  | Detection Pipe|  | Export Engine |  | Benchmark Mod |
| PyMuPDF (fitz)|  | OpenCV TM     |  | openpyxl      |  | Precision /   |
| 150 DPI RGB/  |  | Multi-scale   |  | ReportLab     |  | Recall / Time |
| Grayscale     |  | Multi-rot NMS |  | CSV Writer    |  | Ground truth  |
+-------+-------+  +-------+-------+  +-------+-------+  +-------+-------+
        |                  |                  |                  |
+-------v------------------v------------------v------------------v--------------+
|                              SQLite (data/electroscan.db)                     |
| Users | Projects | Sheets | Symbols | Detections | AuditLogs | Benchmarks     |
+-------------------------------------------------------------------------------+
```

## Core Subsystems

### 1. Document Ingestion & Rendering (`backend/app/render.py`)
- Accepts PDF, PNG, JPG files up to 50MB.
- PDFs are rendered via PyMuPDF (`pymupdf`/`fitz`) at 150 DPI (high-fidelity for CAD lines and small symbol features).
- Generates:
  - Full-resolution sheet raster image (PNG) for visual inspection.
  - Grayscale normalized array for computer-vision operations.
  - Coordinate mapping: establishes drawing grid system (Columns A-L, Rows 1-8).

### 2. Computer Vision Detection Pipeline (`backend/app/detection.py`)
Exposes an extensible `Detector` abstract base class to support future YOLO/transformer engines:
```python
class BaseDetector(ABC):
    @abstractmethod
    def detect(self, image_np, templates, config) -> list[DetectionResult]:
        pass
```
The production template detector implements:
- Multi-scale search: 5 steps from 0.8x to 1.25x.
- 4 orthogonal rotations: 0°, 90°, 180°, 270°.
- Normalized Cross-Correlation: `cv2.matchTemplate(..., cv2.TM_CCOEFF_NORMED)`.
- Confidence floor: 0.55 (matches below this are discarded as background noise).
- Non-Maximum Suppression (NMS): IoU threshold of 0.30 within each symbol class.
- Cross-Class Conflict Resolution: where bboxes overlap significantly across classes, the higher confidence match wins.
- Classification threshold:
  - `>= 0.80`: Auto-accepted (`auto`).
  - `0.55 <= score < 0.80`: Flagged for human review (`flagged`).

### 3. Review & Verification Engine (Frontend + Backend)
- Interactive HTML5 / Canvas pan/zoom viewer with high-DPI sheet rendering.
- Bounding box rendering:
  - Solid green/blue for accepted symbols.
  - Dashed amber for flagged symbols requiring contractor attention.
  - Red strikethrough for rejected symbols.
  - Cyan badge for manually added symbols.
- Click-to-source inspection displays:
  - Sheet number and name.
  - Alpha-numeric grid coordinate (e.g., `Sheet 1, Grid B-4`).
  - Confidence percentage (e.g., `62%`).
  - Interactive Keep / Reject / Reclassify buttons.
- Audit trail logs all user interactions (`audit_log` table) recording timestamp, user, detection ID, action, and state change.

### 4. Sample Generation & Ground Truth (`backend/app/sample_gen.py`)
- Generates synthetic yet realistic architectural electrical plans (2 sheets, A3 landscape).
- Contains real CAD architectural elements: walls, doors, windows, room tags, title block, cable routes.
- Stamps 40–60 symbols per sheet across 3 classes: Lighting Fixture, Power Outlet, Single-Pole Switch.
- Injects deliberate realistic challenges: intersecting lines, partial overlaps, and 2 distractor symbols (Smoke Detector, Ceiling Fan).
- Writes deterministic `ground_truth.json` for validation.

### 5. Benchmark Engine (`backend/app/benchmark.py`)
- Compares AI detections against `ground_truth.json` on the sample project.
- Computes genuine true positives, false positives, false negatives, precision, recall, and F1 score per symbol class and globally.
- Tracks processing time (CPU seconds) and review duration.
- For user-uploaded blueprints, provides manual vs AI time-savings comparative metrics.

### 6. Export Pipeline (`backend/app/export.py`)
- **Excel (.xlsx)**: Formatted with professional openpyxl styling:
  - Tab 1: Summary takeoff with quantities, unit rates, and total cost estimates.
  - Tab 2: Detailed itemized detections with Sheet, Grid, coordinates, confidence, status.
  - Tab 3: Complete chronological audit trail.
- **CSV (.csv)**: Clean tabular export for ERP/estimating software.
- **PDF Report (.pdf)**: ReportLab generated executive summary with takeoff tables and stamped sheet snapshots.
