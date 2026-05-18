import requests
import json
import sys
import time
import base64
import os

# -----------------------------
# CONFIGURATION
# -----------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "prakriti-vision:latest"

# -----------------------------
# HELPERS
# -----------------------------
def typing_print(text, speed=0.015):
    """Simulate typing animation."""
    for ch in text:
        sys.stdout.write(ch)
        sys.stdout.flush()
        time.sleep(speed)
    print()

def encode_image_to_base64(image_path):
    """Convert image to base64 for Ollama input."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

# -----------------------------
# MAIN CHAT LOOP
# -----------------------------
print("🌿 Prakriti Vision Chatbot Terminal (Multimodal Mode)")
print("You can chat or analyze images.")
print("Type 'exit' to quit, or 'image <path>' to send an image.")
print("-" * 70)

history = []

while True:
    user_input = input("👤 You: ").strip()

    if user_input.lower() in ["exit", "quit"]:
        typing_print("\n🪷 Prakriti: Goodbye! Stay eco-conscious 🌱\n")
        break

    image_base64 = None
    image_path = None

    # -----------------------------
    # IMAGE COMMAND DETECTION
    # -----------------------------
    if user_input.lower().startswith("image "):
        image_path = user_input.split(" ", 1)[1].strip()
        if not os.path.exists(image_path):
            print("❌ Image file not found. Please check the path.")
            continue
        
        # Encode the image for Ollama
        image_base64 = encode_image_to_base64(image_path)

        # Automatically generate the eco-analysis prompt
        user_input = (
            "Analyze this image carefully. Identify what is visible, "
            "determine the object or material type, detect any brand markings or labels, "
            "and explain how to dispose of it properly according to Indian waste segregation norms. "
            "Also mention where it should be disposed (e.g., dry waste bin, e-waste center, etc.)."
        )

    # -----------------------------
    # BUILD CONVERSATION PROMPT
    # -----------------------------
    prompt = (
        "You are Prakriti Vision, an AI assistant for eco-analysis and waste recognition.\n"
        "Your task is to describe the contents of the image, identify any brand if visible, "
        "and instruct the user on proper disposal methods under Indian waste management rules.\n"
    )

    for msg in history[-6:]:
        prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"
    prompt += f"User: {user_input}\nAssistant:"

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": True,
        "keep_alive": -1
    }

    if image_base64:
        payload["images"] = [image_base64]

    print("🪷 Prakriti: ", end="", flush=True)

    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True) as r:
            r.raise_for_status()
            reply = ""
            for line in r.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode("utf-8"))
                        chunk = data.get("response", "")
                        for ch in chunk:
                            sys.stdout.write(ch)
                            sys.stdout.flush()
                            time.sleep(0.015)
                        reply += chunk
                    except json.JSONDecodeError:
                        pass
            print("\n")

        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": reply.strip()})

    except requests.exceptions.HTTPError as http_err:
        print(f"\n❌ HTTP Error: {http_err.response.status_code} - {http_err.response.text}\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
