import os
import json
import re
import time
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import requests
import ollama
import threading

# -------------------------------------------------
# Configuration
# -------------------------------------------------
MODEL_NAME = "prakriti-vision:latest"
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.getcwd(), "uploads"))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Blueprint definition
ai_vision_bp = Blueprint('ai_vision', __name__)
CORS(ai_vision_bp)

from utils.security import token_required

# -------------------------------------------------
# PROMPTS (same as original)
# -------------------------------------------------
WASTE_PROMPT = """
You are PrakritiK AI - a professional sustainability and waste classification assistant.
Analyze the provided image carefully and identify the object precisely, not approximately. Respond strictly in valid JSON format.

Your JSON MUST include the following fields:
{
  "summary": "Short description of the object and its material",
  "material": "e.g., LDPE plastic, glass, aluminum, paperboard, organic matter, etc.",
  "disposal_category": "recyclable / non-recyclable / organic / hazardous / mixed",
  "recyclable": true or false,
  "hazardous": true or false,
  "instructions": ["step 1", "step 2", "step 3"],
  "confidence": 0-1,
  "category_confidences": {
      "recyclable": float,
      "non-recyclable": float,
      "organic": float,
      "hazardous": float,
      "mixed": float
  },
  "estimated_size": "small / medium / large",
  "suggested_alternatives": ["eco-friendly replacements if possible"],
  "follow_up_question": null or "a relevant sustainability tip/question"
}

No extra commentary or markdown - only valid JSON output.
"""

LITTER_PROMPT = """
You are PrakritiK AI - an environmental vision model for detecting litter and waste presence.
Analyze the image and decide if it contains visible litter or not.

Return ONLY valid JSON with this format:
{
  "is_litter": true or false,
  "confidence": float between 0.0 and 1.0,
  "summary": "Short plain-English description of what is seen (e.g., 'plastic bottles on roadside', 'clean beach area')",
  "litter_type": "plastic / paper / metal / organic / mixed / none",
  "location_context": "outdoor / indoor / street / natural / unknown",
  "recommendation": "Short action suggestion, e.g. 'Report litter to local authorities' or 'No litter detected - environment is clean'"
}

Guidelines:
- If any trash, garbage, bottles, wrappers, cans, or waste items are visible, set is_litter = true.
- If the image shows a clean area, a person, or an unrelated object, set is_litter = false.
- Be concise and factual.
No extra text outside JSON.
"""

# -------------------------------------------------
# HELPERS (same as original, trimmed for brevity)
# -------------------------------------------------
def extract_keys_via_regex(raw_text):
    """Fallback parser that extracts keys from malformed JSON string using regex."""
    data = {
        "summary": "Detected Waste Item",
        "material": "unspecified",
        "disposal_category": "non-recyclable",
        "recyclable": False,
        "hazardous": False,
        "confidence": 0.85,
        "instructions": [],
        "suggested_alternatives": [],
        "follow_up_question": "Can we reduce the use of single-use items in our daily routine?",
    }
    try:
        for field in ["summary", "material", "disposal_category", "follow_up_question"]:
            m = re.search(fr'"{field}"\s*:\s*"([^"]*)"', raw_text)
            if m:
                data[field] = m.group(1).strip()
        for field in ["recyclable", "hazardous"]:
            m = re.search(fr'"{field}"\s*:\s*(true|false)', raw_text, re.IGNORECASE)
            if m:
                data[field] = m.group(1).lower() == "true"
        m = re.search(r'"confidence"\s*:\s*([0-9.]+)', raw_text)
        if m:
            data["confidence"] = float(m.group(1))
        # Extract arrays (instructions, suggested_alternatives)
        for arr in ["instructions", "suggested_alternatives"]:
            m = re.search(fr'"{arr}"\s*:\s*\[([^\]]*)\]', raw_text)
            if m:
                items = re.findall(r'"([^\"]*)"', m.group(1))
                data[arr] = [i.strip() for i in items if i.strip()]
    except Exception as e:
        print(f"[Warning] regex extractor error: {e}")
    return data

def clean_json(raw):
    """Extract valid JSON from the raw model response."""
    txt = raw.strip()
    start, end = txt.find('{'), txt.rfind('}') + 1
    if start == -1 or end == 0:
        return None
    txt = txt[start:end]
    txt = re.sub(r"'([^']*)'", r'"\1"', txt)
    txt = re.sub(r',\s*([\]}])', r'\1', txt)
    txt = re.sub(r'\bTrue\b', 'true', txt)
    txt = re.sub(r'\bFalse\b', 'false', txt)
    return txt

