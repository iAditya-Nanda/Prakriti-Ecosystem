from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
import json
import re
import os
import time
import threading
from werkzeug.utils import secure_filename
from datetime import datetime

# -----------------------------
# CONFIG
# -----------------------------
MODEL_NAME = "prakriti-vision:latest"
UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# -----------------------------
# PROMPTS
# -----------------------------
WASTE_PROMPT = """
You are PrakritiK AI — a professional sustainability and waste classification assistant.
Analyze the provided image carefully and identify the object precisely,
not approximately. Respond strictly in valid JSON format.

Your JSON MUST include the following fields:
{
  "summary": "Short description of the object and its material",
  "material": "e.g., LDPE plastic, glass, aluminum, paperboard, organic matter, etc.",
  "disposal_category": "recyclable / non-recyclable / organic / hazardous / mixed",
  "recyclable": true or false,
  "hazardous": true or false,
  "instructions": ["step 1", "step 2", "step 3"],
  "confidence": 0–1,
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

No extra commentary or markdown — only valid JSON output.
"""

LITTER_PROMPT = """
You are PrakritiK AI — an environmental vision model for detecting litter and waste presence.
Analyze the image and decide if it contains visible litter or not.

Return ONLY valid JSON with this format:
{
  "is_litter": true or false,
  "confidence": float between 0.0 and 1.0,
  "summary": "Short plain-English description of what is seen (e.g., 'plastic bottles on roadside', 'clean beach area')",
  "litter_type": "plastic / paper / metal / organic / mixed / none",
  "location_context": "outdoor / indoor / street / natural / unknown",
  "recommendation": "Short action suggestion, e.g. 'Report litter to local authorities' or 'No litter detected — environment is clean'"
}

Guidelines:
- If any trash, garbage, bottles, wrappers, cans, or waste items are visible, set is_litter = true.
- If the image shows a clean area, a person, or an unrelated object, set is_litter = false.
- Be concise and factual.
No extra text outside JSON.
"""

# -----------------------------
# HELPERS
# -----------------------------
def clean_json(raw):
    """Cleans AI output and extracts valid JSON."""
    text = raw.strip()
    start, end = text.find("{"), text.rfind("}") + 1
    if start == -1 or end == 0:
        return None
    text = text[start:end]
    text = re.sub(r',\s*([\]}])', r'\1', text)
    text = re.sub(r'\bTrue\b', 'true', text)
    text = re.sub(r'\bFalse\b', 'false', text)
    return text


def analyze_image(model, img_path, prompt):
    """Sends image and prompt to Ollama model."""
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are PrakritiK AI — an advanced sustainability vision model."},
                {"role": "user", "content": prompt, "images": [img_path]},
            ],
            keep_alive=-1
        )
        raw = response["message"]["content"]
        cleaned = clean_json(raw)
        if not cleaned:
            return None
        return json.loads(cleaned)
    except Exception as e:
        print(f"⚠️ Model error: {e}")
        return None


def logic_layer(result):
    """Post-processing for waste classification."""
    if not result:
        return result
    summary = result.get("summary", "").lower()

    # Example correction: Amul milk pouch
    if "amul" in summary and "milk" in summary:
        result.update({
            "summary": "Amul milk pouch – LDPE plastic",
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

# -----------------------------
# ROUTES
# -----------------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    """Full waste classification endpoint."""
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image = request.files["image"]
    filename = secure_filename(image.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    image.save(filepath)

    print(f"\n🧠 Analyzing waste type: {filename}")
    result = analyze_image(MODEL_NAME, filepath, WASTE_PROMPT)

    if not result:
        return jsonify({"error": "AI failed to return valid JSON"}), 500

    corrected = logic_layer(result)

    response = {
        "timestamp": datetime.utcnow().isoformat(),
        "task": "waste_classification",
        "model_used": MODEL_NAME,
        "source_image": filename,
        "analysis": corrected
    }

    return jsonify(response), 200


@app.route("/detect_litter", methods=["POST"])
def detect_litter():
    """Detects if image shows litter or not."""
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image = request.files["image"]
    filename = secure_filename(image.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    image.save(filepath)

    print(f"\n🌍 Detecting litter presence: {filename}")
    result = analyze_image(MODEL_NAME, filepath, LITTER_PROMPT)

    if not result:
        return jsonify({"error": "AI failed to return valid JSON"}), 500

    response = {
        "timestamp": datetime.utcnow().isoformat(),
        "task": "litter_detection",
        "model_used": MODEL_NAME,
        "source_image": filename,
        "detection": result
    }

    print(f"✅ Litter detection complete for {filename}\n")
    return jsonify(response), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "PrakritiK AI Vision",
        "model": MODEL_NAME,
        "uptime": datetime.utcnow().isoformat()
    }), 200


def pre_warm():
    """Sync/blocking pre-warming on boot to ensure model is fully loaded before server starts serving."""
    print(f"🌀 [Pre-warming] Proactively loading and initializing vision model '{MODEL_NAME}'...")
    try:
        start_time = time.time()
        ollama.generate(model=MODEL_NAME, prompt="Hello", keep_alive=-1)
        print(f"✨ [Pre-warming] Vision model '{MODEL_NAME}' is fully warmed up in {time.time() - start_time:.2f}s and ready!")
    except Exception as e:
        print(f"⚠️ [Pre-warming Failed] Could not load model '{MODEL_NAME}': {e}")

# -----------------------------
# ENTRY POINT
# -----------------------------
if __name__ == "__main__":
    print("🌿 Starting PrakritiK AI Vision Server...")
    # Only pre-warm in the active main process to avoid duplicate runs due to Werkzeug reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        pre_warm()
    app.run(host="0.0.0.0", port=8000, debug=True)
