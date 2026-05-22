import hashlib
import time
from datetime import datetime
from flask import jsonify
from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint, select
from sqlalchemy.exc import IntegrityError
from db import Base, engine, SessionLocal, BCUser
from utils.security import hash_password, verify_password, generate_access_token, generate_refresh_token
from utils import blockchain_engine

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
    wallet_address = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("role IN ('user', 'business', 'verifier')", name="ck_valid_roles"),
    )

# Create table if not exist
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables verified/created successfully.")
except Exception as e:
    print(f"Warning: Database connection failed. Working in Master Login mode only. Error: {e}")

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

        # Generate unique wallet address
        wallet_address = hashlib.sha256(f"{name}_{time.time()}".encode()).hexdigest()[:20]

        new_user = User(
            name=name.strip(),
            contact=contact.strip(),
            password_hash=hash_password(password),
            role=role,
            wallet_address=wallet_address
        )
        db.add(new_user)
        db.flush()

        # Sync User with local Proof-of-Work Blockchain tables directly (no external loopbacks)
        try:
            is_email = "@" in new_user.contact
            blockchain_user = BCUser(
                name=new_user.name,
                email=new_user.contact if is_email else None,
                phone=new_user.contact if not is_email else None,
                role=new_user.role,
                wallet_address=wallet_address,
                created_at=time.time(),
                is_active=1
            )
            db.add(blockchain_user)
        except Exception as blockchain_err:
            print(f"Warning: Failed to sync user wallet with blockchain tables: {blockchain_err}")

        db.commit()
        db.refresh(new_user)

        return jsonify({
            "message": "Signup successful",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "contact": new_user.contact,
                "role": new_user.role,
                "wallet_address": wallet_address,
                "created_at": str(new_user.created_at)
            }
        }), 201

    except IntegrityError:
        db.rollback()
        return jsonify({"error": "Contact already exists"}), 409
    except Exception as err:
        db.rollback()
        return jsonify({"error": str(err)}), 500
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
            role = role_map[password]
            # Wrap response with JWT access and refresh tokens
            access_token = generate_access_token(9999, role)
            refresh_token = generate_refresh_token(9999, role)
            return jsonify({
                "message": f"Master Login successful as {role.capitalize()}",
                "token": access_token,
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "user": {
                    "id": 9999,
                    "name": f"Master {role.capitalize()}",
                    "contact": "1234567890",
                    "role": role,
                    "wallet_address": "GP_MASTER_WALLET_ADDRESS",
                    "balance": 150.0
                }
            }), 200

    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.contact == contact)).scalar_one_or_none()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Bypass check for development/master login
        is_master_password = (password == "prakriti@2026")
        
        if not is_master_password and not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid credentials"}), 401

        # Self-healing migration for legacy users without a wallet address
        if not user.wallet_address:
            user.wallet_address = hashlib.sha256(f"{user.name}_{time.time()}".encode()).hexdigest()[:20]
            try:
                is_email = "@" in user.contact
                bc_user = db.query(BCUser).filter((BCUser.email == user.contact) | (BCUser.phone == user.contact)).first()
                if not bc_user:
                    bc_user = BCUser(
                        name=user.name,
                        email=user.contact if is_email else None,
                        phone=user.contact if not is_email else None,
                        role=user.role,
                        wallet_address=user.wallet_address,
                        created_at=time.time(),
                        is_active=1
                    )
                    db.add(bc_user)
                else:
                    bc_user.wallet_address = user.wallet_address
            except Exception as sync_err:
                print(f"Warning: Failed to auto-migrate legacy user: {sync_err}")
            db.commit()

        # Fetch real balance directly from local Blockchain tables
        blockchain_balance = 0.0
        try:
            blockchain_balance = blockchain_engine.get_balance(db, user.wallet_address)
        except Exception as blockchain_err:
            print(f"Warning: Failed to fetch blockchain balance: {blockchain_err}")

        # Wrap login response with JWT access and refresh tokens
        access_token = generate_access_token(user.id, user.role)
        refresh_token = generate_refresh_token(user.id, user.role)

        return jsonify({
            "message": "Login successful",
            "token": access_token,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "contact": user.contact,
                "role": user.role,
                "wallet_address": user.wallet_address,
                "balance": blockchain_balance
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

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
                "balance": 150.0,
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
        
        # Get blockchain balance directly (no external loopbacks)
        blockchain_balance = 0.0
        if user.wallet_address:
            try:
                blockchain_balance = blockchain_engine.get_balance(db, user.wallet_address)
            except Exception as blockchain_err:
                print(f"Warning: Failed to fetch blockchain details: {blockchain_err}")
            
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "contact": user.contact,
                "role": user.role,
                "wallet_address": user.wallet_address,
                "balance": blockchain_balance,
                "actions_logged": actions_logged
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
