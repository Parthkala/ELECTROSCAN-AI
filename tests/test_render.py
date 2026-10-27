import os
import pytest
from backend.app.render import render_document, calculate_grid_ref
from backend.app.sample_gen import ensure_sample_plan

def test_grid_ref_calculation():
    assert calculate_grid_ref(0.05, 0.05) == "A-1"
    assert calculate_grid_ref(0.15, 0.40) == "B-4"
    assert calculate_grid_ref(0.95, 0.95) == "L-8"

def test_sample_plan_render(tmp_path):
    ensure_sample_plan()
    sample_pdf = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "sample_electrical_plan.pdf")
    assert os.path.isfile(sample_pdf)

    out_dir = str(tmp_path / "test_render")
    sheets = render_document(sample_pdf, out_dir, dpi=150.0)
    assert len(sheets) == 2
    assert sheets[0]["width"] > 2000
    assert sheets[0]["height"] > 1500
    assert os.path.isfile(sheets[0]["image_path"])
    assert os.path.isfile(sheets[1]["image_path"])
