# ElectroScan AI — Implementation Progress

## Milestone Checklist

- [x] **M0: Project Setup & Documentation Baseline**
  - [x] Directory structure and git repository initialized
  - [x] AGENTS.md and GEMINI.md created with team conventions
  - [x] docs/ARCHITECTURE.md, docs/API.md, docs/DATA_MODEL.md, docs/DECISIONS.md, docs/HANDOFF_PROMPT.md written
  - [x] Commit initial documentation baseline

- [x] **M1: Scaffold, run.py, Health Check, DB Schema**
  - [x] SQLite database setup (`backend/app/db.py`) with all tables and seed data
  - [x] FastAPI app (`backend/app/main.py`) with `/api/health`, auth, and core endpoints
  - [x] Single-command launcher (`run.py` & `run.bat`)
  - [x] Initial smoke test passing
  - [x] Commit: `M1: scaffold, run.py, health check, doc files, DB schema`

- [x] **M2: Sample Generator, Render Pipeline, Sheet Viewer**
  - [x] `backend/app/sample_gen.py` generating 2-sheet A3 PDF with vector symbols, noise, and `ground_truth.json`
  - [x] `backend/app/render.py` rendering PDF sheets to 150 DPI PNGs
  - [x] Built-in symbol template extraction
  - [x] Commit: `M2: sample generator, render pipeline, sheet viewer`

- [ ] **M3: Detection Engine, Job Progress, Tests**
  - [ ] `backend/app/detection.py` with `Detector` interface and multi-scale template matcher
  - [ ] Background job queue with polling progress steps (Reading, Rendering, Detecting, Scoring, Building)
  - [ ] Precision/recall verification on sample plan
  - [ ] Pytest test suite (`tests/test_detection.py`, `tests/test_api.py`)
  - [ ] Commit: `M3: detection engine`

- [ ] **M4: Review & Verify Hero Screen & Audit Log**
  - [ ] Interactive canvas pan/zoom viewer with sheet tabs
  - [ ] Bounding boxes with status styling (auto, flagged amber dashed, kept, rejected, manual)
  - [ ] Click-to-source inspection with grid reference (e.g. B-4)
  - [ ] Review Queue card mode with keyboard shortcuts
  - [ ] "Add missing" manual detection tool
  - [ ] Live threshold slider reclassifying items
  - [ ] Audit log tracking every action
  - [ ] Commit: `M4: review and verify complete with audit log`

- [ ] **M5: Full Application Screens**
  - [ ] Login screen (seeded user `parth` / `demo123`, no fake buttons)
  - [ ] Dashboard with live DB KPI cards, 7-day bar chart, quick actions
  - [ ] Upload & Process with drag & drop, 50MB limit, sample project cards
  - [ ] Symbol Library with built-in templates, rates, and "Teach a Symbol" box-drag crop
  - [ ] History screen with search, status pills, and project actions
  - [ ] Settings screen (thresholds, unit rates, profile)
  - [ ] Commit: `M5: login dashboard upload history symbol library settings`

- [ ] **M6: Export & Benchmark**
  - [ ] `backend/app/export.py`: Excel workbook with 3 tabs (Summary, Detections, Audit Log)
  - [ ] CSV export
  - [ ] ReportLab PDF takeoff report with annotated sheet images
  - [ ] `backend/app/benchmark.py`: Honest precision/recall & review time comparisons
  - [ ] Commit: `M6: export and benchmark`

- [ ] **M7: Polish, Visual Verification & Final Fixes**
  - [ ] Final UI styling pass against reference mockup (#0B3D91 sidebar, Inter, rounded-xl cards)
  - [ ] Click-through verification on 1366x768 and 1920x1080 resolutions
  - [ ] README.md and DEMO.md finalized
  - [ ] Full end-to-end `python run.py` dry-run
  - [ ] Commit: `M7: polish and demo-ready prototype`

---
**Next action**: Build M3: Detection Engine (`detection.py`), job progress tracking, and precision/recall evaluation.