def resize_image_if_large(img_path, max_dim=512):
    try:
        from PIL import Image
        with Image.open(img_path) as img:
            w, h = img.size
            if w > max_dim or h > max_dim:
                if w > h:
                    new_w = max_dim
                    new_h = int(h * (max_dim / w))
                else:
                    new_h = max_dim
                    new_w = int(w * (max_dim / h))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(img_path, "JPEG", quality=85)
                print(f"[Resize] Downscaled {w}x{h} -> {new_w}x{new_h}")
    except Exception as e:
        print(f"[Warning] resize error: {e}")

def analyze_image(model, img_path, prompt):
    resize_image_if_large(img_path)
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are PrakritiK AI - an advanced sustainability vision model."},
                {"role": "user", "content": prompt, "images": [img_path]},
            ],
            keep_alive=120,
        )
        raw = response["message"]["content"]
        cleaned = clean_json(raw)
        if not cleaned:
            return extract_keys_via_regex(raw)
        return json.loads(cleaned)
    except Exception as e:
        print(f"[Error] vision model error: {e}")
        return None

def logic_layer(result):
    if not result:
        return result
    summary = result.get("summary", "").lower()
    if "amul" in summary and "milk" in summary:
        result.update({
            "summary": "Amul milk pouch - LDPE plastic",
            "material": "LDPE plastic",
            "hazardous": False,
            "recyclable": True,
            "disposal_category": "recyclable",
            "instructions": [
                "Empty the pouch completely.",
                "Rinse and dry it to remove milk residue.",
                "If your municipality recycles LDPE, place in plastic recycling.",
                "Otherwise, dispose in general waste."
            ],
            "confidence": 0.95,
            "suggested_alternatives": ["Reusable glass or metal milk containers"]
        })
    return result

# -------------------------------------------------
# ROUTES
# -------------------------------------------------
@ai_vision_bp.route("/analyze", methods=["POST"])
@token_required
def analyze():
    """Endpoint that accepts a captured image and an optional disposal‑proof image.
    The proof image is stored for audit purposes but does not affect the classification logic.
    """
    if "image" not in request.files:
        return jsonify({"error": "No 'image' file provided"}), 400
    # Captured image – mandatory
    image = request.files["image"]
    filename = secure_filename(image.filename)
    captured_path = os.path.join(UPLOAD_FOLDER, filename)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    image.save(captured_path)

    # Optional proof image – second upload
    proof_path = None
    if "proof_image" in request.files:
        proof = request.files["proof_image"]
        proof_filename = secure_filename(proof.filename)
        proof_path = os.path.join(UPLOAD_FOLDER, f"proof_{proof_filename}")
        proof.save(proof_path)

    start_time = time.time()
    print(f"[Received] [{datetime.utcnow().strftime('%H:%M:%S')}] /analyze with captured={filename}, proof={bool(proof_path)}")
    result = analyze_image(MODEL_NAME, captured_path, WASTE_PROMPT)
    duration = time.time() - start_time
    if not result:
        return jsonify({"error": "AI failed to return valid JSON"}), 500
    corrected = logic_layer(result)
    response = {
        "timestamp": datetime.utcnow().isoformat(),
        "task": "waste_classification",
        "model_used": MODEL_NAME,
        "source_image": filename,
        "proof_image": os.path.basename(proof_path) if proof_path else None,
        "analysis": corrected,
        "duration_seconds": round(duration, 2),
    }
    return jsonify(response), 200

@ai_vision_bp.route("/detect_litter", methods=["POST"])
@token_required
def detect_litter():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    image = request.files["image"]
    filename = secure_filename(image.filename)
    path = os.path.join(UPLOAD_FOLDER, filename)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    image.save(path)
    start = time.time()
    print(f"[Received] [{datetime.utcnow().strftime('%H:%M:%S')}] /detect_litter for {filename}")
    result = analyze_image(MODEL_NAME, path, LITTER_PROMPT)
    if not result:
        return jsonify({"error": "AI failed to return valid JSON"}), 500
    return jsonify({
        "timestamp": datetime.utcnow().isoformat(),
        "task": "litter_detection",
        "model_used": MODEL_NAME,
        "source_image": filename,
        "detection": result,
        "duration_seconds": round(time.time() - start, 2),
    }), 200

@ai_vision_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "PrakritiK AI Vision", "model": MODEL_NAME}), 200
