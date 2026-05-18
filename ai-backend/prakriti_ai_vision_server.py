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
        "follow_up_question": "Can we reduce the use of single-use items in our daily routine?"
    }
    try:
        # 1. extract string fields
        for field in ["summary", "material", "disposal_category", "follow_up_question"]:
            field_match = re.search(fr'"{field}"\s*:\s*"([^"]*)"', raw_text)
            if field_match:
                data[field] = field_match.group(1).strip()
            else:
                field_match_lazy = re.search(fr'"{field}"\s*:\s*"([\s\S]*?)"(?=\s*[,}}])', raw_text)
                if field_match_lazy:
                    data[field] = field_match_lazy.group(1).strip().replace("\n", " ")

        # 2. extract booleans
        for field in ["recyclable", "hazardous"]:
            bool_match = re.search(fr'"{field}"\s*:\s*(true|false)', raw_text, re.IGNORECASE)
            if bool_match:
                data[field] = bool_match.group(1).lower() == "true"

        # 3. extract confidence
        conf_match = re.search(r'"confidence"\s*:\s*([0-9.]+)', raw_text)
        if conf_match:
            data["confidence"] = float(conf_match.group(1))

        # 4. extract instructions array
        instr_match = re.search(r'"instructions"\s*:\s*\[([\s\S]*?)\]', raw_text)
        if instr_match:
            items = re.findall(r'"([^"]*)"', instr_match.group(1))
            data["instructions"] = [item.strip() for item in items if item.strip()]
        else:
            instr_match_lazy = re.search(r'"instructions"\s*:\s*\[([\s\S]*?)(?="$|[,}}])', raw_text)
            if instr_match_lazy:
                items = re.findall(r'"([^"]*)"', instr_match_lazy.group(1))
                data["instructions"] = [item.strip() for item in items if item.strip()]

        # 5. extract suggested_alternatives array
        alt_match = re.search(r'"suggested_alternatives"\s*:\s*\[([\s\S]*?)\]', raw_text)
        if alt_match:
            items = re.findall(r'"([^"]*)"', alt_match.group(1))
            data["suggested_alternatives"] = [item.strip() for item in items if item.strip()]

        # 6. Fallback smart defaults for instructions if list is empty
        if not data["instructions"]:
            category = data["disposal_category"].lower()
            if "recyclable" in category and "non-" not in category:
                data["instructions"] = [
                    "Step 1: Clean and rinse any organic/liquid residue from the item.",
                    "Step 2: Dry the item to prevent contamination of other materials.",
                    "Step 3: Dispose of it in your local municipality's designated dry recycling bin."
                ]
                data["recyclable"] = True
            elif "organic" in category:
                data["instructions"] = [
                    "Step 1: Separate from any plastic bags or packaging material.",
                    "Step 2: Place in your local wet/organic composting bin.",
                    "Step 3: Ideal for backyard composting to enrich local soil."
                ]
            elif "hazardous" in category:
                data["instructions"] = [
                    "Step 1: Handle with care to avoid personal injury or chemical exposure.",
                    "Step 2: Store in a sealed container or box away from children.",
                    "Step 3: Drop off at a registered regional hazardous waste collection point."
                ]
                data["hazardous"] = True
            else:
                data["instructions"] = [
                    "Step 1: Check for any small recyclable components (e.g. plastic caps).",
                    "Step 2: Place the main body of the item in the general/landfill bin.",
                    "Step 3: Try to purchase sustainable alternatives for future use."
                ]

        if not data["suggested_alternatives"]:
            data["suggested_alternatives"] = [
                "Consider purchasing items made of zero-plastic, biodegradable materials.",
                "Choose reusable containers and bags instead of disposable ones."
            ]

    except Exception as e:
        print(f"⚠️ [Regex Extractor] Error parsing: {e}")
    return data


def clean_json(raw):
    """Cleans AI output and extracts valid JSON."""
    text = raw.strip()
    start, end = text.find("{"), text.rfind("}") + 1
    if start == -1 or end == 0:
        return None
    text = text[start:end]
    # Replace single quotes with double quotes around keys and strings
    text = re.sub(r"'([^']*)'", r'"\1"', text)
    # Fix trailing commas
    text = re.sub(r',\s*([\]}])', r'\1', text)
    # Correct booleans
    text = re.sub(r'\bTrue\b', 'true', text)
    text = re.sub(r'\bFalse\b', 'false', text)
    return text


