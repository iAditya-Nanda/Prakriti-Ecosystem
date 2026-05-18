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

echo "🧹 Cleaning and freeing active ports (5000, 8080, 8000, 8001, 5173)..."
for port in 5000 8080 8000 8001 5173; do
    fuser -k -n tcp $port 2>/dev/null || true
done
sleep 1

# 1. Start Green Points Blockchain (Backend)
echo "🔗 Starting Green Points Blockchain (Port 5000)..."
cd greenPoints-local-Blockchain
python3 -u server.py > ../blockchain.log 2>&1 &
cd ..

# 2. Start Prakriti Central API (API)
echo "🌐 Starting Prakriti Central API (Port 8080)..."
cd Prakriti-Apis
python3 -u server.py > ../api.log 2>&1 &
cd ..

# 3. Start AI Vision Server
echo "👁️ Starting AI Vision Server (Port 8000)..."
cd ai-backend
python3 -u prakriti_ai_vision_server.py > ../vision.log 2>&1 &
cd ..

# 4. Start AI Chat Server
echo "💬 Starting AI Chat Server (Port 8001)..."
cd ai-backend
python3 -u prakriti_ai_chat_server.py > ../chat.log 2>&1 &
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

echo "✅ All services launched in the background!"
echo "📄 Logs are being written to: blockchain.log, api.log, vision.log, chat.log, dashboard.log"
echo "--------------------------------------------------------"
echo "🔍 Monitoring startup pre-warming in real-time..."
echo "--------------------------------------------------------"

# 1. Monitor Blockchain
(
    for i in {1..10}; do
        if grep -q "Server running at" blockchain.log 2>/dev/null; then
            echo "🟢 Blockchain Server: Active on Port 5000!"
            break
        elif grep -q "Address already in use" blockchain.log 2>/dev/null; then
            echo "⚠️ Blockchain Server: Port 5000 is already in use by another program!"
            break
        fi
        sleep 1
    done
) &

# 2. Monitor Central API
(
    for i in {1..10}; do
        if grep -q "Serving Flask app" api.log 2>/dev/null; then
            if grep -q "Address already in use" api.log 2>/dev/null; then
                echo "⚠️ Central API Server: Port 8080 is already in use!"
            else
                echo "🟢 Central API Server: Active on Port 8080!"
            fi
            break
        fi
        sleep 1
    done
) &

# 3. Monitor Chat Server
(
    while true; do
        if grep -q "Serving Flask app" chat.log 2>/dev/null; then
            echo "🟢 AI Chat Server: Active on Port 8001!"
            break
        elif grep -q "Address already in use" chat.log 2>/dev/null; then
            echo "⚠️ AI Chat Server: Port 8001 is already in use!"
            break
        elif grep -q "Error" chat.log 2>/dev/null; then
            echo "❌ AI Chat Server: Encountered an error during startup!"
            break
        fi
        sleep 1
    done
) &

# 4. Monitor Vision Server
(
    while true; do
        if grep -q "Serving Flask app" vision.log 2>/dev/null; then
            echo "🟢 AI Vision Server: Active on Port 8000!"
            break
        elif grep -q "Address already in use" vision.log 2>/dev/null; then
            echo "⚠️ AI Vision Server: Port 8000 is already in use!"
            break
        elif grep -q "Error" vision.log 2>/dev/null; then
            echo "❌ AI Vision Server: Encountered an error during startup!"
            break
        fi
        sleep 1
    done
) &

echo "💡 Press Ctrl+C at any time to stop all services."
echo "--------------------------------------------------------"

# Keep the script running to maintain background jobs
wait
