import random
import uuid
import time
from datetime import datetime
from flask import jsonify, request
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from db import Base, engine, SessionLocal, BCQRCode, BCUser
from utils import blockchain_engine

# -------------------------------------------
# QR Table
# -------------------------------------------
class BusinessQR(Base):
    __tablename__ = "business_qr"

    id = Column(Integer, primary_key=True, index=True)
    qr_code = Column(String(100), unique=True, nullable=False)  # unique QR ID
    business_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)  # refill | purchase | eco-action
    is_scanned = Column(Boolean, default=False)
    points_awarded = Column(Integer, nullable=True)
    scanned_by_user = Column(Integer, nullable=True)  # user_id
    created_at = Column(DateTime, default=datetime.utcnow)
    scanned_at = Column(DateTime, nullable=True)

# Create tables if not exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as err:
    print(f"Warning: Failed to verify business_qr table: {err}")


# -------------------------------------------
# Generate New QR for a Business
# -------------------------------------------
def generate_qr():
    db = SessionLocal()
    try:
        data = request.get_json()
        if not data or "business_id" not in data or "action" not in data:
            return jsonify({"error": "business_id and action are required"}), 400

        qr_id = str(uuid.uuid4())[:8].upper()  # short unique ID like "AB12CD34"

        new_qr = BusinessQR(
            qr_code=qr_id,
            business_id=data["business_id"],
            action=data["action"]
        )
        db.add(new_qr)
        db.flush()

        # Directly sync QR with local Proof-of-Work Blockchain tables (no external loopbacks)
        try:
            from controllers.auth_controller import User
            biz_user = db.query(User).filter_by(id=data["business_id"]).first()
            if biz_user:
                reward_amount = 15.0  # Standard reward amount for verified green actions
                service_description = f"Green Action: {data['action']}"
                expires_at = time.time() + 86400  # Default 24 hours expiry
                
                new_bc_qr = BCQRCode(
                    qr_code=qr_id,
                    business_id=biz_user.id,
                    business_name=biz_user.name,
                    reward_amount=reward_amount,
                    service_description=service_description,
                    created_at=time.time(),
                    expires_at=expires_at,
                    is_used=0
                )
                db.add(new_bc_qr)
        except Exception as blockchain_err:
            print(f"Warning: Failed to sync generated QR on blockchain tables: {blockchain_err}")

        db.commit()
        db.refresh(new_qr)

        return jsonify({
            "message": "QR generated successfully",
            "qr": {
                "qr_id": new_qr.qr_code,
                "business_id": new_qr.business_id,
                "action": new_qr.action,
                "is_scanned": new_qr.is_scanned,
                "created_at": str(new_qr.created_at)
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# Check QR Status (for refresh every 2-3s)
# -------------------------------------------
def check_qr_status(qr_id):
    db = SessionLocal()
    try:
        qr = db.query(BusinessQR).filter_by(qr_code=qr_id).first()
        if not qr:
            return jsonify({"error": "QR not found"}), 404

        return jsonify({
            "qr_id": qr.qr_code,
            "business_id": qr.business_id,
            "action": qr.action,
            "is_scanned": qr.is_scanned,
            "points_awarded": qr.points_awarded,
            "scanned_by_user": qr.scanned_by_user,
            "scanned_at": str(qr.scanned_at) if qr.scanned_at else None
        }), 200
    finally:
        db.close()


# -------------------------------------------
# Mark QR as Scanned + Reward Points
# -------------------------------------------
def mark_qr_scanned():
    db = SessionLocal()
    try:
        data = request.get_json()
        if not data or "qr_id" not in data or "user_id" not in data:
            return jsonify({"error": "qr_id and user_id are required"}), 400

        qr = db.query(BusinessQR).filter_by(qr_code=data["qr_id"]).first()
        if not qr:
            return jsonify({"error": "QR not found"}), 404
            
        from controllers.auth_controller import User
        biz_name = "Green Partner Location"
        biz_user = db.query(User).filter_by(id=qr.business_id).first()
        if biz_user:
            biz_name = biz_user.name

        if qr.is_scanned:
            return jsonify({
                "message": "QR scan confirmed, points issued",
                "qr_id": qr.qr_code,
                "points_awarded": qr.points_awarded or 15,
                "scanned_by_user": qr.scanned_by_user,
                "scanned_at": str(qr.scanned_at) if qr.scanned_at else str(datetime.utcnow()),
                "business_name": biz_name,
                "action": qr.action
            }), 200

        # Look up user contact
        user = db.query(User).filter_by(id=data["user_id"]).first()
        
        qr.is_scanned = True
        qr.scanned_by_user = data["user_id"]
        
        # Default points
        points = random.randint(5, 15)
        
        # Process reward directly on blockchain database structures
        blockchain_points = None
        if user:
            try:
                bc_qr = db.query(BCQRCode).filter_by(qr_code=qr.qr_code).first()
                if bc_qr and bc_qr.is_used == 0:
                    bc_user = db.query(BCUser).filter((BCUser.email == user.contact) | (BCUser.phone == user.contact)).first()
                    if not bc_user:
                        bc_user = BCUser(
                            name=user.name,
                            email=user.contact if "@" in user.contact else None,
                            phone=user.contact if "@" not in user.contact else None,
                            role=user.role,
                            wallet_address=user.wallet_address or f"GP_{str(uuid.uuid4())[:16]}",
                            created_at=time.time(),
                            is_active=1
                        )
                        db.add(bc_user)
                        db.flush()

                    if not user.wallet_address:
                        user.wallet_address = bc_user.wallet_address

                    tx_id = blockchain_engine.add_transaction(
                        db,
                        sender="SYSTEM",
                        recipient=bc_user.wallet_address,
                        amount=bc_qr.reward_amount,
                        transaction_type="qr_reward",
                        task_id=bc_qr.qr_code,
                        task_name=f"Business Visit: {bc_qr.business_name}"
                    )
                    
                    bc_qr.is_used = 1
                    bc_qr.used_by = user.id
                    bc_qr.used_at = time.time()
                    bc_qr.transaction_id = tx_id
                    
                    # Mine the reward block immediately
                    blockchain_engine.mine_pending_transactions(db, "SYSTEM")
                    blockchain_points = int(bc_qr.reward_amount)
            except Exception as blockchain_err:
                print(f"Warning: Failed to process QR scan reward on blockchain database: {blockchain_err}")

        qr.points_awarded = blockchain_points or points
        qr.scanned_at = datetime.utcnow()

        db.commit()

        return jsonify({
            "message": "QR scan confirmed, points issued",
            "qr_id": qr.qr_code,
            "points_awarded": qr.points_awarded,
            "scanned_by_user": qr.scanned_by_user,
            "scanned_at": str(qr.scanned_at),
            "business_name": biz_name,
            "action": qr.action
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
