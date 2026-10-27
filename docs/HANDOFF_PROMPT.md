# ElectroScan AI — Cold-Start Handoff Prompt

*Copy and paste the exact text below to hand off this project to another AI agent.*

---

```markdown
You are taking over development of **ElectroScan AI**, an offline, AI-assisted electrical takeoff desktop application for electrical contractors.
Workspace root: `E:\hp\electroscan-ai`

Before taking ANY action:
1. Read `AGENTS.md` and `docs/PROGRESS.md` to see the current milestone status and next action.
2. Review `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATA_MODEL.md`, and `docs/DECISIONS.md`.
3. Follow Ponytail principles (leanest code, no dead code, standard libraries first) and Impeccable UI principles (dark navy sidebar #0B3D91, accent #2563EB, rounded-xl cards, 1366x768 and 1920x1080 responsive).
4. Run the existing tests: `pytest -v tests/`.
5. Update `docs/PROGRESS.md` after completing each milestone and create git commits with standard milestone prefixes (e.g. `git commit -m "M4: review and verify complete with audit log"`).

Key components:
- `backend/app/main.py`: FastAPI server serving API and static frontend assets
- `backend/app/db.py`: SQLite schema and data operations
- `backend/app/render.py`: PDF/image 150 DPI rasterizer and grid mapper
- `backend/app/detection.py`: Detector interface and multi-scale template matcher
- `backend/app/export.py`: Openpyxl (Excel), CSV, and ReportLab (PDF) generators
- `backend/app/benchmark.py`: Precision/recall and time benchmarking
- `backend/app/sample_gen.py`: Procedural A3 electrical plan generator
- `frontend/src/`: React + Vite + Tailwind CSS interface
- `run.py` / `run.bat`: Single command launcher
```
