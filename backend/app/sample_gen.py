import os
import json
import random
import math
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import fitz  # PyMuPDF
import cv2
import numpy as np

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
SAMPLES_DIR = os.path.join(DATA_DIR, "samples")
TEMPLATES_DIR = os.path.join(DATA_DIR, "templates")

PAGE_WIDTH, PAGE_HEIGHT = landscape(A3)  # 1190.55 x 841.89 points

GRID_COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
GRID_ROWS = [1, 2, 3, 4, 5, 6, 7, 8]

def get_grid_ref(norm_x: float, norm_y: float) -> str:
    col_idx = min(int(norm_x * 12), 11)
    row_idx = min(int(norm_y * 8), 7)
    return f"{GRID_COLS[col_idx]}-{GRID_ROWS[row_idx]}"

def draw_title_block(c: canvas.Canvas, sheet_num: int, sheet_title: str):
    # Title block in bottom right corner
    tb_w, tb_h = 280, 110
    x0 = PAGE_WIDTH - 40 - tb_w
    y0 = 40

    c.setStrokeColor(colors.HexColor("#1F2937"))
    c.setLineWidth(1.5)
    c.rect(x0, y0, tb_w, tb_h, fill=0)

    # Subdivisions
    c.line(x0, y0 + 60, x0 + tb_w, y0 + 60)
    c.line(x0, y0 + 30, x0 + tb_w, y0 + 30)
    c.line(x0 + 150, y0, x0 + 150, y0 + 60)

    c.setFillColor(colors.HexColor("#0B3D91"))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x0 + 12, y0 + 82, "ElectroScan AI")

    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 9)
    c.drawString(x0 + 12, y0 + 68, "Intelligent Electrical Takeoff System")

    c.setFillColor(colors.HexColor("#1F2937"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x0 + 12, y0 + 42, f"SHEET {sheet_num}: {sheet_title}")

    c.setFont("Helvetica", 8)
    c.drawString(x0 + 12, y0 + 14, "PROJECT: Commercial Level 2 Takeoff")
    c.drawString(x0 + 160, y0 + 42, "SCALE: 1:50 @ A3")
    c.drawString(x0 + 160, y0 + 14, "ENGINEER: Parth Kala")

def draw_grid_bubbles(c: canvas.Canvas):
    margin = 35
    c.setFont("Helvetica-Bold", 8)
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setFillColor(colors.HexColor("#475569"))
    c.setLineWidth(0.8)

    # Columns A-L across top and bottom
    col_step = (PAGE_WIDTH - 2 * margin) / 12
    for i, col in enumerate(GRID_COLS):
        cx = margin + (i + 0.5) * col_step
        # Top bubble
        c.circle(cx, PAGE_HEIGHT - 20, 10, stroke=1, fill=0)
        c.drawCentredString(cx, PAGE_HEIGHT - 23, col)
        # Bottom bubble
        c.circle(cx, 20, 10, stroke=1, fill=0)
        c.drawCentredString(cx, 17, col)

    # Rows 1-8 down left and right
    row_step = (PAGE_HEIGHT - 2 * margin) / 8
    for i, row in enumerate(GRID_ROWS):
        # Y is inverted in reportlab (0,0 is bottom-left)
        cy = PAGE_HEIGHT - (margin + (i + 0.5) * row_step)
        # Left bubble
        c.circle(20, cy, 10, stroke=1, fill=0)
        c.drawCentredString(20, cy - 3, str(row))
        # Right bubble
        c.circle(PAGE_WIDTH - 20, cy, 10, stroke=1, fill=0)
        c.drawCentredString(PAGE_WIDTH - 20, cy - 3, str(row))

def draw_architectural_background(c: canvas.Canvas, sheet_num: int):
    # Main outer boundary
    c.setStrokeColor(colors.HexColor("#1E293B"))
    c.setLineWidth(2.2)
    c.rect(50, 50, PAGE_WIDTH - 100, PAGE_HEIGHT - 100, fill=0)

    # Room divider walls
    c.setLineWidth(1.8)
    c.line(50, 420, PAGE_WIDTH - 350, 420)
    c.line(380, 50, 380, PAGE_HEIGHT - 50)
    c.line(750, 50, 750, PAGE_HEIGHT - 50)

    # Sub-rooms
    c.line(50, 620, 380, 620)
    c.line(50, 230, 380, 230)
    c.line(380, 600, 750, 600)
    c.line(750, 420, PAGE_WIDTH - 50, 420)
    c.line(750, 650, PAGE_WIDTH - 50, 650)

    # Doors (open arcs)
    c.setStrokeColor(colors.HexColor("#334155"))
    c.setLineWidth(1.0)
    doors = [(380, 500, 30, 90), (380, 300, 30, 270), (750, 510, 30, 90), (750, 250, 30, 270), (200, 420, 30, 0)]
    for dx, dy, r, start_ang in doors:
        c.arc(dx - r, dy - r, dx + r, dy + r, start_ang, 90)
        c.line(dx, dy, dx + (r if start_ang == 0 else 0), dy + (r if start_ang == 90 else 0))

    # Room Labels
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica-Bold", 12)
    rooms = [
        ("CONFERENCE ROOM A", 215, 720),
        ("MAIN OPEN OFFICE", 565, 700),
        ("EXECUTIVE BOARDROOM", 950, 730),
        ("DESIGN WORKSHOP", 215, 520),
        ("ELECTRICAL CLOSET (MDF)", 565, 510),
        ("RESTROOMS & FACILITIES", 950, 530),
        ("CLIENT LOUNGE & BREAKROOM", 215, 140),
        ("DISTRIBUTION SWITCHBOARD ROOM", 565, 230),
        ("HVAC & PLANT ROOM", 950, 230),
    ]
    for r_name, rx, ry in rooms:
        c.drawCentredString(rx, ry, r_name)
        c.setFont("Helvetica", 8)
        c.drawCentredString(rx, ry - 14, "FLR LVL +3.600m")
        c.setFont("Helvetica-Bold", 12)

    # General Notes on sheet
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 7)
    notes = [
        "GENERAL ELECTRICAL NOTES:",
        "1. ALL CIRCUITS TO CONFORM WITH IEEE & NEC STANDARDS.",
        "2. CONDUIT TO BE EMT 3/4\" MINIMUM CONCEALED IN SLAB OR DROPPED CEILING.",
        "3. MOUNTING HEIGHT: LIGHT SWITCHES @ 1200mm AFF, RECEPTACLES @ 450mm AFF.",
        "4. HOMERUNS INDICATED WITH ARROWHEADS TO PANELBOARD 'LP-2A'."
    ]
    for i, line in enumerate(notes):
        c.drawString(60, 80 - i * 9, line)

