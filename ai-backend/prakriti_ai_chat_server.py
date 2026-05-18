from flask import Flask, request, jsonify
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
        "Answer in a concise to the point manner. Do not paste long paragraphs"
        "Use warm and natural language, but stay professional.\n\n"
    )

    # include the last few turns
    for msg in chat_history[-6:]:
        prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"

    prompt += f"User: {user_input}\nAssistant:"
    return prompt


def query_ollama(prompt: str):
    """Sends the prompt to the Ollama model and returns the complete response."""
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": True,
        "keep_alive": -1
    }

    response_text = ""
    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True) as r:
            r.raise_for_status()
            for line in r.iter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line.decode("utf-8"))
                    chunk = data.get("response", "")
                    response_text += chunk
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"❌ Error communicating with Ollama: {e}")
        return None

    return response_text.strip()


# -----------------------------
# ROUTES
# -----------------------------
@app.route("/chat", methods=["POST"])
def chat():
    """Main chat endpoint."""
    data = request.get_json(force=True)
    user_input = data.get("message", "").strip()

    if not user_input:
        return jsonify({"error": "Missing 'message' field"}), 400

    print(f"👤 User: {user_input}")

    prompt = build_prompt(user_input)
    reply = query_ollama(prompt)

    if not reply:
        return jsonify({"error": "No response from model"}), 500

    chat_history.append({"role": "user", "content": user_input})
    chat_history.append({"role": "assistant", "content": reply})

    print(f"🪷 PrakritiK AI: {reply}\n")

    return jsonify({
        "assistant": reply,
        "context_length": len(chat_history),
        "model": MODEL_NAME
    })


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
    """Sync/blocking pre-warming on boot to ensure model is fully loaded before server starts serving."""
    print(f"🌀 [Pre-warming] Proactively loading and initializing chat model '{MODEL_NAME}'...")
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": "Hello",  # Actual prompt to warm up the model completely
            "stream": False,
            "keep_alive": -1
        }
        start_time = time.time()
        requests.post(OLLAMA_URL, json=payload, timeout=180)
        print(f"✨ [Pre-warming] Chat model '{MODEL_NAME}' is fully warmed up in {time.time() - start_time:.2f}s and ready!")
    except Exception as e:
        print(f"⚠️ [Pre-warming Failed] Could not load model '{MODEL_NAME}': {e}")

# -----------------------------
# ENTRY POINT
# -----------------------------
if __name__ == "__main__":
    print("🌿 Starting PrakritiK AI Chat API Server...")
    # Only pre-warm in the active main process to avoid duplicate runs due to Werkzeug reloader
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        pre_warm()
    app.run(host="0.0.0.0", port=8001, debug=True)
