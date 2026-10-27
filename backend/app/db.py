import os
import sqlite3
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any

_PROJECT_DATA = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
# Vercel serverless: writable storage is /tmp only
if os.environ.get("VERCEL"):
    _WRITABLE = os.path.join("/tmp", "electroscan")
else:
    _WRITABLE = _PROJECT_DATA

DB_PATH = os.path.join(_WRITABLE, "electroscan.db")

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Lead Estimator',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'queued',
            sheet_count INTEGER NOT NULL DEFAULT 0,
            processing_time_sec REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            sheet_index INTEGER NOT NULL,
            name TEXT NOT NULL,
            width_px INTEGER NOT NULL,
            height_px INTEGER NOT NULL,
            dpi REAL NOT NULL DEFAULT 150.0,
            image_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS symbols (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Electrical',
            default_unit_rate REAL NOT NULL DEFAULT 0.0,
            default_threshold REAL NOT NULL DEFAULT 0.80,
            template_path TEXT NOT NULL,
            is_builtin INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            sheet_id INTEGER NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
            symbol_id TEXT NOT NULL REFERENCES symbols(id),
            confidence REAL NOT NULL,
            status TEXT NOT NULL,
            bbox_x0 REAL NOT NULL,
            bbox_y0 REAL NOT NULL,
            bbox_x1 REAL NOT NULL,
            bbox_y1 REAL NOT NULL,
            grid_ref TEXT NOT NULL,
            created_by TEXT NOT NULL DEFAULT 'ai',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            detection_id INTEGER REFERENCES detections(id) ON DELETE SET NULL,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            before_state TEXT,
            after_state TEXT,
            details TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS benchmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            total_ground_truth INTEGER NOT NULL,
            true_positives INTEGER NOT NULL,
            false_positives INTEGER NOT NULL,
            false_negatives INTEGER NOT NULL,
            precision REAL NOT NULL,
            recall REAL NOT NULL,
            f1_score REAL NOT NULL,
            ai_processing_sec REAL NOT NULL,
            manual_benchmark_min REAL NOT NULL,
            detailed_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Seed demo user
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE username = 'parth'")
        if not cur.fetchone():
            cur.execute("""
            INSERT INTO users (username, password_hash, full_name, email, role)
            VALUES (?, ?, ?, ?, ?)
            """, (
                "parth",
                hash_password("demo123"),
                "Parth Kala",
                "parth@electroscan.ai",
                "Lead Estimator"
            ))

        # Seed symbols
        template_base = os.path.join(_WRITABLE, "templates")
        os.makedirs(template_base, exist_ok=True)
        src_templates = os.path.join(_PROJECT_DATA, "templates")
        if os.path.isdir(src_templates):
            import shutil
            for t_file in os.listdir(src_templates):
                src_f = os.path.join(src_templates, t_file)
                dst_f = os.path.join(template_base, t_file)
                if os.path.isfile(src_f) and not os.path.isfile(dst_f):
                    shutil.copy2(src_f, dst_f)

        builtin_symbols = [
            ("lighting_fixture", "Lighting Fixture", "Lighting", 550.0, 0.80, os.path.join(template_base, "lighting_fixture.png")),
            ("power_outlet", "Power Outlet (Duplex)", "Receptacles", 300.0, 0.80, os.path.join(template_base, "power_outlet.png")),
            ("switch", "Single-Pole Switch", "Controls", 200.0, 0.80, os.path.join(template_base, "switch.png")),
        ]

        for s_id, name, cat, rate, thresh, t_path in builtin_symbols:
            cur.execute("SELECT id FROM symbols WHERE id = ?", (s_id,))
            if not cur.fetchone():
                cur.execute("""
                INSERT INTO symbols (id, name, category, default_unit_rate, default_threshold, template_path, is_builtin)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                """, (s_id, name, cat, rate, thresh, t_path))

        # Seed default settings
        defaults = [
            ("auto_threshold", "0.80"),
            ("score_floor", "0.55"),
            ("nms_iou", "0.30"),
            ("company_name", "ElectroScan Estimating Inc."),
            ("theme_accent", "#2563EB"),
        ]
        for k, v in defaults:
            cur.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized at", DB_PATH)
