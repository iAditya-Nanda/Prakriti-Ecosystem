#!/bin/bash

# 🌿 Prakriti Ecosystem - All-in-One Execution Script
# This script starts the Blockchain, Central API, AI Servers, and Dashboard.

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n🛑 Stopping all Prakriti services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup EXIT SIGINT SIGTERM

echo "🚀 Initializing Prakriti Ecosystem..."

# 1. Start Green Points Blockchain (Backend)
echo "🔗 Starting Green Points Blockchain (Port 5000)..."
cd greenPoints-local-Blockchain
python3 server.py > ../blockchain.log 2>&1 &
cd ..

# 2. Start Prakriti Central API (API)
echo "🌐 Starting Prakriti Central API (Port 8080)..."
cd Prakriti-Apis
python3 server.py > ../api.log 2>&1 &
cd ..

# 3. Start AI Vision Server
echo "👁️ Starting AI Vision Server (Port 8000)..."
cd ai-backend
python3 prakriti_ai_vision_server.py > ../vision.log 2>&1 &
cd ..

# 4. Start AI Chat Server
echo "💬 Starting AI Chat Server (Port 8001)..."
cd ai-backend
python3 prakriti_ai_chat_server.py > ../chat.log 2>&1 &
cd ..

# 5. Start Prakriti Dashboard (Web/Electron)
echo "📊 Starting Prakriti Dashboard (Port 5173)..."
cd Prakriti-Dashboard
# Note: If you have a specific 'electron run' command, replace 'npm run dev' below.
npm run dev > ../dashboard.log 2>&1 &
cd ..

# 6. Start Prakriti App (Mobile - Optional)
# echo "📱 Starting Prakriti App (Expo)..."
# cd Prakriti-App && npx expo start &

echo "✅ All services are starting in the background!"
echo "📄 Logs are being written to: blockchain.log, api.log, vision.log, chat.log, dashboard.log"
echo "💡 Press Ctrl+C to stop all services."

# Keep the script running to maintain background jobs
wait
