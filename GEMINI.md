# GEMINI.md — ElectroScan AI Agent Guidelines

## Project Summary
ElectroScan AI is an offline, AI-assisted electrical takeoff desktop/web system for electrical contractors. It ingests blueprints/drawings (PDF/PNG/JPG), renders sheets at 150 DPI, performs multi-scale & multi-rotation computer-vision template matching to detect electrical symbols (Lighting Fixtures, Power Outlets, Switches), scores confidence, routes uncertain items (0.55–0.80) to a human review queue with click-to-source inspection and grid referencing (e.g. "B-4"), tracks a comprehensive audit trail, computes live benchmarks against ground truth, and exports to Excel, CSV, and PDF takeoff reports.

## Core Stack
- **Backend**: Python 3.10+, FastAPI, Uvicorn, PyMuPDF (`fitz`), OpenCV Headless (`cv2`), NumPy, openpyxl, ReportLab, SQLite3.
- **Frontend**: React (Vite), Tailwind CSS, Lucide React icons, Recharts, plain JavaScript.
- **Serving**: FastAPI serves the built single-page frontend application from `backend/static`.
- **Runtime**: Runs fully offline with zero internet or cloud API dependencies via `python run.py` (or `run.bat` on Windows).

## Folder Map
```
electroscan-ai/
├── AGENTS.md               # Guidelines & conventions for AI coding agents
├── GEMINI.md               # Mirrored guidelines for Gemini/Antigravity
├── README.md               # Project setup and run documentation
├── DEMO.md                 # 3-minute competition demo walkthrough
├── run.py                  # Single-command install, build, launch script
├── run.bat                 # Windows batch launcher
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI app, API routes, static file serving
│   │   ├── db.py           # SQLite connection, schema migrations, seed data
│   │   ├── render.py       # PDF/image rasterization pipeline (150 DPI)
│   │   ├── detection.py    # Detector interface & multi-scale template matcher
│   │   ├── export.py       # Excel (openpyxl), CSV, and PDF (ReportLab) generators
│   │   ├── benchmark.py    # Precision/recall vs ground truth & review time
│   │   └── sample_gen.py   # Vector blueprint generator for sample project
│   └── static/             # Built production frontend assets (served by FastAPI)
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js          # API client
│       ├── components/     # UI components (Sidebar, TopBar, CanvasViewer, etc.)
│       └── screens/        # Login, Dashboard, Upload, Review, Library, Benchmark, Settings, History
├── data/
│   ├── electroscan.db      # SQLite persistent database
│   ├── samples/            # Generated sample PDFs and ground_truth.json
│   ├── templates/          # Symbol template PNGs and custom trained templates
│   └── uploads/            # Uploaded files and sheet raster caches
├── docs/
│   ├── ARCHITECTURE.md     # System design, data flow, pipeline architecture
│   ├── API.md              # REST endpoints, request/response contracts
│   ├── DATA_MODEL.md       # Database tables, fields, constraints, relationships
│   ├── PROGRESS.md         # Milestone progress tracker & current next action
│   ├── DECISIONS.md        # Architecture Decision Records (ADRs)
│   └── HANDOFF_PROMPT.md   # Cold-start handoff instructions for another AI
└── tests/
    ├── test_api.py         # FastAPI endpoint smoke tests
    └── test_detection.py   # Benchmark test printing actual sample precision/recall
```

## Running & Developing
- Launch everything: `python run.py`
- Windows shortcut: `run.bat`
- Run test suite: `pytest -v tests/`

## Agent Operating Rules & Conventions
1. **Always read `docs/PROGRESS.md` first** before taking any action.
2. **Update `docs/PROGRESS.md` after every milestone** with completed checkboxes, timestamps, and the updated "Next action" pointer.
3. **Record every structural or architectural change in `docs/DECISIONS.md`**.
4. **Follow Ponytail principles**:
   - Write the leanest solution that completely solves the problem.
   - Use standard libraries and installed dependencies first.
   - No dead buttons, no unrequested abstractions, no mock metrics.
5. **Follow Impeccable principles**:
   - Production-grade UI matching the mockup theme: Primary `#0B3D91`, Accent `#2563EB`, Hover `#DBEAFE`, Background `#F8FAFC`, Text `#1F2937`, Muted `#64748B`.
   - Clear visual hierarchy, Inter typography, soft shadows, rounded-xl cards.
   - Polished responsive layouts for 1366x768 and 1920x1080 screens.
   - Comprehensive empty, loading, and error states across all screens.
