from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import json
import time
import sys
import os

# -----------------------------
# CONFIGURATION
# -----------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"  # Ollama local API
MODEL_NAME = "prakriti-chat:latest"                 # Your chat model

app = Flask(__name__)
CORS(app)

# In-memory chat history (per session)
chat_history = []

# -----------------------------
# HELPERS
# -----------------------------
def build_prompt(user_input: str) -> str:
    """Constructs a natural multi-turn prompt using recent conversation."""
    prompt = (
        "You are Prakriti AI — an expert sustainability and waste management assistant. "
        "Provide concise, factual, and eco-conscious guidance. "
        "Answer in a concise to the point manner. Do not paste long paragraphs\n"
        "Use warm and natural language, but stay professional.\n\n"
    )

    # include the last few turns
    for msg in chat_history[-6:]:
        prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"

    prompt += f"User: {user_input}\nAssistant:"
    return prompt


# -----------------------------
# ROUTES
# -----------------------------
@app.route("/chat", methods=["POST"])
def chat():
    """Main chat endpoint with SSE streaming or standard JSON fallback."""
    # 🧹 Instantly unload vision model from GPU memory before launching chat
    try:
        requests.post("http://localhost:11434/api/generate", json={
            "model": "prakriti-vision:latest",
            "prompt": "",
            "keep_alive": 0
        }, timeout=5)
        time.sleep(1.5)  # ⏳ Give Ollama scheduler time to release GPU VRAM
    except Exception:
        pass

    data = request.get_json(force=True)
    user_input = data.get("message", "").strip()

    if not user_input:
        return jsonify({"error": "Missing 'message' field"}), 400

    print(f"👤 User: {user_input}")

    prompt = build_prompt(user_input)

    # Check if the client requested SSE stream or standard JSON
    accept_header = request.headers.get("Accept", "")
    use_stream = "text/event-stream" in accept_header or data.get("stream", False)

    if use_stream:
        def generate():
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": True,
                "keep_alive": 0
            }
            full_reply = ""
            try:
                with requests.post(OLLAMA_URL, json=payload, stream=True) as r:
                    r.raise_for_status()
                    for line in r.iter_lines():
                        if not line:
                            continue
                        try:
                            data_json = json.loads(line.decode("utf-8"))
                            chunk = data_json.get("response", "")
                            full_reply += chunk
                            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                        except json.JSONDecodeError:
                            continue
                
                chat_history.append({"role": "user", "content": user_input})
                chat_history.append({"role": "assistant", "content": full_reply.strip()})
                print(f"🪷 Prakriti AI: {full_reply.strip()}\n")
            except Exception as e:
                print(f"❌ Error during generation: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(generate(), mimetype="text/event-stream")
    else:
        # Standard JSON fallback for robust mobile client compatibility
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "keep_alive": 0
        }
        try:
            r = requests.post(OLLAMA_URL, json=payload, timeout=120)
            r.raise_for_status()
            data_json = r.json()
            reply = data_json.get("response", "").strip()
            
            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": reply})
            print(f"🪷 Prakriti AI (JSON): {reply}\n")
            
            return jsonify({
                "assistant": reply,
                "context_length": len(chat_history),
                "model": MODEL_NAME
            })
        except Exception as e:
            print(f"❌ Error communicating with Ollama: {e}")
            return jsonify({"error": str(e)}), 500


@app.route("/clear_history", methods=["POST"])
def clear_history():
    """Clears in-memory chat history."""
    chat_history.clear()
    return jsonify({"status": "cleared", "message": "Chat history reset"}), 200


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "PrakritiK Chat API",
        "model": MODEL_NAME
    }), 200


def pre_warm():
    """Disabled pre-warming to conserve startup VRAM on low-memory GPU."""
    print(f"🌀 [Pre-warming] Skipped active loading of '{MODEL_NAME}' to conserve VRAM on boot.")

# -----------------------------
# ENTRY POINT
# -----------------------------
if __name__ == "__main__":
    print("🌿 Starting PrakritiK AI Chat API Server...")
    # Only pre-warm in the active main process to avoid duplicate runs due to Werkzeug reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        pre_warm()
    app.run(host="0.0.0.0", port=8001, debug=True)
