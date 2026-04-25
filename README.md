# 🌿 Prakriti: A Blockchain-Powered Sustainability Ecosystem

[![Status](https://img.shields.io/badge/Status-Active-emerald.svg)]()
[![Environment](https://img.shields.io/badge/Focus-Sustainability-green.svg)]()
[![Tech](https://img.shields.io/badge/Tech-AI%20%2B%20Blockchain-blue.svg)]()

## 📖 Introduction
**Prakriti** (Nature) is a decentralized, AI-integrated ecosystem designed to solve the growing environmental challenge in tourist-heavy and geographically sensitive regions. By combining a **Custom Blockchain** for rewards, **Computer Vision** for waste validation, and **Mobile/Web interfaces**, Prakriti transforms environmental responsibility into a rewarding digital economy.

---

## 🌎 The Need: Why Prakriti?
Current environmental efforts often fail due to:
1. **Lack of Incentives**: Sustainability is seen as a chore rather than a benefit.
2. **Verification Gap**: No reliable way to verify if a user actually planted a tree or recycled.
3. **Data Silos**: Government and local bodies lack real-time visibility into local waste trends.
4. **Tourist Impact**: Popular sites (like the Himachal circuits) face immense littering during peak seasons.

**Prakriti** bridges these gaps by providing a **Verified Reward System** that turns every eco-friendly action into a tangible asset: **Green Points (GP)**.

---

## ✨ Features
- **⛓️ GP Blockchain**: A local, tamper-proof ledger for rewarding eco-actions.
- **👁️ AI Vision Guard**: Automated image classification to verify waste segregation and litter cleanup.
- **💬 PrakritiK AI**: A sustainability-focused LLM providing real-time green guidance.
- **💧 Smart Refill Stations**: QR-based tracking for water and detergent refills to reduce plastic use.
- **📊 Insight Dashboard**: Predictive analytics for administrators to monitor regional compliance and hotspots.
- **🛍️ Green Marketplace**: A registry of eco-certified businesses where GP can be redeemed for discounts.

---

## 🛠️ Project Structure
The repository is organized into five specialized core components:

```bash
Codeforge-teamH/
├── Prakriti-Apis/          # 🐍 Central Flask REST API & MSSQL Integration
├── Prakriti-App/           # 📱 React Native Mobile App (User & Verifier Interface)
├── Prakriti-Dashboard/     # 📊 React/Vite Admin Analytics Panel
├── ai-backend/             # 🤖 Ollama-powered Vision & Chat API Servers
├── greenPoints-local-Blockchain/ # 🧱 Custom Python PoW Blockchain Implementation
└── greenpoints-local/      # 📂 Local media & upload repository
```

---

## 🏗️ The "Good Parts" (Technical Abstract)
- **Local Blockchain (No Gas Fees)**: Unlike Ethereum or Solana, Prakriti uses a custom PoW blockchain designed to run on local servers, making it zero-cost for the user and highly performant for regional scale.
- **Edge AI**: All AI processing (Vision/Chat) is designed to run via local LLM engines (Ollama), ensuring data privacy and reducing dependency on expensive Cloud APIs.
- **PostgreSQL & psycopg2**: A robust open-source database backend ensures that even with the decentralized rewards, user metadata and business registries remain performant and searchable.

---

## 🚀 Advantages
1. **Transparency**: Every tree planted or bottle recycled is etched onto an immutable blockchain.
2. **Behavioral Shift**: Gamification elements (leaderboards, badges) encourage long-term participation.
3. **Circular Economy**: Incentivizes local businesses to go green by driving "Green Point" traffic to their stores.
4. **Data-Driven Policy**: Provides the state with heatmaps of environmental compliance.

---

## 💻 Tech Stack
- **Languages**: Python (Backend/AI/Blockchain), JavaScript (Mobile/Dashboard).
- **Frameworks**: Flask, React Native, React + Vite.
- **Database**: PostgreSQL.
- **AI Engine**: Ollama (prakriti-vision, prakriti-chat).
- **Animation/UI**: Lucide React, Framer Motion.

---

## 🎯 Abstract
Prakriti is more than just an app; it is a **Sustainability-as-a-Service** infrastructure. By creating a feedback loop between **Action → AI Verification → Blockchain Reward → Economic Spending**, it provides a scalable model for any region looking to combat littering and promote a circular economy. Whether you are a tourist looking for a refill station or a business seeking green certification, Prakriti provides the digital backbone to make it happen.

---

## 👥 Contributors
**Codeforge Team H**  
*Advancing the frontier of Green Technology.*

---
> "Nature does not hurry, yet everything is accomplished." — **Prakriti** helps us keep it that way. 🌲
