import os
import random
import time
import uuid
from datetime import datetime
from flask import jsonify, request
from werkzeug.utils import secure_filename
from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint, ForeignKey
from db import Base, engine, SessionLocal, BCUser, BCPendingVerification
from utils import blockchain_engine

# -------------------------------------------
# Upload Config
# -------------------------------------------
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------------------------------
# Tourist Submissions Table
# -------------------------------------------
class TouristSubmission(Base):
    __tablename__ = "tourist_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False, default="tourist")
    title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    image_url = Column(String(1000), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending|approved|rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_id = Column(Integer, nullable=True)
    remarks = Column(String(500), nullable=True)
    blockchain_tx = Column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint("type = 'tourist'", name="ck_only_tourist_type"),
        CheckConstraint("status IN ('pending','approved','rejected')", name="ck_valid_submission_status"),
    )


# -------------------------------------------
# User Points Table
# -------------------------------------------
class UserPoints(Base):
    __tablename__ = "user_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    submission_id = Column(Integer, ForeignKey("tourist_submissions.id"), nullable=False)
    points = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    blockchain_tx = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------------------------
# Upload Catalog Table
# -------------------------------------------
class UploadCatalog(Base):
    __tablename__ = "upload_catalog"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(1000), nullable=False)
    associated_type = Column(String(50), nullable=True)  # "tourist_submission" | "business_application"
    associated_id = Column(Integer, nullable=True)        # ID of the submission/application
    uploaded_by_user = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# Verify/create tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as err:
    print(f"Warning: Failed to verify tourist_submissions tables: {err}")


# -------------------------------------------
# Upload Image
# -------------------------------------------
def upload_submission_image():
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "empty filename"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "unsupported file type"}), 400

    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    filename = secure_filename(file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    unique_name = f"{timestamp}_{filename}"
    path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(path)

    # Log inside UploadCatalog
    db = SessionLocal()
    try:
        user_id_val = request.form.get("user_id") or request.args.get("user_id")
        user_id = int(user_id_val) if user_id_val else None
        
        url_path = f"/uploads/{unique_name}"
        catalog_entry = UploadCatalog(
            filename=unique_name,
            original_name=file.filename,
            file_path=url_path,
            uploaded_by_user=user_id
        )
        db.add(catalog_entry)
        db.commit()
    except Exception as log_err:
        print(f"Warning: Failed to log upload catalog: {log_err}")
    finally:
        db.close()

    return jsonify({
        "message": "uploaded",
        "url": f"/uploads/{unique_name}"
    }), 201


# -------------------------------------------
# Add Tourist Submission
# -------------------------------------------
def add_tourist_submission(data: dict):
    for f in ["user_id", "title", "location"]:
        if f not in data or not str(data[f]).strip():
            return jsonify({"error": f"{f} is required"}), 400

    db = SessionLocal()
    try:
        sub = TouristSubmission(
            user_id=int(data["user_id"]),
            title=data["title"].strip(),
            location=data["location"].strip(),
            image_url=data.get("image_url"),
            status="pending"
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

        # Try to associate with UploadCatalog
        if sub.image_url:
            filename = os.path.basename(sub.image_url)
            catalog_entry = db.query(UploadCatalog).filter(UploadCatalog.filename == filename).first()
            if catalog_entry:
                catalog_entry.associated_type = "tourist_submission"
                catalog_entry.associated_id = sub.id
                if not catalog_entry.uploaded_by_user:
                    catalog_entry.uploaded_by_user = sub.user_id
                db.commit()

        return jsonify({
            "message": "submission created",
            "submission": {
                "id": sub.id,
                "user_id": sub.user_id,
                "title": sub.title,
                "location": sub.location,
                "image": sub.image_url,
                "status": sub.status,
                "timestamp": sub.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# Get All Submissions
# -------------------------------------------
def get_all_tourist_submissions():
    status = (request.args.get("status") or "").strip().lower()
    user_id = request.args.get("user_id")

    db = SessionLocal()
    try:
        q = db.query(TouristSubmission)
        if status in {"pending", "approved", "rejected"}:
            q = q.filter(TouristSubmission.status == status)
        if user_id:
            q = q.filter(TouristSubmission.user_id == int(user_id))

        apps = q.order_by(TouristSubmission.created_at.desc()).all()
        data = [{
            "id": a.id,
            "user_id": a.user_id,
            "title": a.title,
            "location": a.location,
            "status": a.status,
            "image": a.image_url,
            "timestamp": a.created_at.isoformat(),
            "reviewer_id": a.reviewer_id,
            "remarks": a.remarks,
            "blockchain_tx": a.blockchain_tx
        } for a in apps]

        return jsonify({"submissions": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# Approve/Reject Submission + Award Points
# -------------------------------------------
def review_submission(submission_id: int, data: dict):
    action = (data.get("action") or "").lower()
    if action not in {"approve", "reject"}:
        return jsonify({"error": "action must be 'approve' or 'reject'"}), 400

    db = SessionLocal()
    try:
        sub = db.get(TouristSubmission, submission_id)
        if not sub:
            return jsonify({"error": "submission not found"}), 404

        sub.status = "approved" if action == "approve" else "rejected"
        sub.reviewed_at = datetime.utcnow()
        sub.reviewer_id = data.get("reviewer_id")
        sub.remarks = data.get("remarks")

        # if approved -> give random 1-10 points and award real wallet tokens on the blockchain
        points_awarded = None
        blockchain_tx = None
        if sub.status == "approved":
            points_awarded = random.randint(1, 10)
            
            # Fetch user info
            from controllers.auth_controller import User
            user = db.query(User).filter(User.id == sub.user_id).first()
            if user:
                # Directly process on database-backed blockchain (no external loopbacks)
                try:
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

                    # Create approved verification in blockchain table
                    new_bc_verification = BCPendingVerification(
                        user_id=bc_user.id,
                        task_type="waste_disposal",
                        evidence=sub.title,
                        image_path=sub.image_url,
                        submitted_at=time.time(),
                        verified_at=time.time(),
                        verified_by=str(sub.reviewer_id or "SYSTEM"),
                        status="approved",
                        reward_amount=float(points_awarded)
                    )
                    db.add(new_bc_verification)
                    db.flush()

                    # Process blockchain transaction
                    tx_id = blockchain_engine.add_transaction(
                        db,
                        sender="SYSTEM",
                        recipient=bc_user.wallet_address,
                        amount=float(points_awarded),
                        transaction_type="task_reward",
                        task_id=str(new_bc_verification.id),
                        task_name="Proper Waste Disposal"
                    )
                    
                    new_bc_verification.transaction_id = tx_id
                    blockchain_tx = tx_id
                    
                    # Mine block to confirm transaction immediately
                    blockchain_engine.mine_pending_transactions(db, "SYSTEM")
                    print(f"Success: Blockchain reward processed. Tx: {blockchain_tx}")
                except Exception as bc_err:
                    print(f"Warning: Failed to award blockchain points: {bc_err}")
            
            new_points = UserPoints(
                user_id=sub.user_id,
                submission_id=sub.id,
                points=points_awarded,
                reason=sub.title,
                blockchain_tx=blockchain_tx
            )
            db.add(new_points)
            sub.blockchain_tx = blockchain_tx

        db.commit()

        return jsonify({
            "message": f"submission {sub.status}",
            "submission": {
                "id": sub.id,
                "user_id": sub.user_id,
                "status": sub.status,
                "reviewer_id": sub.reviewer_id,
                "remarks": sub.remarks,
                "points_awarded": points_awarded,
                "blockchain_tx": blockchain_tx
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
