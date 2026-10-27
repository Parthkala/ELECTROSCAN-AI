import os
import pytest
from backend.app.db import init_db, get_db
from backend.app.main import seed_sample_project_if_needed, process_takeoff_background
from backend.app.export import generate_excel_export, generate_csv_export, generate_pdf_report
from backend.app.benchmark import evaluate_project_benchmark

def setup_module():
    init_db()
    seed_sample_project_if_needed()
    # Process takeoff on the sample project
    process_takeoff_background('proj-sample-001', 'job-test')

def test_excel_export():
    excel_stream = generate_excel_export('proj-sample-001')
    data = excel_stream.getvalue()
    assert len(data) > 1000
    # Check PK header bytes for zip/xlsx
    assert data[:2] == b'PK'

def test_csv_export():
    csv_str = generate_csv_export('proj-sample-001')
    assert "Detection ID,Sheet,Grid Ref,Symbol" in csv_str
    assert "Lighting Fixture" in csv_str or "Power Outlet" in csv_str

def test_pdf_export():
    pdf_stream = generate_pdf_report('proj-sample-001')
    data = pdf_stream.getvalue()
    assert len(data) > 1000
    assert data[:4] == b'%PDF'

def test_benchmark_evaluation():
    bench = evaluate_project_benchmark('proj-sample-001')
    assert bench["total_ground_truth"] == 100
    assert bench["true_positives"] >= 85
    assert bench["precision"] >= 0.70
    assert bench["recall"] >= 0.85
    assert bench["f1_score"] >= 0.80
    assert bench["time_saved_pct"] > 90.0
