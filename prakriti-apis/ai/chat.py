import os
from flask import Blueprint, request, jsonify, Response
from flask_cors import CORS
import requests
import json
import time
import threading

# -------------------------------------------------
# Configuration
# -------------------------------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "prakriti-chat:latest"

# Blueprint definition
ai_chat_bp = Blueprint('ai_chat', __name__)
CORS(ai_chat_bp)

# In-memory chat history (per process)
chat_history = []

def build_prompt(user_input: str) -> str:
    """Construct a multi‑turn prompt using recent conversation history."""
    base_prompt = (
        "You are Prakriti AI - an expert sustainability and waste management assistant. "
        "Provide concise, factual, and eco‑conscious guidance. "
        "Answer in a concise to the point manner. Do not paste long paragraphs. "
        "Use warm and natural language, but stay professional."
    )
    # Append recent turns (last 6 messages)
    for msg in chat_history[-6:]:
        base_prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"
    base_prompt += f"User: {user_input}\nAssistant:"
    return base_prompt

@ai_chat_bp.route("/chat", methods=["POST"])
def chat():
    """Chat endpoint supporting SSE streaming or JSON fallback."""
    data = request.get_json(force=True)
    user_input = data.get("message", "").strip()
    if not user_input:
        return jsonify({"error": "Missing 'message' field"}), 400
    prompt = build_prompt(user_input)

    accept_header = request.headers.get("Accept", "")
    use_stream = "text/event-stream" in accept_header or data.get("stream", False)

    if use_stream:
        def generate():
            payload = {"model": MODEL_NAME, "prompt": prompt, "stream": True, "keep_alive": 60}
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
                print(f"Prakriti AI: {full_reply.strip()}")
            except Exception as e:
                print(f"[Error] Generation failed: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return Response(generate(), mimetype="text/event-stream")
    else:
        payload = {"model": MODEL_NAME, "prompt": prompt, "stream": False, "keep_alive": 60}
        try:
            r = requests.post(OLLAMA_URL, json=payload, timeout=120)
            r.raise_for_status()
            reply = r.json().get("response", "").strip()
            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": reply})
            return jsonify({
                "assistant": reply,
                "context_length": len(chat_history),
                "model": MODEL_NAME,
            })
        except Exception as e:
            print(f"[Error] Ollama communication failed: {e}")
            return jsonify({"error": str(e)}), 500

@ai_chat_bp.route("/clear_history", methods=["POST"])
def clear_history():
    """Reset the in‑memory chat history."""
    chat_history.clear()
    return jsonify({"status": "cleared", "message": "Chat history reset"}), 200

@ai_chat_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "PrakritiK AI Chat", "model": MODEL_NAME}), 200
