// Prakriti Ecosystem Centralized Configuration
// This enables switching between Local Host (Emulator/Simulator), Tailscale, and LAN IPs dynamically.

// Fallback IP to use if EXPO_PUBLIC_SERVER_IP is not defined in the environment
const FALLBACK_IP = "http://localhost";

// Read from the Expo public environment variable (which is automatically loaded from the .env file)
// Make sure to trim any trailing slashes to avoid issues
const rawIp = process.env.EXPO_PUBLIC_SERVER_IP || FALLBACK_IP;
export const BASE_IP = rawIp.replace(/\/$/, "");

// Microservices Ports Mapping
export const SERVER_8080 = `${BASE_IP}:8080`; // Central API
export const SERVER_5000 = `${BASE_IP}:8080`; // Integrated Green Points Blockchain
export const SERVER_8000 = `${BASE_IP}:8080`; // Redirect AI Vision to central API
export const SERVER_8001 = `${BASE_IP}:8080`; // Redirect AI Chat to central API

// Core AI endpoints
export const CHAT_URL = `${SERVER_8001}/api/v1/ai/chat`;
export const CLEAR_URL = `${SERVER_8001}/api/v1/ai/clear_history`;
export const ANALYZE_URL = `${SERVER_8000}/api/v1/ai/analyze`;

// Export convenience server constants matching original codebase usage
export const SERVER_IP = BASE_IP;
export const SERVER = SERVER_8080;
export const SERVER_CHECK = SERVER_8080;
export const SUBMIT_SERVER = SERVER_8080;
export const API_BASE = `${SERVER_8080}/api/v1/auth/signup`;
export const API_URL = `${SERVER_8080}/api/v1/auth/login`;