# Symbol drawing primitives with rotation
def draw_symbol_vector(c: canvas.Canvas, sym_type: str, x: float, y: float, size: float, rotation_deg: int):
    c.saveState()
    c.translate(x, y)
    c.rotate(rotation_deg)
    r = size / 2.0

    c.setStrokeColor(colors.HexColor("#0F172A"))
    c.setFillColor(colors.white)
    c.setLineWidth(1.3)

    if sym_type == "lighting_fixture":
        # Circle with X inside
        c.circle(0, 0, r, stroke=1, fill=1)
        offset = r * 0.7071
        c.line(-offset, -offset, offset, offset)
        c.line(-offset, offset, offset, -offset)

    elif sym_type == "power_outlet":
        # Circle with two parallel tick lines or straight line + ticks
        c.circle(0, 0, r, stroke=1, fill=1)
        # Baseline through center
        c.line(-r, 0, r, 0)
        # Two vertical ticks extending outward
        c.line(-r * 0.4, 0, -r * 0.4, r)
        c.line(r * 0.4, 0, r * 0.4, r)

    elif sym_type == "switch":
        # Small circle with a stem and hook (standard architectural 'S' symbol)
        switch_r = r * 0.65
        c.circle(0, 0, switch_r, stroke=1, fill=1)
        c.line(0, switch_r, 0, switch_r + r * 0.9)
        c.line(0, switch_r + r * 0.9, r * 0.6, switch_r + r * 0.9)

    elif sym_type == "distractor_smoke":
        # Square with diagonal cross
        c.rect(-r, -r, size, size, stroke=1, fill=1)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(0, -2.5, "SD")

    elif sym_type == "distractor_fan":
        # Triangle/three-lobed fan
        c.circle(0, 0, r * 0.4, stroke=1, fill=1)
        for ang in [0, 120, 240]:
            rad = math.radians(ang)
            c.line(0, 0, r * math.cos(rad), r * math.sin(rad))

    c.restoreState()

