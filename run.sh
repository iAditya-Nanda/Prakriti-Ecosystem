#!/bin/bash

# Colors
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Clean up background processes on exit
cleanup() {
    echo -e "\n${YELLOW}[!] Shutting down Flask server...${NC}"
    # Find jobs started by this script
    JOBS=$(jobs -p)
    if [ -n "$JOBS" ]; then
        echo "$JOBS" | xargs kill -9 2>/dev/null || true
    fi
    echo -e "${GREEN}[+] Done. Port 8080 is free.${NC}"
    exit 0
}

# Function to get primary local IP address
get_local_ip() {
    local ip=""
    # Try ifconfig (common on macOS)
    if [ -z "$ip" ] && command -v ifconfig >/dev/null 2>&1; then
        ip=$(ifconfig 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -n 1)
    fi
    # Try hostname -I (common on Linux)
    if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    # Try ip route (Linux fallback)
    if [ -z "$ip" ] && command -v ip >/dev/null 2>&1; then
        ip=$(ip route get 1 2>/dev/null | awk '{print $7}')
    fi
    echo "$ip"
}

# Trap Ctrl+C (SIGINT) and terminal termination (SIGTERM)
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}[*] Setting up environment...${NC}"

# Activate virtual environment if it exists
if [ ! -d "prakriti_venv" ]; then
    echo -e "${YELLOW}[*] Creating Python virtual environment (prakriti_venv)...${NC}"
    python3 -m venv prakriti_venv
    source prakriti_venv/bin/activate
    if [ -f "requirements.txt" ]; then
        echo -e "${YELLOW}[*] Installing dependencies from requirements.txt...${NC}"
        pip install -r requirements.txt
    elif [ -f "prakriti-apis/requirements.txt" ]; then
        echo -e "${YELLOW}[*] Installing dependencies from prakriti-apis/requirements.txt...${NC}"
        pip install -r prakriti-apis/requirements.txt
    else
        echo -e "${YELLOW}[!] No requirements.txt found; proceeding without installing packages.${NC}"
    fi
else
    source prakriti_venv/bin/activate
fi
echo -e "${GREEN}[+] Virtual environment active.${NC}"

# Optional: free port 8080 in case it is occupied
echo -e "${CYAN}[*] Checking port 8080...${NC}"
if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -t -i:8080)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}[!] Terminated existing process (PID: $PID) using port 8080.${NC}"
        kill -9 $PID 2>/dev/null || true
    fi
elif command -v fuser >/dev/null 2>&1; then
    if [[ "$OSTYPE" != "darwin"* ]]; then
        fuser -k 8080/tcp 2>/dev/null || true
    fi
fi

# Fetch local IP address
LOCAL_IP=$(get_local_ip)

# Start the backend API (port 8080)
echo -e "${CYAN}[*] Starting Flask API server...${NC}"
cd prakriti-apis
python -u server.py > ../api.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait for the Flask server to bind to port 8080 (up to 15 seconds)
echo -e "${CYAN}[*] Waiting for Flask server to bind to port 8080...${NC}"
SERVER_STARTED=false
for i in {1..30}; do
    API_PID=$(lsof -t -i:8080 2>/dev/null || true)
    if [ -n "$API_PID" ]; then
        SERVER_STARTED=true
        break
    fi
    # Check if the python process died early
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}[x] Flask server process died unexpectedly on boot.${NC}"
        break
    fi
    sleep 0.5
done

if [ "$SERVER_STARTED" = false ]; then
    echo -e "${RED}[x] Failed to start Flask server. Check api.log for details:${NC}"
    if [ -f "api.log" ]; then
        tail -n 25 api.log
    fi
    exit 1
fi

echo -e ""
echo -e "${GREEN}====================================================${NC}"
echo -e "       ${GREEN}${BOLD}Prakriti Backend API Successfully Started${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "   ${CYAN}*${NC}  ${BOLD}Local URL:${NC}    ${CYAN}http://localhost:8080${NC}"
if [ -n "$LOCAL_IP" ]; then
    echo -e "   ${CYAN}*${NC}  ${BOLD}Network URL:${NC}  ${CYAN}http://${LOCAL_IP}:8080${NC}"
fi
echo -e "   ${CYAN}*${NC}  ${BOLD}Environment:${NC}  Development (Flask / Debug Mode)"
echo -e "   ${CYAN}*${NC}  ${BOLD}Log File:${NC}     ${YELLOW}api.log${NC}"
echo -e "   ${CYAN}*${NC}  ${BOLD}To View Logs:${NC} ${BOLD}tail -f api.log${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "         ${YELLOW}Press [Ctrl+C] at any time to stop the server${NC}"
echo -e ""

# Keep the script alive to retain the background process
# Disable immediate exit on errors since wait returns non-zero when interrupted
set +e
wait