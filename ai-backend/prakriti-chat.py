import requests
import json
import time
import sys

# -----------------------------
# CONFIGURATION
# -----------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"  # Ollama local API endpoint
MODEL_NAME = "prakriti-chat:latest"  # Your custom model name

# -----------------------------
# CHAT LOOP
# -----------------------------
print("🌿 Prakriti Chatbot Terminal (Streaming Mode)")
print("Type 'exit' or 'quit' to end the chat.")
print("-" * 60)

history = []

while True:
    user_input = input("👤 You: ").strip()
    if user_input.lower() in ["exit", "quit"]:
        print("\n🪷 Prakriti: Goodbye! Stay eco-conscious 🌱\n")
        break

    # Build conversation context
    prompt = "You are Prakriti, an AI expert in waste classification and eco-guidance.\n"
    for msg in history[-6:]:
        prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"
    prompt += f"User: {user_input}\nAssistant:"

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": True,
        "keep_alive": -1
    }

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
                            time.sleep(0.015)  # typing speed animation
                        reply += chunk
                    except json.JSONDecodeError:
                        pass
            print("\n")
        
        # Save chat history
        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": reply.strip()})

    except Exception as e:
        print(f"\n❌ Error: {e}\n")
