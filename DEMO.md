# ElectroScan AI — 3-Minute Startup Competition Demo Script

**Speaker Persona:** Parth Kala (Lead Estimator & Founder, ElectroScan AI)  
**Target Audience:** Competition Judges & Technical Evaluators  
**App Setup:** Run `python run.py` (or double-click `run.bat`). Browser opens to `http://localhost:8000`.

---

## ⏱️ Minute 0:00 – 0:45 | The Problem & The Login
1. **The Hook:**
   > *"Good morning judges. Every year, commercial electrical contractors spend hundreds of thousands of dollars paying senior estimators to manually count symbols on blueprints with colored highlighters. On a single hospital or office tower, missing 20 duplex outlets or miscounting emergency lights can turn a profitable bid into a $50,000 loss."*
2. **The Solution:**
   > *"Meet **ElectroScan AI** — an offline-first, intelligent electrical takeoff platform that turns hours of counting into seconds of verified estimation."*
3. **The Action:**
   - Click the **"Auto-fill"** hint button on the login screen (`parth` / `demo123`).
   - Click **Sign In**.

---

## ⏱️ Minute 0:45 – 1:30 | Dashboard & Taking Off a Blueprint
1. **The Dashboard:**
   - Point out the clean dark navy sidebar (`#0B3D91`) and live KPI cards: Total Blueprints, Symbols Detected, 15.2s Avg Processing Time, and Success Rate.
   - Show the 7-day activity chart (Processed vs Failed).
2. **The Action:**
   - In Quick Actions, click **"Run Sample Takeoff"** (or go to **Upload & Process** and click the "Commercial L2" sample card).
   - Show the live step-by-step processing animation:
     - `Reading document` (Completed)
     - `Rendering sheets` (Completed)
     - `Detecting symbols` (Active)
     - `Scoring confidence`
     - `Building takeoff`
   - In ~15 seconds, the system automatically transitions into the **Hero Screen (Review & Verify)**.

---

## ⏱️ Minute 1:30 – 2:15 | The Hero Feature: Click-to-Source & Human-in-the-Loop
1. **Explain the Philosophy:**
   > *"In construction estimating, contractors don't want a black-box that claims 100% certainty. They need traceable verification."*
2. **The Canvas Viewer:**
   - Demonstrate the smooth Pan & Zoom on the 150 DPI vector blueprint.
   - Show the colored bounding boxes:
     - Solid Blue: High-confidence auto-accepted symbols (>= 80%).
     - Amber Dashed: Flagged symbols requiring human inspection (0.55 – 0.80).
   - **Click any box on the canvas**:
     - The Click-to-Source inspector pops up:
     - *"Notice the exact architectural coordinate: **Sheet 1, Grid B-4, Lighting Fixture, 62% confidence**."*
     - Click **Keep** (or press keyboard shortcut `K`).
     - Point out the instant update in the Summary Table and the new row in the **Audit Trail** tab.
3. **The "Add Missing" Tool:**
   - Click **Add Missing Symbol**, select **Power Outlet (Duplex)**, and click anywhere on the canvas.
   - A new pin appears instantly at that grid location, logged to the audit trail as `MANUAL_ADD`.

---

## ⏱️ Minute 2:15 – 2:45 | Instant Multi-Format Export
1. **The Action:**
   - Click **Excel (.xlsx)** in the top right.
   - Open the downloaded workbook to show the judges:
     - Tab 1: Formatted Summary Takeoff with Unit Rates and formulas (`=SUM(...)`).
     - Tab 2: Itemized detections with Sheet, Grid, and Bounding Box.
     - Tab 3: Complete chronological Audit Trail.
   - Mention CSV and PDF reports are also generated instantly with zero cloud dependencies.

---

## ⏱️ Minute 2:45 – 3:00 | The Benchmark: Radical Honesty & The Close
1. **Navigate to "Benchmark":**
   - Click **Benchmark** in the sidebar.
   - Show the judges the live empirical accuracy against ground truth:
     - **Recall: 100.0%** (Found all 100 ground-truth electrical symbols).
     - **Precision: 86.2%** (All 16 edge cases were safely flagged for review).
     - **F1 Score: 92.6%**.
     - **Time Saved: 99.6%** (17 seconds of AI computation vs 75 minutes of manual table counting).
2. **Closing Punchline:**
   > *"ElectroScan AI doesn't hide uncertainty; it empowers contractors to bid faster, win more jobs, and eliminate estimating errors with 100% click-to-source accountability. Thank you."*
