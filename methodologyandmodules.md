# Methodology and Modules Breakdown

## 1. Development Methodology

The Prakriti project follows an **Advanced Agile and Intelligence-First Methodology**, prioritizing decentralized validation and local AI inference.

### 1.1 Project Lifecycle
- **Phase 1: Research & Discovery**: Identification of environmental pain points in Himalayan tourist circuits.
- **Phase 2: Hybrid Architecture Design**: Designing a system that balances centralized metadata (MSSQL) with decentralized rewards (Blockchain).
- **Phase 3: Module Development**: Parallel development of the AI servers, Flask API, and React Native mobile client.
- **Phase 4: Integrity Integration**: Linking the custom blockchain ledger to the backend reward emission logic.
- **Phase 5: Real-world Simulation**: Using the `demo.py` and simulation scripts to validate block mining and reward distribution.

### 1.2 Core Philosophy
- **Decentralization**: No central bank for points; rewards are mined and verified by nodes.
- **Edge Computing**: AI classification is done locally via Ollama to ensure offline capability and data sovereignty.
- **Gamified Conservation**: Using psychological triggers (rewards, leaderboard) to drive sustainability.

---

## 2. Module Granularity

### 2.1 Prakriti-Apis (The Brain)
The coordination hub managing the business logic between users and system services.
- **Authentication Module**: Secure login using JWT, password hashing, and session management.
- **Task Controller**: Manages the lifecycle of an environmental action (Compost, Refill, Cleanup).
- **Business Registry**: A directory of eco-certified vendors. Handles discount validation and point redemption requests.
- **Verification Engine**: Supports dual-mode verification (Automatic via AI or Manual via Verifier account).
- **History & Analytics**: Periodically aggregates user data for the Insight Dashboard.

### 2.2 Green Points Blockchain (The Ledger)
A transparent, immutable database for the project's economy.
- **Consensus Module**: Implements Proof-of-Work. Blocks are verified by finding a SHA-256 hash that satisfies the current difficulty.
- **Transaction Pool**: A memory pool (mempool) that temporarily holds pending Green Point transfers and rewards until they are mined.
- **Wallet Manager**: Handles digital signature verification and balance tracking for every user address in the ecosystem.
- **Mining Module**: Automates the sealing of blocks and handles the emission of GP rewards to the miner's address.

### 2.3 AI Backend (The Intelligence)
Highly specialized servers for contextual understanding.
- **Vision Engine**: 
    - *Input*: Raw images from Mobile App.
    - *Logic*: Uses the `Waste Classification` prompt to extract material data (LDPE/PET/Paper) and `Litter Detection` to verify cleanups.
    - *Output*: Strict JSON format containing confidence scores and category breakdown.
- **Chat Engine**:
    - *Logic*: Manages a rolling history buffer to provide multi-turn sustainability advice.
    - *Context*: Tailored to provide local advice for Himachal Pradesh regions.

### 2.4 Prakriti-App (The Interface)
A performance-optimized mobile experience for iOS and Android.
- **State Management**: Uses React context/state to manage user balance, session data, and offline caches.
- **Navigation System**: A stack/tab-based architecture separating User, Business, and Verifier roles.
- **Scan & Action Module**: Native camera integration for QR code recognition and image capture for AI validation.

### 2.5 Prakriti-Dashboard (The Analytics)
A web-based portal for high-level monitoring.
- **Data Visualizer**: Uses Framer Motion for smooth transitions and SVG-based charting for regional compliance trends.
- **Alert System**: Monitors the API for hotspots—areas where litter detection frequency has spiked significantly.

---

## 3. Communication Protocols
| Interaction | Protocol | Payload |
| :--- | :--- | :--- |
| Mobile → API | HTTPS | JSON (REST) |
| API → AI | HTTP | Multipart/Form-Data (Images) |
| API → Blockchain | Internal Script Call | JSON Objects |
| Cloud/Server → Dashboard | WebSocket/Polling | Real-time Stats |

---
**Standard Methodology Documentation v1.0**  
*Codeforge Team H | Prakriti Project*
