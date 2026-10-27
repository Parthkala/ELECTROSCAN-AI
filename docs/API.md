# REST API Specification — ElectroScan AI

Base URL: `http://localhost:8000/api`

---

## 1. System & Authentication

### `GET /api/health`
Returns system status and database connectivity.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "symbols_count": 3
}
```

### `POST /api/auth/login`
Authenticates a user session.
- **Request Body**:
```json
{
  "username": "parth",
  "password": "demo123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "demo-token-parth",
  "user": {
    "id": 1,
    "username": "parth",
    "name": "Parth Kala",
    "email": "parth@electroscan.ai",
    "role": "Lead Estimator"
  }
}
```

---

## 2. Dashboard & Statistics

### `GET /api/dashboard/stats`
Computes live KPIs and activity breakdown from the database.
- **Response `200 OK`**:
```json
{
  "total_drawings": 12,
  "symbols_detected": 1420,
  "avg_processing_time_sec": 38.5,
  "pending_reviews": 42,
  "success_rate_pct": 98.2,
  "activity_chart": [
    { "date": "2026-10-21", "day": "Wed", "processed": 3, "failed": 0 },
    { "date": "2026-10-22", "day": "Thu", "processed": 4, "failed": 0 },
    { "date": "2026-10-23", "day": "Fri", "processed": 6, "failed": 1 },
    { "date": "2026-10-24", "day": "Sat", "processed": 2, "failed": 0 },
    { "date": "2026-10-25", "day": "Sun", "processed": 1, "failed": 0 },
    { "date": "2026-10-26", "day": "Mon", "processed": 5, "failed": 0 },
    { "date": "2026-10-27", "day": "Tue", "processed": 4, "failed": 0 }
  ]
}
```

---

## 3. Projects & Documents

### `GET /api/projects`
List all projects with metadata and count aggregates.
- **Query params**: `search` (optional string)
- **Response `200 OK`**:
```json
[
  {
    "id": "proj-sample-001",
    "name": "Commercial Office - Level 2 (Sample)",
    "file_name": "sample_electrical_plan.pdf",
    "file_size_bytes": 1420500,
    "sheet_count": 2,
    "status": "completed",
    "total_detections": 98,
    "pending_reviews": 12,
    "created_at": "2026-10-27T10:00:00Z",
    "processed_at": "2026-10-27T10:00:45Z"
  }
]
```

### `POST /api/projects/upload`
Upload a new drawing (PDF/PNG/JPG).
- **Form Data**:
  - `file`: binary file
  - `name`: string project name
- **Response `201 Created`**:
```json
{
  "project_id": "proj-uuid-123",
  "name": "Warehouse Lighting Phase 1",
  "status": "queued",
  "sheet_count": 1
}
```

### `POST /api/projects/create-sample`
Instantiates a new project from the pre-generated sample plan.
- **Response `201 Created`**:
```json
{
  "project_id": "proj-sample-001",
  "name": "Sample Electrical Plan",
  "status": "ready"
}
```

### `DELETE /api/projects/{project_id}`
Deletes a project and its sheets, detections, and audit log.

---

## 4. Processing & Job Progress

### `POST /api/projects/{project_id}/process`
Initiates background takeoff processing on the project.
- **Response `202 Accepted`**:
```json
{
  "job_id": "job-uuid-456",
  "status": "processing"
}
```

### `GET /api/projects/{project_id}/job-status`
Polls current takeoff processing status.
- **Response `200 OK`**:
```json
{
  "status": "processing",
  "progress_pct": 65,
  "current_step": "Detecting symbols",
  "steps": [
    { "name": "Reading document", "completed": true },
    { "name": "Rendering sheets", "completed": true },
    { "name": "Detecting symbols", "completed": false, "active": true },
    { "name": "Scoring confidence", "completed": false },
    { "name": "Building takeoff", "completed": false }
  ],
  "elapsed_sec": 14.2
}
```

---

## 5. Sheets & Detections (Hero Review & Verify)

### `GET /api/projects/{project_id}/details`
Fetches complete project representation including sheets, detections, symbols, and summary counts.
- **Response `200 OK`**:
```json
{
  "project": { "id": "proj-1", "name": "...", "status": "completed" },
  "sheets": [
    {
      "id": 1,
      "sheet_index": 0,
      "name": "Sheet 1 - Power & Lighting",
      "image_url": "/api/sheets/1/image",
      "width": 2479,
      "height": 1754,
      "grid_cols": ["A","B","C","D","E","F","G","H","I","J","K","L"],
      "grid_rows": [1,2,3,4,5,6,7,8]
    }
  ],
  "summary": {
    "total": 98,
    "auto": 72,
    "flagged": 16,
    "kept": 6,
    "rejected": 4,
    "manual": 0,
    "by_symbol": {
      "Lighting Fixture": { "total": 42, "auto": 32, "flagged": 8, "kept": 2, "rejected": 0, "rate": 45.0 },
      "Power Outlet": { "total": 36, "auto": 26, "flagged": 6, "kept": 2, "rejected": 2, "rate": 32.5 },
      "Switch": { "total": 20, "auto": 14, "flagged": 2, "kept": 2, "rejected": 2, "rate": 28.0 }
    }
  },
  "detections": [
    {
      "id": 101,
      "sheet_id": 1,
      "symbol_id": "lighting_fixture",
      "symbol_name": "Lighting Fixture",
      "confidence": 0.88,
      "status": "auto",
      "bbox": [0.245, 0.312, 0.265, 0.332],
      "grid_ref": "B-4",
      "created_by": "ai"
    }
  ]
}
```

### `PATCH /api/detections/{detection_id}`
Updates detection status (keep, reject) or changes symbol class.
- **Request Body**:
```json
{
  "status": "kept",
  "symbol_id": "lighting_fixture"
}
```
- **Response `200 OK`**:
```json
{
  "id": 101,
  "status": "kept",
  "symbol_name": "Lighting Fixture",
  "updated_at": "2026-10-27T10:05:00Z"
}
```

### `POST /api/projects/{project_id}/detections/manual`
Adds a manual detection pin from the canvas.
- **Request Body**:
```json
{
  "sheet_id": 1,
  "symbol_id": "power_outlet",
  "bbox": [0.41, 0.52, 0.43, 0.54]
}
```
- **Response `201 Created`**:
```json
{
  "id": 105,
  "status": "manual",
  "grid_ref": "E-5",
  "confidence": 1.0
}
```

### `POST /api/projects/{project_id}/reclassify-threshold`
Applies live threshold changes across all detections.
- **Request Body**:
```json
{
  "auto_threshold": 0.82
}
```

---

## 6. Audit Trail

### `GET /api/projects/{project_id}/audit-log`
Fetches chronologically ordered audit logs.
- **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "timestamp": "2026-10-27T10:05:00Z",
    "user": "parth",
    "action": "KEEP_DETECTION",
    "detection_id": 101,
    "details": "Status changed from flagged to kept (Grid B-4, Lighting Fixture)"
  }
]
```

---

## 7. Symbol Library & "Teach a Symbol"

### `GET /api/symbols`
Lists symbol definitions with templates and unit rates.

### `PATCH /api/symbols/{symbol_id}`
Updates symbol unit rate or threshold.

### `POST /api/symbols/teach`
Crops a user-selected rectangle from a sheet image to register a new symbol template.
- **Request Body**:
```json
{
  "sheet_id": 1,
  "name": "Emergency Exit Light",
  "category": "Lighting",
  "unit_rate": 65.0,
  "crop_box": [0.12, 0.15, 0.14, 0.17]
}
```
- **Response `201 Created`**:
```json
{
  "symbol_id": "sym-exit-light",
  "name": "Emergency Exit Light",
  "template_url": "/api/symbols/sym-exit-light/template.png"
}
```

---

## 8. Export & Benchmark

### `GET /api/projects/{project_id}/export/excel`
Generates and streams `.xlsx` workbook.

### `GET /api/projects/{project_id}/export/csv`
Generates and streams `.csv` file.

### `GET /api/projects/{project_id}/export/pdf`
Generates and streams ReportLab `.pdf` report.

### `GET /api/projects/{project_id}/benchmark`
Returns real precision, recall, and time metrics vs ground truth.