def generate_sample_pdf_and_ground_truth():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    os.makedirs(TEMPLATES_DIR, exist_ok=True)

    pdf_path = os.path.join(SAMPLES_DIR, "sample_electrical_plan.pdf")
    gt_path = os.path.join(SAMPLES_DIR, "ground_truth.json")

    random.seed(42)
    np.random.seed(42)

    c = canvas.Canvas(pdf_path, pagesize=landscape(A3))

    ground_truth = {
        "project_name": "Commercial Office - Level 2 (Sample)",
        "sheets": []
    }

    symbol_defs = [
        {"id": "lighting_fixture", "name": "Lighting Fixture", "base_size": 20},
        {"id": "power_outlet", "name": "Power Outlet (Duplex)", "base_size": 18},
        {"id": "switch", "name": "Single-Pole Switch", "base_size": 16},
    ]

    for sheet_idx in range(2):
        sheet_num = sheet_idx + 1
        sheet_title = "Lighting & Controls" if sheet_num == 1 else "Power Distribution & Receptacles"

        draw_grid_bubbles(c)
        draw_architectural_background(c, sheet_num)
        draw_title_block(c, sheet_num, sheet_title)

        sheet_gt = {
            "sheet_index": sheet_idx,
            "sheet_name": f"Sheet {sheet_num} - {sheet_title}",
            "symbols": []
        }

        # Place 45 to 55 valid electrical symbols per sheet
        num_symbols = 50
        placed_boxes = []

        # Connective conduits / wiring lines to draw after
        wire_points = []

        for _ in range(num_symbols):
            sym = random.choice(symbol_defs)
            # Size +- 10%
            scale = random.uniform(0.90, 1.10)
            size = sym["base_size"] * scale
            rot = random.choice([0, 90, 180, 270])

            # Keep symbols inside architectural rooms (avoid title block: x > 850, y < 160)
            for _ in range(50):
                x = random.uniform(80, PAGE_WIDTH - 80)
                y = random.uniform(80, PAGE_HEIGHT - 80)
                if x > PAGE_WIDTH - 340 and y < 170:
                    continue
                # Spacing check
                too_close = False
                for bx, by, br in placed_boxes:
                    if math.hypot(x - bx, y - by) < (size + br + 12):
                        too_close = True
                        break
                if not too_close:
                    break

            placed_boxes.append((x, y, size / 2.0))
            draw_symbol_vector(c, sym["id"], x, y, size, rot)

            # Normalized bounding box: [x0, y0, x1, y1] with y0 top-down (0 is top of page in image space)
            # In ReportLab, y=0 is bottom. Image y = PAGE_HEIGHT - y
            half = size / 2.0 + 1.0
            norm_x0 = (x - half) / PAGE_WIDTH
            norm_x1 = (x + half) / PAGE_WIDTH
            norm_y0 = (PAGE_HEIGHT - (y + half)) / PAGE_HEIGHT
            norm_y1 = (PAGE_HEIGHT - (y - half)) / PAGE_HEIGHT

            center_norm_x = x / PAGE_WIDTH
            center_norm_y = (PAGE_HEIGHT - y) / PAGE_HEIGHT
            grid = get_grid_ref(center_norm_x, center_norm_y)

            sheet_gt["symbols"].append({
                "symbol_id": sym["id"],
                "symbol_name": sym["name"],
                "bbox": [round(norm_x0, 4), round(norm_y0, 4), round(norm_x1, 4), round(norm_y1, 4)],
                "grid_ref": grid,
                "rotation": rot,
                "is_distractor": False
            })

            if random.random() < 0.4:
                wire_points.append((x, y))

        # Add 6 distractor symbols per sheet (must NOT be counted)
        for _ in range(6):
            distractor = random.choice(["distractor_smoke", "distractor_fan"])
            size = 20.0
            for _ in range(40):
                x = random.uniform(90, PAGE_WIDTH - 90)
                y = random.uniform(90, PAGE_HEIGHT - 90)
                if x > PAGE_WIDTH - 340 and y < 170:
                    continue
                too_close = any(math.hypot(x - bx, y - by) < 30 for bx, by, _ in placed_boxes)
                if not too_close:
                    break
            placed_boxes.append((x, y, size / 2.0))
            draw_symbol_vector(c, distractor, x, y, size, 0)

        # Draw realistic conduits / cable route lines connecting some symbols (adds genuine noise/crossing)
        c.setStrokeColor(colors.HexColor("#64748B"))
        c.setLineWidth(0.7)
        c.setDash([3, 3])
        for i in range(len(wire_points) - 1):
            if random.random() < 0.6:
                p1 = wire_points[i]
                p2 = wire_points[i+1]
                if math.hypot(p1[0] - p2[0], p1[1] - p2[1]) < 220:
                    c.line(p1[0], p1[1], p2[0], p2[1])
        c.setDash([])

        ground_truth["sheets"].append(sheet_gt)
        c.showPage()

    c.save()

    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)

    # Render clean standalone template PNGs
    generate_template_images()

    print(f"Sample PDF generated at {pdf_path}")
    print(f"Ground truth written to {gt_path}")

