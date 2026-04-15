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

        return jsonify({
            "message": "Signup successful",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "contact": new_user.contact,
                "role": new_user.role,
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
                    "role": role_map[password]
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

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "contact": user.contact,
            "role": user.role
        }
    }), 200
