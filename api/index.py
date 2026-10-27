import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.db import init_db
from backend.app.main import app, seed_sample_project_if_needed

try:
    init_db()
    seed_sample_project_if_needed()
except Exception as e:
    print(f"[Vercel Startup Init] {e}")
