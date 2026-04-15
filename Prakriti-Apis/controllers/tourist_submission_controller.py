import os
import random
from datetime import datetime
from flask import jsonify, request
from werkzeug.utils import secure_filename
from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint, ForeignKey
from db import Base, engine, SessionLocal

# -------------------------------------------
# ⚙️ Upload Config
# -------------------------------------------
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------------------------------
# 🧾 Tourist Submissions Table
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

    __table_args__ = (
        CheckConstraint("type = 'tourist'", name="ck_only_tourist_type"),
        CheckConstraint("status IN ('pending','approved','rejected')", name="ck_valid_submission_status"),
    )


# -------------------------------------------
# 🧮 User Points Table
# -------------------------------------------
class UserPoints(Base):
    __tablename__ = "user_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    submission_id = Column(Integer, ForeignKey("tourist_submissions.id"), nullable=False)
    points = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


# -------------------------------------------
# 📤 Upload Image
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

    return jsonify({
        "message": "uploaded",
        "url": f"/uploads/{unique_name}"
    }), 201


# -------------------------------------------
# ➕ Add Tourist Submission
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
# 📋 Get All Submissions
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
        if not apps and status == "pending":
            # Provide Mock Queue for Demo
            mock_apps = [
                {
                    "id": 501, "user_id": 7, "title": "Correct Disposal: Plastic Bottle",
                    "location": "River Side, Kullu", "status": "pending",
                    "image": "https://prakriti.org/demo/bottle.jpg",
                    "timestamp": datetime.utcnow().isoformat(),
                    "reviewer_id": None, "remarks": None
                },
                {
                    "id": 502, "user_id": 12, "title": "Paper Waste Recycled",
                    "location": "Mall Road, Shimla", "status": "pending",
                    "image": "https://prakriti.org/demo/paper.jpg",
                    "timestamp": datetime.utcnow().isoformat(),
                    "reviewer_id": None, "remarks": None
                }
            ]
            return jsonify({"submissions": mock_apps}), 200

        data = [{
            "id": a.id,
            "user_id": a.user_id,
            "title": a.title,
            "location": a.location,
            "status": a.status,
            "image": a.image_url,
            "timestamp": a.created_at.isoformat(),
            "reviewer_id": a.reviewer_id,
            "remarks": a.remarks
        } for a in apps]

        return jsonify({"submissions": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# ✅ Approve/Reject Submission + Award Points
# -------------------------------------------
def review_submission(submission_id: int, data: dict):
    action = (data.get("action") or "").lower()
    if action not in {"approve", "reject"}:
        return jsonify({"error": "action must be 'approve' or 'reject'"}), 400

    db = SessionLocal()
    try:
        sub = db.query(TouristSubmission).get(submission_id)
        if not sub:
            return jsonify({"error": "submission not found"}), 404

        sub.status = "approved" if action == "approve" else "rejected"
        sub.reviewed_at = datetime.utcnow()
        sub.reviewer_id = data.get("reviewer_id")
        sub.remarks = data.get("remarks")

        # ✅ if approved → give random 0–10 points
        points_awarded = None
        if sub.status == "approved":
            points_awarded = random.randint(0, 10)
            new_points = UserPoints(
                user_id=sub.user_id,
                submission_id=sub.id,
                points=points_awarded,
                reason=sub.title
            )
            db.add(new_points)

        db.commit()

        return jsonify({
            "message": f"submission {sub.status}",
            "submission": {
                "id": sub.id,
                "user_id": sub.user_id,
                "status": sub.status,
                "reviewer_id": sub.reviewer_id,
                "remarks": sub.remarks,
                "points_awarded": points_awarded
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