def generate_template_images():
    """Generates clean reference template PNGs for template matching."""
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    temp_pdf = os.path.join(TEMPLATES_DIR, "_temp_templates.pdf")

    # Render each symbol centered on a small 60x60 pt canvas
    c = canvas.Canvas(temp_pdf, pagesize=(60, 60))
    symbols = [
        ("lighting_fixture", 24),
        ("power_outlet", 22),
        ("switch", 20)
    ]
    for sym_id, size in symbols:
        c.setFillColor(colors.white)
        c.rect(0, 0, 60, 60, fill=1, stroke=0)
        draw_symbol_vector(c, sym_id, 30, 30, size, 0)
        c.showPage()
    c.save()

    # Rasterize each page at 150 DPI
    doc = fitz.open(temp_pdf)
    zoom = 150.0 / 72.0
    mat = fitz.Matrix(zoom, zoom)

    for idx, (sym_id, _) in enumerate(symbols):
        page = doc[idx]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out_png = os.path.join(TEMPLATES_DIR, f"{sym_id}.png")
        pix.save(out_png)

        # Crop tightly to the symbol boundary
        img = cv2.imread(out_png, cv2.IMREAD_GRAYSCALE)
        # Find non-white pixels
        inv = 255 - img
        coords = cv2.findNonZero(inv)
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            pad = 4
            x0 = max(0, x - pad)
            y0 = max(0, y - pad)
            x1 = min(img.shape[1], x + w + pad)
            y1 = min(img.shape[0], y + h + pad)
            cropped = img[y0:y1, x0:x1]
            cv2.imwrite(out_png, cropped)

    doc.close()
    if os.path.exists(temp_pdf):
        os.remove(temp_pdf)

def ensure_sample_plan():
    pdf_path = os.path.join(SAMPLES_DIR, "sample_electrical_plan.pdf")
    gt_path = os.path.join(SAMPLES_DIR, "ground_truth.json")
    if not os.path.exists(pdf_path) or not os.path.exists(gt_path):
        generate_sample_pdf_and_ground_truth()

if __name__ == "__main__":
    generate_sample_pdf_and_ground_truth()