def resize_image_if_large(img_path, max_dim=512):
    """Resizes image to a max dimension of max_dim, preserving aspect ratio."""
    try:
        from PIL import Image
        with Image.open(img_path) as img:
            width, height = img.size
            if width > max_dim or height > max_dim:
                if width > height:
                    new_width = max_dim
                    new_height = int(height * (max_dim / width))
                else:
                    new_height = max_dim
                    new_width = int(width * (max_dim / height))
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(img_path, "JPEG", quality=85)
                print(f"📐 [Resize] Downscaled image from {width}x{height} to {new_width}x{new_height} for safety")
    except Exception as e:
        print(f"⚠️ [Resize] Failed to resize image: {e}")


def analyze_image(model, img_path, prompt):
    """Sends image and prompt to Ollama model."""
    # 📐 Cleanly resize image before sending to Ollama to prevent VRAM overflow
    resize_image_if_large(img_path)

    # 🧹 Instantly unload chat model from GPU memory before launching vision analysis
    try:
        import ollama
        ollama.generate(model="prakriti-chat:latest", prompt="", keep_alive=0)
        import time
        time.sleep(1.5)  # ⏳ Give Ollama scheduler time to release GPU VRAM
    except Exception:
        pass

    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are PrakritiK AI — an advanced sustainability vision model."},
                {"role": "user", "content": prompt, "images": [img_path]},
            ],
            keep_alive=0
        )
        raw = response["message"]["content"]
        print(f"\n🤖 [RAW AI RESPONSE]:\n{raw}\n----------------------\n")
        
        cleaned = clean_json(raw)
        if not cleaned:
            print("⚠️ Standard JSON cleaning failed. Falling back to robust regex extractor...")
            return extract_keys_via_regex(raw)
            
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as je:
            print(f"⚠️ json.loads failed on cleaned string: {je}. Falling back to robust regex extractor...")
            return extract_keys_via_regex(raw)
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

    start_time = time.time()
    from datetime import datetime
    print(f"\n📥 [{datetime.utcnow().strftime('%H:%M:%S')}] Received /analyze request for image: {filename}")
    print(f"⏳ Forwarding image to custom LLaVA 7B model (GPU) — Mobile keeps connection alive for 120s max...")

    result = analyze_image(MODEL_NAME, filepath, WASTE_PROMPT)

    duration = time.time() - start_time
    if not result:
        print(f"❌ [{datetime.utcnow().strftime('%H:%M:%S')}] /analyze failed after {duration:.2f}s (AI failed to return valid JSON)")
        return jsonify({"error": "AI failed to return valid JSON"}), 500

    corrected = logic_layer(result)

    response = {
        "timestamp": datetime.utcnow().isoformat(),
        "task": "waste_classification",
        "model_used": MODEL_NAME,
        "source_image": filename,
        "analysis": corrected
    }

    print(f"✨ [{datetime.utcnow().strftime('%H:%M:%S')}] /analyze completed successfully in {duration:.2f}s!")
    print(f"📦 Classified Class: '{corrected.get('class', 'unknown')}' | Confidence: {corrected.get('confidence', 0.0)}")

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

    start_time = time.time()
    from datetime import datetime
    print(f"\n🌍 [{datetime.utcnow().strftime('%H:%M:%S')}] Received /detect_litter request for image: {filename}")
    print(f"⏳ Analyzing litter on LLaVA 7B model (GPU)...")

    result = analyze_image(MODEL_NAME, filepath, LITTER_PROMPT)

    duration = time.time() - start_time
    if not result:
        print(f"❌ [{datetime.utcnow().strftime('%H:%M:%S')}] /detect_litter failed after {duration:.2f}s (AI failed to return valid JSON)")
        return jsonify({"error": "AI failed to return valid JSON"}), 500

    response = {
        "timestamp": datetime.utcnow().isoformat(),
        "task": "litter_detection",
        "model_used": MODEL_NAME,
        "source_image": filename,
        "detection": result
    }

    print(f"✅ Litter detection complete for {filename} in {duration:.2f}s\n")
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
    """Disabled pre-warming to prevent startup VRAM conflicts with Chat model."""
    print(f"🌀 [Pre-warming] Skipped active loading of '{MODEL_NAME}' to conserve VRAM for Chat on boot.")

# -----------------------------
# ENTRY POINT
# -----------------------------
if __name__ == "__main__":
    print("🌿 Starting PrakritiK AI Vision Server...")
    # Only pre-warm in the active main process to avoid duplicate runs due to Werkzeug reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        pre_warm()
    app.run(host="0.0.0.0", port=8000, debug=True)
