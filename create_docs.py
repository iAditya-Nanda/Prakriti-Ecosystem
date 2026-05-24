import os

base_dir = "/Users/adityananda/MyWorkspace/Prakriti/docs"
dirs = [
    "research", "economy", "blockchain", "business", 
    "architecture", "product", "roadmap", "launch"
]

for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

docs = {
    "research/product-analysis.md": "# Product Analysis\nPrakriti is a sustainability ecosystem leveraging AI vision and a local blockchain to reward eco-friendly actions.",
    "economy/gp-economy-design.md": "# GP Economy Design\nGreen Points (GP) act as a utility reward asset representing verified environmental impact.",
    "economy/economic-foundation.md": "# Economic Foundation\nGP avoids inflation via expiration, platform burns, and collateralized fiat backing from sponsors.",
    "blockchain/blockchain-strategy.md": "# Blockchain Strategy\nCurrently local SQLite PoW. Target migration: Layer 2 Public Chain (e.g. Polygon/Base) at 100k+ users.",
    "business/revenue-model.md": "# Revenue Model\nSaaS fees for Green Partners, Corporate ESG Data Sales, Transaction Fees on Fiat to GP conversions.",
    "architecture/system-architecture.md": "# System Architecture\nFrontend: React Native Expo (Tourist/Business) + Vite React (Admin).\nBackend: Flask + SQLite + Ollama (LLaVA/Llama).",
    "launch/launch-readiness.md": "# Launch Readiness\nScore: 60/100. Pending: Hardened Authentication, Analytics Dashboard, Stress Testing.",
    "roadmap/implementation-roadmap.md": "# Implementation Roadmap\nPhase 1: Launch Critical (Auth, Flows). Phase 2: Growth. Phase 3: Scale.",
    "roadmap/current-status-audit.md": """# Current Status Audit
- **Completed**: AI Vision integration, Blockchain SQLite ledger base, basic React Native UI screens.
- **Partially Completed**: Business portal (screens exist, backend needs wiring), Auth (JWT logic exists, UI needs refinement).
- **Missing**: Admin Analytics, Production Security Hardening.
- **Technical Debt**: SQLite blockchain won't scale.
- **Priority**: Fix Auth and Core user flows first.
""",
    "architecture/current-system-map.md": """# Current System Map
- **Frontend**: `prakriti-app` (Mobile/Expo), `prakriti-dashboard` (Web/Vite).
- **Backend**: `prakriti-apis` (Flask REST API).
- **AI**: Local Ollama server (`prakriti-chat`, `prakriti-vision`).
- **Blockchain**: Simulated PoW in `db.py` (`blocks`, `blockchain_transactions`).
""",
    "roadmap/gap-analysis.md": """# Gap Analysis
Current Implementation vs Vision:
- **P0 (Launch Critical)**: Robust Wallet UI, Live Reward Syncing, Business QR Verification Flow completion.
- **P1 (High Priority)**: Verifier Dashboard UX, Leaderboard live updates.
- **P2 (Nice To Have)**: Real-time map heatmaps, advanced streak visuals.
""",
    "roadmap/execution-plan.md": """# Execution Plan
- **Phase 1 (Launch Critical)**: Complete Auth, Waste Flow, Reward Engine, Wallet System. (Estimated 2 weeks).
- **Phase 2 (Growth)**: Referrals, Business Portal polish, NGO integrations.
- **Phase 3 (Scale)**: L2 Blockchain migration, Enterprise Analytics.
""",
    "README.md": """# Prakriti Knowledge Repository
Master index for all system documentation.
- [Product Analysis](research/product-analysis.md)
- [Economy Design](economy/gp-economy-design.md)
- [Economic Foundation](economy/economic-foundation.md)
- [Blockchain Strategy](blockchain/blockchain-strategy.md)
- [Revenue Model](business/revenue-model.md)
- [System Architecture](architecture/system-architecture.md)
- [Current System Map](architecture/current-system-map.md)
- [Current Status Audit](roadmap/current-status-audit.md)
- [Gap Analysis](roadmap/gap-analysis.md)
- [Execution Plan](roadmap/execution-plan.md)
- [Implementation Roadmap](roadmap/implementation-roadmap.md)
- [Launch Readiness](launch/launch-readiness.md)
"""
}

for filepath, content in docs.items():
    with open(os.path.join(base_dir, filepath), "w") as f:
        f.write(content)

print(f"Created {len(docs)} documentation files.")
