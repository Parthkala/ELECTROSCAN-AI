# ElectroScan AI — Intelligent Electrical Takeoff System

> **Offline Startup Demo Ready**: Built for startup competitions judged offline. No cloud APIs, no fake numbers, 100% genuine local computer vision.

![ElectroScan AI Theme](https://img.shields.io/badge/Theme-Dark%20Navy%20%230B3D91-0B3D91)
![Status](https://img.shields.io/badge/Status-Demo%20Ready-success)
![Coverage](https://img.shields.io/badge/Precision-86.2%25-blue)
![Recall](https://img.shields.io/badge/Recall-100.0%25-green)

---

## ⚡ What is ElectroScan AI?
ElectroScan AI is an offline, AI-assisted electrical takeoff desktop and web system for electrical contractors and estimators. It solves the manual highlighter-and-tally problem by:
- Ingesting electrical blueprints (PDF/PNG/JPG up to 50MB).
- Rendering drawing sheets at crisp 150 DPI.
- Detecting electrical symbols (Lighting Fixtures, Power Outlets, Switches) via multi-scale, multi-rotation computer vision.
- Assigning exact confidence scores and routing uncertain items (0.55–0.80) to an interactive human Review Queue.
- Providing **Click-to-Source** traceability with architectural grid coordinates (e.g. `Sheet 1, Grid B-4, 62% confidence`).
- Maintaining an immutable audit log of all human actions.
- Exporting to Excel (`.xlsx`), CSV (`.csv`), and PDF takeoff reports.
- Providing an honest **Empirical Benchmark** calculating real precision, recall, and time savings.

---

## 🚀 One-Command Quick Start

### Windows Shortcut
Double-click:
```cmd
run.bat
```

### Or using Python
```bash
python run.py
```
This single command:
1. Verifies and installs all required Python dependencies (`requirements.txt`).
2. Builds the React SPA with Vite into `backend/static/` (if not already built).
3. Initializes the SQLite database and seeds the demo user (`parth` / `demo123`).
4. Procedurally creates the high-res 2-sheet A3 sample electrical plan with ground truth.
5. Launches the FastAPI local server on `http://127.0.0.1:8000`.
6. Opens your default web browser automatically.

---

## 💻 Tech Stack
- **Backend**: Python 3.10+, FastAPI, Uvicorn, PyMuPDF (`fitz`), OpenCV Headless (`cv2`), NumPy, openpyxl, ReportLab, SQLite3.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts.
- **Design System**: Dark navy sidebar (`#0B3D91`), accent `#2563EB`, hover `#DBEAFE`, background `#F8FAFC`, text `#1F2937`, muted `#64748B`, Inter typography.

---

## 🧪 Running Automated Tests
Run the complete test suite:
```bash
python -m pytest -v tests/
```
Output includes exact detection performance on the sample plan:
```text
Processing Time : 17.11 seconds (2 x A3 sheets)
Ground Truth    : 100 electrical symbols
True Positives  : 100
False Positives : 16
False Negatives : 0
Actual Precision: 86.2%
Actual Recall   : 100.0%
Actual F1 Score : 92.6%
```

---

## 📋 Credentials
- **Username**: `parth`
- **Password**: `demo123`
*(Available as a one-click auto-fill button on the login screen)*
