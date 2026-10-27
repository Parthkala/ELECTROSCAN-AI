import os
import sqlite3
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from .db import get_db, init_db, hash_password

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="ElectroScan AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Models & Routes ---
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, password_hash, full_name, email, role FROM users WHERE username = ?", (req.username.strip(),))
    user = cur.fetchone()
    conn.close()

    if not user or user["password_hash"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "token": f"token-{user['username']}",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "name": user["full_name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

# --- Health Check ---
@app.get("/api/health")
def health_check():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as cnt FROM symbols")
        cnt = cur.fetchone()["cnt"]
        conn.close()
        return {
            "status": "healthy",
            "version": "1.0.0",
            "database": "connected",
            "symbols_count": cnt
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "unhealthy", "error": str(e)})

# --- Symbols Route ---
@app.get("/api/symbols")
def get_symbols():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, category, default_unit_rate, default_threshold, template_path, is_builtin FROM symbols")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

# --- Static Frontend Serving ---
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets") if os.path.isdir(os.path.join(STATIC_DIR, "assets")) else None

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    file_path = os.path.join(STATIC_DIR, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return {"message": "ElectroScan AI API is running. Frontend build in progress."}
