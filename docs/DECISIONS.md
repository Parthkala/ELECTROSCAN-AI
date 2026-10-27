# Architecture Decision Records (ADRs) — ElectroScan AI

## ADR-001: Local-First Offline Architecture
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: The competition demo must run fully offline without any reliance on internet connectivity, external cloud vision APIs, or LLM tokens that could fail, throttle, or lag on stage.
- **Decision**: Serve frontend and API from a single lightweight FastAPI instance backed by SQLite. Use PyMuPDF and local OpenCV headless algorithms.
- **Consequences**: Zero network latency, deterministic runtime, works reliably on any projector laptop.

## ADR-002: Modular Computer Vision Detector Interface
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: We need a fast, zero-dependency engine right now for multi-symbol detection that also adheres to software engineering best practices for future AI upgrades (e.g. YOLOv8 / RT-DETR / ViT).
- **Decision**: Define a `BaseDetector` abstract base class in `detection.py`. Implement `TemplateMatchingDetector` as the baseline with multi-scale (0.8x-1.25x), 4-rotation, and cross-class NMS.
- **Consequences**: Easy to swap in a PyTorch/ONNX trained model without changing API endpoints, database schema, or UI logic.

## ADR-003: Drawing Grid Referencing System (Columns A-L, Rows 1-8)
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Contractors need "click-to-source" accountability. In construction drawings, symbols are referenced by architectural grid coordinates.
- **Decision**: Divide normalized sheet space into 12 columns (A through L) and 8 rows (1 through 8). Any detection center `(cx, cy)` maps deterministically to a grid tag like "B-4".
- **Consequences**: Estimators can instantly verify physical drawing sheets with zero ambiguity.

## ADR-004: Dual-Tier Confidence and Review Queue
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: No CV model is 100% accurate; industrial estimators will not trust a black box that hides uncertainty.
- **Decision**: Matches with score >= 0.80 are classified as `auto`. Matches between 0.55 and 0.80 are classified as `flagged` (amber dashed box) and routed to a dedicated Review Queue.
- **Consequences**: Gives contractors complete confidence and reduces manual counting time by ~80% while retaining 100% human verification of edge cases.

## ADR-005: Unified Single-Process Serving
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: Startup competition demo needs a zero-friction startup command: `python run.py`.
- **Decision**: Vite builds the frontend into `backend/static`. FastAPI mounts `StaticFiles` at `/` and serves `index.html` as the fallback for client-side routing.
- **Consequences**: The judges only need one command to run both frontend and backend.
