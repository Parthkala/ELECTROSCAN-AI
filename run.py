import os
import sys
import subprocess
import webbrowser
import time
import threading

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

def check_and_install_python_deps():
    try:
        import fastapi, uvicorn, pymupdf, cv2, numpy, openpyxl, reportlab
        return
    except ImportError:
        pass

    req_file = os.path.join(PROJECT_ROOT, "requirements.txt")
    if os.path.isfile(req_file):
        print("[ElectroScan AI] Installing required dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", req_file], check=True)
            print("[ElectroScan AI] Python dependencies ready.")
        except Exception as e:
            print(f"[ElectroScan AI] Note: pip check returned {e}")

def build_frontend_if_needed():
    frontend_dir = os.path.join(PROJECT_ROOT, "frontend")
    static_dir = os.path.join(PROJECT_ROOT, "backend", "static")
    assets_dir = os.path.join(static_dir, "assets")

    if os.path.isdir(frontend_dir) and (not os.path.isdir(assets_dir) or len(os.listdir(assets_dir)) == 0):
        print("[ElectroScan AI] Building frontend single-page application...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        try:
            if not os.path.isdir(os.path.join(frontend_dir, "node_modules")):
                print("[ElectroScan AI] Installing npm packages...")
                subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
            
            print("[ElectroScan AI] Running vite build...")
            subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
            print("[ElectroScan AI] Frontend built successfully into backend/static.")
        except Exception as e:
            print(f"[ElectroScan AI] Frontend build warning: {e}. Serving development assets.")

def ensure_sample_and_db():
    print("[ElectroScan AI] Initializing SQLite database and verifying sample plan...")
    sys.path.insert(0, PROJECT_ROOT)
    from backend.app.db import init_db
    init_db()

    try:
        from backend.app.sample_gen import ensure_sample_plan
        ensure_sample_plan()
    except ImportError:
        pass

def open_browser():
    time.sleep(1.5)
    print("[ElectroScan AI] Opening browser at http://localhost:8000 ...")
    webbrowser.open("http://localhost:8000")

def main():
    print("=" * 60)
    print(" ElectroScan AI — Intelligent Electrical Takeoff System")
    print(" Offline Startup Demo Mode")
    print("=" * 60)

    check_and_install_python_deps()
    build_frontend_if_needed()
    ensure_sample_and_db()

    threading.Thread(target=open_browser, daemon=True).start()

    import uvicorn
    print("\n[ElectroScan AI] Starting server at http://127.0.0.1:8000 ...\n")
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")

if __name__ == "__main__":
    main()
