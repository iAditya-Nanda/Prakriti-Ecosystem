# 🛠️ Prakriti System Information

## 1. Project Mission & Vision
**Prakriti** is a socio-technological solution for environmental preservation. It aim to transform sustainable behavior from a voluntary act into a rewarded habit by creating a localized circular economy powered by blockchain transparency and AI-driven validation.

---

## 2. Technical Stack Overview
| Component | Technology | Primary Role |
| :--- | :--- | :--- |
| **Backend API** | Python, Flask, SQLAlchemy | Central orchestrator & data management |
| **Database** | PostgreSQL | Persistent storage for users and metadata |
| **Blockchain** | Custom Python implementation | Decentralized GP ledger (PoW) |
| **AI Services** | Ollama, Flask | Waste vision & sustainable chat |
| **Mobile App** | React Native, Expo | User interaction & task logging |
| **Dashboard** | React, Vite, Tailwind/Vanilla CSS | Admin analytics & monitoring |

---

## 3. Component Deep Dive

### 🏗️ Core Backend (Prakriti-Apis)
The backend is organized into modular blueprints for scalability.
- **Authentication**: JWT-based secure login and registration.
- **Task Modules**:
    - `refill_routes`: Manages water/detergent refill station interactions.
    - `compost_routes`: Handles organic waste composting logs.
    - `qr_routes`: Generates and validates unique codes for site-specific tasks.
- **Registry**:
    - `business_routes`: Manages eco-certified partners where points can be spent.
    - `places_routes`: Geographic database of eco-hotspots in Himachal Pradesh.
- **Verification**: `verifier_routes` allows designated officials to confirm complex tasks.

### ⛓️ Green Points Blockchain
A custom, lightweight blockchain designed for regional environmental economies.
- **Consensus**: Proof-of-Work (Difficulty-based hashing).
- **Security**: SHA-256 cryptographic chaining.
- **Economy Logic**:
    - **GP Emission**: Issued by the `SYSTEM` account upon task verification.
    - **Mining Reward**: Incentivizes nodes to validate the ledger (10 GP/block).
    - **Task definitions**: Hardcoded task-reward ratios (e.g., Planting a Tree = 100 GP).
- **Data Structures**: Nonce-based Blocks, Transaction pools, and Address-based Wallets.

### 🤖 AI Backend (PrakritiK AI)
Provides intelligence to the ecosystem using local LLM inference.
- **Vision Server (Port 8000)**: 
    - **Waste Classification**: Analyzes images to determine material (LDPE, Paper, etc.) and provides disposal instructions.
    - **Litter Detection**: Identifies environmental degradation in photos to trigger cleanup tasks.
- **Chat Server (Port 8001)**: 
    - Provides eco-conscious guidance and sustainability tips using the `prakriti-chat` model.

### 📱 Mobile Experience (Prakriti-App)
A cross-platform app designed for the "Eco-Tourist" and "Local Resident" personas.
- **Scan-to-Earn**: Integration with the mobile camera to scan station QR codes.
- **AI Disposal Guide**: Real-time camera feature that tells users exactly how to recycle an item.
- **Eco-Map**: Discover refill stations, composting bins, and green-certified businesses nearby.
- **Wallet**: Check GP balance and transaction history synced with the blockchain.

### 📊 Admin Insights (Prakriti-Dashboard)
A premium visualization tool for state environmental departments.
- **Key Metrics**: Real-time tracking of verified eco-actions and business compliance.
- **Hotspot Alerts**: AI-detected litter spikes in specific regions (e.g., "Rohtang Corridor").
- **Regional Analytics**: Breakdown of sustainability participation across districts like Kullu, Shimla, and Kangra.

---

## 🔄 System Workflow: The Lifecycle of a Green Point
1. **Action**: User plants a tree and takes a photo via the **Prakriti App**.
2. **Validation**: The photo is sent to the **AI Vision Server** for litter/task verification.
3. **Recording**: Upon AI/Verifier approval, the **Backend API** requests a transaction from the **Blockchain**.
4. **Minting**: A new block is mined, recording the reward in the user's decentralized wallet.
5. **Redemption**: User visits a **Green-Certified Business** and spends GP for a discount, verified by the API.

---

## 📂 Logical Directory Structure
```bash
/
├── Prakriti-Apis/          # Flask REST API & PostgreSQL Models
├── Prakriti-App/           # React Native Mobile Frontend
├── Prakriti-Dashboard/     # React Admin Dashboard
├── ai-backend/             # Vision & Chat AI Servers
├── greenPoints-local-Blockchain/ # Custom Blockchain Logic
└── greenpoints-local/      # Asset storage (uploads/logs)
```

---
**System Technical Manual v1.0**  
*Compiled by Antigravity AI for Codeforge Team H*
