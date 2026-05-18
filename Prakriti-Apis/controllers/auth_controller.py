from flask import jsonify
from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint, select
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from db import Base, engine, SessionLocal
from utils.security import hash_password, verify_password

# -------------------------------------------
# Define User table directly here
# -------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("role IN ('user', 'business', 'verifier')", name="ck_valid_roles"),
    )

# Create table if not exist
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables verified/created successfully.")
except Exception as e:
    print(f"⚠️ Warning: Database connection failed. Working in Master Login mode only. Error: {e}")

# -------------------------------------------
# Signup Function
# -------------------------------------------
def signup_user(data):
    name = data.get("name")
    contact = data.get("contact")
    password = data.get("password")
    role = data.get("role")

    if not all([name, contact, password, role]):
        return jsonify({"error": "All fields (name, contact, password, role) are required"}), 400

    if role not in ["user", "business", "verifier"]:
        return jsonify({"error": "Invalid role"}), 400

    db = SessionLocal()
    try:
        existing_user = db.execute(select(User).where(User.contact == contact)).scalar_one_or_none()
        if existing_user:
            return jsonify({"error": "Email or Phone already registered"}), 409

        new_user = User(
            name=name.strip(),
            contact=contact.strip(),
            password_hash=hash_password(password),
            role=role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Sync User with local Proof-of-Work Blockchain
        blockchain_wallet = None
        try:
            import requests
            is_email = "@" in new_user.contact
            payload = {
                "name": new_user.name,
                "email": new_user.contact if is_email else f"{new_user.contact}@prakriti.app",
                "phone": new_user.contact if not is_email else None,
                "role": new_user.role
            }
            # Call blockchain user creation API
            blockchain_res = requests.post("http://localhost:5000/api/sync-user", json=payload, timeout=2.0)
            res_data = blockchain_res.json()
            if res_data.get("success"):
                blockchain_wallet = res_data.get("data", {}).get("wallet_address")
                print(f"🔗 Blockchain Synced! Wallet Address: {blockchain_wallet}")
        except Exception as blockchain_err:
            print(f"⚠️ Warning: Failed to sync user wallet with blockchain: {blockchain_err}")

        return jsonify({
            "message": "Signup successful",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "contact": new_user.contact,
                "role": new_user.role,
                "wallet_address": blockchain_wallet,
                "created_at": str(new_user.created_at)
            }
        }), 201

    except IntegrityError:
        db.rollback()
        return jsonify({"error": "Contact already exists"}), 409
    finally:
        db.close()


# -------------------------------------------
# Login Function
# -------------------------------------------
def login_user(data):
    contact = data.get("contact")
    password = data.get("password")

    if not contact or not password:
        return jsonify({"error": "Contact and password are required"}), 400

    # Master Number Bypass with Role Selection
    if contact == "1234567890":
        role_map = {
            "prakriti@user": "user",
            "prakriti@business": "business",
            "prakriti@verifier": "verifier",
            "prakriti@2026": "verifier"  # Default master
        }
        
        if password in role_map:
            return jsonify({
                "message": f"Master Login successful as {role_map[password]}",
                "user": {
                    "id": 9999,
                    "name": f"Master {role_map[password].capitalize()}",
                    "contact": "1234567890",
                    "role": role_map[password],
                    "wallet_address": "GP_MASTER_WALLET_ADDRESS",
                    "balance": 150
                }
            }), 200

    db = SessionLocal()
    user = db.execute(select(User).where(User.contact == contact)).scalar_one_or_none()
    db.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Bypass check for development/master login
    is_master_password = (password == "prakriti@2026")
    
    if not is_master_password and not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid credentials"}), 401

    # Sync and fetch wallet address and real balance from local Blockchain
    blockchain_wallet = None
    blockchain_balance = 0
    try:
        import requests
        is_email = "@" in user.contact
        payload = {
            "email": user.contact if is_email else f"{user.contact}@prakriti.app",
            "phone": user.contact if not is_email else None
        }
        blockchain_res = requests.post("http://localhost:5000/api/login", json=payload, timeout=2.0)
        res_data = blockchain_res.json()
        if res_data.get("success"):
            blockchain_wallet = res_data.get("data", {}).get("wallet_address")
            blockchain_balance = res_data.get("data", {}).get("balance", 0)
    except Exception as blockchain_err:
        print(f"⚠️ Warning: Failed to fetch blockchain details on login: {blockchain_err}")

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "contact": user.contact,
            "role": user.role,
            "wallet_address": blockchain_wallet,
            "balance": blockchain_balance
        }
    }), 200

def get_profile_by_id(user_id):
    if user_id == 9999:
        return jsonify({
            "success": True,
            "user": {
                "id": 9999,
                "name": "Master Verifier",
                "contact": "1234567890",
                "role": "verifier",
                "wallet_address": "GP_MASTER_WALLET_ADDRESS",
                "balance": 150,
                "actions_logged": 42
            }
        }), 200

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Count actions logged (Submissions + Scans)
        from controllers.tourist_submission_controller import TouristSubmission
        from controllers.qr_controller import BusinessQR
        
        submissions_count = db.query(TouristSubmission).filter_by(user_id=user_id).count()
        scans_count = db.query(BusinessQR).filter_by(scanned_by_user=user_id).count()
        actions_logged = submissions_count + scans_count
        
        # Get blockchain balance & wallet
        blockchain_wallet = None
        blockchain_balance = 0
        try:
            import requests
            is_email = "@" in user.contact
            payload = {
                "email": user.contact if is_email else f"{user.contact}@prakriti.app",
                "phone": user.contact if not is_email else None
            }
            blockchain_res = requests.post("http://localhost:5000/api/login", json=payload, timeout=2.0)
            res_data = blockchain_res.json()
            if res_data.get("success"):
                blockchain_wallet = res_data.get("data", {}).get("wallet_address")
                blockchain_balance = res_data.get("data", {}).get("balance", 0)
        except Exception as blockchain_err:
            print(f"⚠️ Warning: Failed to fetch blockchain details: {blockchain_err}")
            
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "contact": user.contact,
                "role": user.role,
                "wallet_address": blockchain_wallet,
                "balance": blockchain_balance,
                "actions_logged": actions_logged
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
