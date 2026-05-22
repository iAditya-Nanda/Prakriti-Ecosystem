import time
import hashlib
import json
import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from db import SessionLocal, Block, BlockchainTransaction, BCUser, BCQRCode, BCPendingVerification, BCLeaderboardCache
from utils import blockchain_engine

blockchain_bp = Blueprint("blockchain", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def serialize_verification(v: BCPendingVerification) -> dict:
    try:
        metadata = json.loads(v.metadata_json or "{}")
    except Exception:
        metadata = {}
    return {
        "id": v.id,
        "user_id": v.user_id,
        "task_type": v.task_type,
        "evidence": v.evidence,
        "image_path": v.image_path,
        "location": v.location,
        "latitude": v.latitude,
        "longitude": v.longitude,
        "submitted_at": v.submitted_at,
        "verified_at": v.verified_at,
        "verified_by": v.verified_by,
        "status": v.status,
        "rejection_reason": v.rejection_reason,
        "reward_amount": v.reward_amount,
        "transaction_id": v.transaction_id,
        "metadata": metadata
    }

# ==================== USER ENDPOINTS ====================

@blockchain_bp.route("/sync-user", methods=["POST"])
def sync_user():
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    role = data.get("role", "user")

    if not email and not phone:
        return jsonify({"success": False, "message": "Either email or phone is required", "data": None}), 400

    db = SessionLocal()
    try:
        # Check if user already exists
        user = None
        if email:
            user = db.query(BCUser).filter_by(email=email).first()
        if not user and phone:
            user = db.query(BCUser).filter_by(phone=phone).first()

        if user:
            # Sync exists, return successfully to match original behavior
            balance = blockchain_engine.get_balance(db, user.wallet_address)
            return jsonify({
                "success": True,
                "message": "User already synchronized",
                "data": {
                    "user_id": user.id,
                    "wallet_address": user.wallet_address,
                    "name": user.name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "balance": balance
                }
            })

        # Generate unique wallet address
        wallet_address = hashlib.sha256(f"{name}_{time.time()}".encode()).hexdigest()[:20]

        new_user = BCUser(
            name=name,
            email=email,
            phone=phone,
            role=role,
            wallet_address=wallet_address,
            created_at=time.time(),
            is_active=1
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "data": {
                "user_id": new_user.id,
                "wallet_address": new_user.wallet_address,
                "name": new_user.name,
                "email": new_user.email,
                "phone": new_user.phone,
                "role": new_user.role,
                "balance": 0.0
            }
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    phone = data.get("phone")

    if not email and not phone:
        return jsonify({"success": False, "message": "Either email or phone is required", "data": None}), 400

    db = SessionLocal()
    try:
        user = None
        if email:
            user = db.query(BCUser).filter_by(email=email).first()
        if not user and phone:
            user = db.query(BCUser).filter_by(phone=phone).first()

        if not user:
            return jsonify({"success": False, "message": "User not found", "data": None}), 404

        balance = blockchain_engine.get_balance(db, user.wallet_address)

        return jsonify({
            "success": True,
            "message": "Login successful",
            "data": {
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "wallet_address": user.wallet_address,
                "balance": balance,
                "created_at": user.created_at
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    db = SessionLocal()
    try:
        user = db.query(BCUser).filter_by(id=user_id).first()
        if not user:
            return jsonify({"success": False, "message": "User not found", "data": None}), 404

        balance = blockchain_engine.get_balance(db, user.wallet_address)

        approved_count = db.query(BCPendingVerification).filter_by(user_id=user_id, status="approved").count()
        qr_count = db.query(BCQRCode).filter_by(used_by=user_id, is_used=1).count()
        history = blockchain_engine.get_transaction_history(db, user.wallet_address)
        total_gp = sum(tx["amount"] for tx in history if tx["to"] == user.wallet_address)

        stats = {
            "tasks_completed": approved_count + qr_count,
            "total_GP_earned": total_gp,
            "submissions_count": db.query(BCPendingVerification).filter_by(user_id=user_id).count()
        }

        return jsonify({
            "success": True,
            "message": "Profile retrieved",
            "data": {
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "balance": balance,
                "stats": stats,
                "created_at": user.created_at
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/balance/<int:user_id>", methods=["GET"])
def get_balance(user_id):
    db = SessionLocal()
    try:
        user = db.query(BCUser).filter_by(id=user_id).first()
        if not user:
            return jsonify({"success": False, "message": "User not found", "data": None}), 404

        balance = blockchain_engine.get_balance(db, user.wallet_address)

        return jsonify({
            "success": True,
            "message": "Balance retrieved",
            "data": {
                "user_id": user_id,
                "name": user.name,
                "balance": balance,
                "currency": "GP"
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

# ==================== TASK ENDPOINTS ====================

@blockchain_bp.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = [
        {
            "task_type": "waste_disposal",
            "name": "Proper Waste Disposal",
            "description": "Dispose waste in the correct bin (recyclable, organic, or general waste)",
            "base_reward": 20.0,
            "requires_verification": True,
            "verification_criteria": "Photo showing waste being disposed in correct bin with visible bin label"
        },
        {
            "task_type": "litter_report",
            "name": "Report Littered Spot",
            "description": "Report a littered location for cleanup",
            "base_reward": 30.0,
            "requires_verification": True,
            "verification_criteria": "Photo of littered area with visible location/landmark"
        },
        {
            "task_type": "qr_scan",
            "name": "Eco-Business Visit",
            "description": "Visit and support an eco-registered business",
            "base_reward": 0.0,
            "requires_verification": False,
            "verification_criteria": "Valid QR code from registered business"
        },
        {
            "task_type": "recycling",
            "name": "Recycling Achievement",
            "description": "Recycle at least 5kg of materials",
            "base_reward": 50.0,
            "requires_verification": True,
            "verification_criteria": "Photo of recycling with visible weight/quantity"
        },
        {
            "task_type": "tree_planting",
            "name": "Plant a Tree",
            "description": "Plant a tree in your community",
            "base_reward": 100.0,
            "requires_verification": True,
            "verification_criteria": "Photo of planted tree with visible sapling"
        },
        {
            "task_type": "community",
            "name": "Community Cleanup",
            "description": "Participate in community cleanup event",
            "base_reward": 80.0,
            "requires_verification": True,
            "verification_criteria": "Photo from cleanup event showing participation"
        }
    ]
    return jsonify({
        "success": True,
        "message": "Tasks retrieved",
        "data": {"tasks": tasks, "total_count": len(tasks)}
    })

@blockchain_bp.route("/submit-waste", methods=["POST"])
def submit_waste():
    data = request.json or {}
    user_id = data.get("user_id")
    evidence = data.get("evidence")
    image_path = data.get("image_path")
    waste_type = data.get("waste_type", "general")

    if not user_id or not evidence:
        return jsonify({"success": False, "message": "user_id and evidence are required", "data": None}), 400

    db = SessionLocal()
    try:
        user = db.query(BCUser).filter_by(id=user_id).first()
        if not user or user.role != "user":
            return jsonify({"success": False, "message": "Invalid user", "data": None}), 400

        new_verification = BCPendingVerification(
            user_id=user_id,
            task_type="waste_disposal",
            evidence=evidence,
            image_path=image_path,
            submitted_at=time.time(),
            status="pending",
            reward_amount=20.0,
            metadata_json=json.dumps({"waste_type": waste_type})
        )
        db.add(new_verification)
        db.commit()
        db.refresh(new_verification)

        return jsonify({
            "success": True,
            "message": "Waste disposal submitted for verification",
            "data": {
                "verification_id": new_verification.id,
                "expected_reward": 20.0,
                "status": "pending",
                "estimated_verification_time": "24 hours"
            }
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/submit-litter", methods=["POST"])
def submit_litter():
    data = request.json or {}
    user_id = data.get("user_id")
    evidence = data.get("evidence")
    image_path = data.get("image_path")
    location = data.get("location")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    severity = data.get("severity", "medium")

    if not user_id or not evidence:
        return jsonify({"success": False, "message": "user_id and evidence are required", "data": None}), 400

    db = SessionLocal()
    try:
        user = db.query(BCUser).filter_by(id=user_id).first()
        if not user or user.role != "user":
            return jsonify({"success": False, "message": "Invalid user", "data": None}), 400

        severity_multiplier = {
            "low": 1.0,
            "medium": 1.2,
            "high": 1.5
        }
        reward = round(30.0 * severity_multiplier.get(severity.lower(), 1.2), 2)

        new_verification = BCPendingVerification(
            user_id=user_id,
            task_type="litter_report",
            evidence=evidence,
            image_path=image_path,
            location=location,
            latitude=latitude,
            longitude=longitude,
            submitted_at=time.time(),
            status="pending",
            reward_amount=reward,
            metadata_json=json.dumps({"severity": severity})
        )
        db.add(new_verification)
        db.commit()
        db.refresh(new_verification)

        return jsonify({
            "success": True,
            "message": "Litter report submitted for verification",
            "data": {
                "verification_id": new_verification.id,
                "expected_reward": reward,
                "severity": severity,
                "status": "pending"
            }
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/submissions/<int:user_id>", methods=["GET"])
def get_submissions(user_id):
    status = request.args.get("status")
    db = SessionLocal()
    try:
        query = db.query(BCPendingVerification).filter_by(user_id=user_id)
        if status:
            query = query.filter_by(status=status)
        submissions = query.order_by(BCPendingVerification.submitted_at.desc()).all()

        serialized = [serialize_verification(s) for s in submissions]

        return jsonify({
            "success": True,
            "message": "Submissions retrieved",
            "data": {"submissions": serialized, "total_count": len(serialized)}
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

# ==================== QR CODE ENDPOINTS ====================

@blockchain_bp.route("/qr/generate", methods=["POST"])
def generate_qr():
    data = request.json or {}
    business_id = data.get("business_id")
    contact = data.get("contact")
    reward_amount = data.get("reward_amount")
    service_description = data.get("service_description", "")
    expires_in_hours = data.get("expires_in_hours")
    custom_qr_code = data.get("custom_qr_code")

    if not reward_amount or reward_amount <= 0:
        return jsonify({"success": False, "message": "Reward amount must be positive", "data": None}), 400

    db = SessionLocal()
    try:
        business = None
        if business_id:
            business = db.query(BCUser).filter_by(id=business_id).first()
        elif contact:
            business = db.query(BCUser).filter((BCUser.email == contact) | (BCUser.phone == contact)).first()

        if not business or business.role != "business":
            return jsonify({"success": False, "message": "Only businesses can generate QR codes", "data": None}), 400

        qr_code = custom_qr_code or f"GP-{business.id:04d}-{hashlib.sha256(f'{business.id}_{reward_amount}_{service_description}_{time.time()}'.encode()).hexdigest()[:12].upper()}"

        expires_at = time.time() + (expires_in_hours * 3600) if expires_in_hours else None

        new_qr = BCQRCode(
            qr_code=qr_code,
            business_id=business.id,
            business_name=business.name,
            reward_amount=reward_amount,
            service_description=service_description,
            created_at=time.time(),
            expires_at=expires_at,
            is_used=0
        )
        db.add(new_qr)
        db.commit()
        db.refresh(new_qr)

        return jsonify({
            "success": True,
            "message": "QR code created successfully",
            "data": {
                "qr_code": new_qr.qr_code,
                "reward_amount": new_qr.reward_amount,
                "service_description": new_qr.service_description,
                "expires_in_hours": expires_in_hours
            }
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/qr/scan", methods=["POST"])
def scan_qr():
    data = request.json or {}
    user_id = data.get("user_id")
    contact = data.get("contact")
    qr_code = data.get("qr_code")

    if not qr_code:
        return jsonify({"success": False, "message": "qr_code is required", "data": None}), 400

    db = SessionLocal()
    try:
        user = None
        if user_id:
            user = db.query(BCUser).filter_by(id=user_id).first()
        elif contact:
            user = db.query(BCUser).filter((BCUser.email == contact) | (BCUser.phone == contact)).first()

        if not user or user.role != "user":
            return jsonify({"success": False, "message": "User not found", "data": None}), 400

        qr = db.query(BCQRCode).filter_by(qr_code=qr_code).first()
        if not qr:
            return jsonify({"success": False, "message": "QR code not found", "data": None}), 404

        if qr.is_used == 1:
            return jsonify({"success": False, "message": "QR code already used", "data": None}), 400

        if qr.expires_at and time.time() > qr.expires_at:
            return jsonify({"success": False, "message": "QR code expired", "data": None}), 400

        # Process reward directly
        tx_id = blockchain_engine.add_transaction(
            db,
            sender="SYSTEM",
            recipient=user.wallet_address,
            amount=qr.reward_amount,
            transaction_type="qr_reward",
            task_id=qr.qr_code,
            task_name=f"Business Visit: {qr.business_name}"
        )

        qr.is_used = 1
        qr.used_by = user.id
        qr.used_at = time.time()
        qr.transaction_id = tx_id
        db.commit()

        # Mine reward block immediately
        blockchain_engine.mine_pending_transactions(db, "SYSTEM")

        return jsonify({
            "success": True,
            "message": f"Earned {qr.reward_amount} GP from {qr.business_name}!",
            "data": {
                "transaction_id": tx_id,
                "amount": qr.reward_amount,
                "business_name": qr.business_name,
                "service": qr.service_description,
                "timestamp": time.time(),
                "block_mined": True,
                "transaction_confirmed": True
            }
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/qr/info/<qr_code>", methods=["GET"])
def get_qr_info(qr_code):
    db = SessionLocal()
    try:
        qr = db.query(BCQRCode).filter_by(qr_code=qr_code).first()
        if not qr:
            return jsonify({"valid": False, "message": "QR code not found", "data": None}), 404

        is_valid = True
        message = "QR code is valid"

        if qr.is_used == 1:
            is_valid = False
            message = "QR code already used"
        elif qr.expires_at and time.time() > qr.expires_at:
            is_valid = False
            message = "QR code expired"

        return jsonify({
            "valid": is_valid,
            "message": message,
            "data": {
                "business_name": qr.business_name,
                "reward_amount": qr.reward_amount,
                "service_description": qr.service_description,
                "is_used": bool(qr.is_used),
                "created_at": qr.created_at,
                "expires_at": qr.expires_at,
                "expired": bool(qr.expires_at and time.time() > qr.expires_at)
            }
        })
    except Exception as e:
        return jsonify({"valid": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

# ==================== LEADERBOARD ====================

@blockchain_bp.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    limit = request.args.get("limit", 10, type=int)
    db = SessionLocal()
    try:
        blockchain_engine.rebuild_leaderboard(db)
        board = db.query(BCLeaderboardCache).order_by(BCLeaderboardCache.total_gp.desc()).limit(limit).all()

        serialized = []
        for idx, row in enumerate(board):
            serialized.append({
                "user_id": row.user_id,
                "name": row.name,
                "total_gp": row.total_gp,
                "tasks_completed": row.tasks_completed,
                "rank": idx + 1,
                "last_updated": row.last_updated
            })

        return jsonify({
            "success": True,
            "message": "Leaderboard retrieved",
            "data": {
                "leaderboard": serialized,
                "total_count": len(serialized),
                "last_updated": time.time()
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

# ==================== ADMIN ENDPOINTS ====================

@blockchain_bp.route("/admin/verifications", methods=["GET"])
def get_pending_verifications():
    db = SessionLocal()
    try:
        verifications = db.query(BCPendingVerification).filter_by(status="pending").all()
        serialized = [serialize_verification(v) for v in verifications]

        return jsonify({
            "success": True,
            "message": "Pending verifications retrieved",
            "data": {"verifications": serialized, "total_count": len(serialized)}
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/admin/approve/<int:verification_id>", methods=["POST"])
def approve_verification(verification_id):
    data = request.json or {}
    admin_name = data.get("admin_name", "SYSTEM")

    db = SessionLocal()
    try:
        verification = db.query(BCPendingVerification).filter_by(id=verification_id).first()
        if not verification:
            return jsonify({"success": False, "message": "Verification not found", "data": None}), 404

        if verification.status != "pending":
            return jsonify({"success": False, "message": f"Verification already {verification.status}", "data": None}), 400

        user = db.query(BCUser).filter_by(id=verification.user_id).first()
        if not user:
            return jsonify({"success": False, "message": "Associated user not found", "data": None}), 404

        tx_id = blockchain_engine.add_transaction(
            db,
            sender="SYSTEM",
            recipient=user.wallet_address,
            amount=verification.reward_amount,
            transaction_type="task_reward",
            task_id=str(verification.id),
            task_name=verification.task_type.replace("_", " ").title()
        )

        verification.status = "approved"
        verification.verified_at = time.time()
        verification.verified_by = admin_name
        verification.transaction_id = tx_id
        db.commit()

        # Mine block immediately
        blockchain_engine.mine_pending_transactions(db, "SYSTEM")

        return jsonify({
            "success": True,
            "message": "Verification approved",
            "data": {
                "verification_id": verification.id,
                "user_name": user.name,
                "reward_amount": verification.reward_amount,
                "transaction_id": tx_id,
                "block_mined": True,
                "reward_confirmed": True
            }
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/admin/reject/<int:verification_id>", methods=["POST"])
def reject_verification(verification_id):
    data = request.json or {}
    reason = data.get("reason")
    admin_name = data.get("admin_name", "SYSTEM")

    if not reason:
        return jsonify({"success": False, "message": "reason is required", "data": None}), 400

    db = SessionLocal()
    try:
        verification = db.query(BCPendingVerification).filter_by(id=verification_id).first()
        if not verification:
            return jsonify({"success": False, "message": "Verification not found", "data": None}), 404

        if verification.status != "pending":
            return jsonify({"success": False, "message": f"Verification already {verification.status}", "data": None}), 400

        verification.status = "rejected"
        verification.rejection_reason = reason
        verification.verified_at = time.time()
        verification.verified_by = admin_name
        db.commit()

        return jsonify({
            "success": True,
            "message": "Verification rejected",
            "data": {"verification_id": verification_id, "reason": reason}
        })
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

# ==================== UTILITIES ====================

@blockchain_bp.route("/stats", methods=["GET"])
def get_stats():
    db = SessionLocal()
    try:
        total_users = db.query(BCUser).filter_by(role="user").count()
        total_businesses = db.query(BCUser).filter_by(role="business").count()
        blockchain_length = db.query(Block).count()
        pending_transactions = db.query(BlockchainTransaction).filter_by(block_index=None).count()
        pending_verifications = db.query(BCPendingVerification).filter_by(status="pending").count()
        active_qr_codes = db.query(BCQRCode).filter_by(is_used=0).count()

        total_gp = 0.0
        users = db.query(BCUser).filter_by(role="user").all()
        for u in users:
            total_gp += blockchain_engine.get_balance(db, u.wallet_address)

        return jsonify({
            "success": True,
            "message": "System stats retrieved",
            "data": {
                "total_users": total_users,
                "total_businesses": total_businesses,
                "blockchain_length": blockchain_length,
                "pending_transactions": pending_transactions,
                "pending_verifications": pending_verifications,
                "active_qr_codes": active_qr_codes,
                "total_gp_circulation": total_gp,
                "mining_difficulty": blockchain_engine.DIFFICULTY
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/transactions/<int:user_id>", methods=["GET"])
def get_transactions(user_id):
    limit = request.args.get("limit", 50, type=int)
    db = SessionLocal()
    try:
        user = db.query(BCUser).filter_by(id=user_id).first()
        if not user:
            return jsonify({"success": False, "message": "User not found", "data": None}), 404

        history = blockchain_engine.get_transaction_history(db, user.wallet_address)
        history = history[-limit:]

        return jsonify({
            "success": True,
            "message": "Transaction history retrieved",
            "data": {"transactions": history, "total_count": len(history)}
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

@blockchain_bp.route("/mine", methods=["POST"])
def mine_block():
    data = request.json or {}
    miner = data.get("miner", "SYSTEM")

    db = SessionLocal()
    try:
        pending_count = db.query(BlockchainTransaction).filter_by(block_index=None).count()
        if pending_count == 0:
            return jsonify({"success": False, "message": "No pending transactions", "data": None}), 400

        block = blockchain_engine.mine_pending_transactions(db, miner)

        return jsonify({
            "success": True,
            "message": f"Block #{block['index']} mined successfully",
            "data": {
                "block_index": block["index"],
                "block_hash": block["hash"],
                "transactions_count": len(block["transactions"]),
                "miner_reward": blockchain_engine.MINING_REWARD
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "data": None}), 500
    finally:
        db.close()

# ==================== IMAGE UPLOAD ====================

@blockchain_bp.route("/upload-image", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No file selected"}), 400

    try:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        file.save(filepath)

        return jsonify({
            "success": True,
            "path": f"/uploads/{filename}",
            "filename": filename
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== HEALTH CHECK ====================

@blockchain_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Green Points Blockchain API",
        "version": "1.0.0"
    })

@blockchain_bp.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Green Points Blockchain API",
        "version": "1.0.0",
        "endpoints": {
            "users": {
                "POST /api/sync-user": "Register new user",
                "POST /api/login": "Login user",
                "GET /api/profile/<user_id>": "Get user profile",
                "GET /api/balance/<user_id>": "Get user balance"
            },
            "tasks": {
                "GET /api/tasks": "Get available tasks",
                "POST /api/submit-waste": "Submit waste disposal",
                "POST /api/submit-litter": "Submit litter report",
                "GET /api/submissions/<user_id>": "Get user submissions"
            },
            "qr_codes": {
                "POST /api/qr/generate": "Generate QR code (business)",
                "POST /api/qr/scan": "Scan QR code (user)",
                "GET /api/qr/info/<qr_code>": "Get QR code info"
            },
            "admin": {
                "GET /api/admin/verifications": "Get pending verifications",
                "POST /api/admin/approve/<verification_id>": "Approve verification",
                "POST /api/admin/reject/<verification_id>": "Reject verification"
            },
            "utilities": {
                "GET /api/leaderboard": "Get top users",
                "GET /api/transactions/<user_id>": "Get transaction history",
                "GET /api/stats": "Get system statistics",
                "POST /api/mine": "Mine pending transactions",
                "POST /api/upload-image": "Upload image"
            }
        }
    })
