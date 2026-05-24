import os
from sqlalchemy import create_engine, text, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# -------------------------------------------
# Load environment variables
# -------------------------------------------
load_dotenv()

# -------------------------------------------
# Centralized Database Paths & Verification
# -------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "database")

# Ensure the shared database folder exists
if not os.path.exists(DB_DIR):
    try:
        os.makedirs(DB_DIR)
        print(f"Created shared database directory: {DB_DIR}")
    except Exception as path_err:
        print(f"Warning: Failed to create database directory {DB_DIR}: {path_err}")

# Connect exclusively to local SQLite database (Development vs Production modes)
flask_env = os.getenv("FLASK_ENV", "development").lower()
db_filename = "prakriti.db" if flask_env == "production" else "prakriti-dev.db"
sqlite_db_path = os.path.join(DB_DIR, db_filename)
engine = create_engine(f"sqlite:///{sqlite_db_path}", echo=False, future=True, connect_args={"check_same_thread": False})
IS_SQLITE = True
print(f"[Database] Connected to {flask_env.upper()} database ({db_filename}) at: {sqlite_db_path}")

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# -------------------------------------------
# Core Blockchain & Ledger Models
# -------------------------------------------
class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    block_index = Column(Integer, unique=True, index=True, nullable=False)
    timestamp = Column(Float, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    nonce = Column(Integer, nullable=False)
    hash = Column(String(64), unique=True, index=True, nullable=False)

class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(16), unique=True, index=True, nullable=False)
    sender_address = Column(String(255), nullable=False)
    recipient_address = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    timestamp = Column(Float, nullable=False)
    task_id = Column(String(255), nullable=True)
    task_name = Column(String(255), nullable=True)
    block_index = Column(Integer, nullable=True, index=True)

class BCUser(Base):
    __tablename__ = "bc_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(255), unique=True, nullable=True)
    role = Column(String(50), nullable=False)
    wallet_address = Column(String(255), unique=True, nullable=False)
    created_at = Column(Float, nullable=False)
    is_active = Column(Integer, default=1)
    metadata_json = Column(String(1000), name="metadata", default="{}")

class BCQRCode(Base):
    __tablename__ = "bc_qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    qr_code = Column(String(255), unique=True, nullable=False)
    business_id = Column(Integer, nullable=False)
    business_name = Column(String(255), nullable=False)
    reward_amount = Column(Float, nullable=False)
    service_description = Column(String(500), nullable=True)
    created_at = Column(Float, nullable=False)
    expires_at = Column(Float, nullable=True)
    is_used = Column(Integer, default=0)
    used_by = Column(Integer, nullable=True)
    used_at = Column(Float, nullable=True)
    transaction_id = Column(String(255), nullable=True)
    metadata_json = Column(String(1000), name="metadata", default="{}")

class BCPendingVerification(Base):
    __tablename__ = "bc_pending_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    task_type = Column(String(100), nullable=False)
    evidence = Column(String(1000), nullable=True)
    image_path = Column(String(1000), nullable=True)
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    submitted_at = Column(Float, nullable=False)
    verified_at = Column(Float, nullable=True)
    verified_by = Column(String(255), nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    rejection_reason = Column(String(500), nullable=True)
    reward_amount = Column(Float, nullable=True)
    transaction_id = Column(String(255), nullable=True)
    metadata_json = Column(String(1000), name="metadata", default="{}")

class BCLeaderboardCache(Base):
    __tablename__ = "bc_leaderboard_cache"

    user_id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String(255), nullable=False)
    total_gp = Column(Float, nullable=False)
    tasks_completed = Column(Integer, nullable=False)
    rank = Column(Integer, nullable=True)
    last_updated = Column(Float, nullable=False)

# -------------------------------------------

# -------------------------------------------
# Auto-Schema Self-Healing Check
# -------------------------------------------
def verify_and_create_schemas():
    import importlib
    print("[Database] Running database search and self-healing schema verification...")
    
    # Dynamically import controllers to register models on Base.metadata
    controllers = [
        "controllers.auth_controller",
        "controllers.business_controller",
        "controllers.business_apply_controller",
        "controllers.compost_controller",
        "controllers.refill_controller",
        "controllers.tourist_submission_controller",
        "controllers.qr_controller",
        "controllers.verifier_controller"
    ]
    
    for c in controllers:
        try:
            importlib.import_module(c)
        except Exception as err:
            print(f"Warning: Controller dynamic import failed for {c}: {err}")
            
    # Auto-create any missing tables
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as db_err:
        print(f"Critical: Database table creation failed: {db_err}")
        return
        
    # Verify existence of all tables
    from sqlalchemy import inspect
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        print("[Success] Database schema is healthy. Tables present:")
        for table in existing_tables:
            print(f"   - [Table] {table}")
    except Exception as inspect_err:
        print(f"Warning: Failed to inspect database schema: {inspect_err}")

# Execute schema validation on startup
verify_and_create_schemas()

# -------------------------------------------
# Optional: quick test when run directly
# -------------------------------------------
if __name__ == "__main__":
    try:
        with engine.connect() as conn:
            print("SQLite DB connected successfully.")
    except Exception as e:
        print("Connection failed:", e)

