import os
import json
from datetime import datetime
from flask import jsonify, request
from werkzeug.utils import secure_filename
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from db import Base, engine, SessionLocal

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------------------------------
# Green Stamp Applications Table
# -------------------------------------------
class BusinessApplication(Base):
    __tablename__ = "business_applications"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, nullable=False)
    description = Column(String(1000), nullable=False)
    checklist = Column(String(500), nullable=False)  # JSON string
    photos = Column(String(2000), nullable=False)     # JSON array of file paths
    status = Column(String(20), default="pending")    # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)


# -------------------------------------------
# POST /api/v1/business/apply
# -------------------------------------------
def submit_application():
    db = SessionLocal()
    try:
        # Parse text fields
        business_id = request.form.get("business_id")
        description = request.form.get("description")
        checklist_str = request.form.get("checklist")

        if not business_id or not description or not checklist_str:
            return jsonify({"error": "Missing fields"}), 400

        checklist = json.loads(checklist_str)

        # Handle image uploads
        uploaded_files = request.files.getlist("photos")
        saved_paths = []

        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        for file in uploaded_files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
                unique_name = f"{timestamp}_{filename}"
                path = os.path.join(UPLOAD_FOLDER, unique_name)
                file.save(path)
                saved_paths.append(f"/uploads/{unique_name}")

        # Store in DB
        app_entry = BusinessApplication(
            business_id=business_id,
            description=description,
            checklist=json.dumps(checklist),
            photos=json.dumps(saved_paths),
            status="pending"
        )
        db.add(app_entry)
        db.commit()
        db.refresh(app_entry)

        # Log these saved paths to UploadCatalog
        try:
            from controllers.tourist_submission_controller import UploadCatalog
            for path in saved_paths:
                unique_name = os.path.basename(path)
                catalog_entry = UploadCatalog(
                    filename=unique_name,
                    original_name=unique_name.split("_", 1)[1] if "_" in unique_name else unique_name,
                    file_path=path,
                    associated_type="business_application",
                    associated_id=app_entry.id,
                    uploaded_by_user=int(business_id) if str(business_id).isdigit() else None
                )
                db.add(catalog_entry)
            db.commit()
        except Exception as log_err:
            print(f"Warning: Failed to log business uploads to catalog: {log_err}")

        return jsonify({
            "message": "Application submitted successfully",
            "application": {
                "id": app_entry.id,
                "business_id": app_entry.business_id,
                "description": app_entry.description,
                "checklist": checklist,
                "photos": saved_paths,
                "status": app_entry.status,
                "created_at": str(app_entry.created_at)
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# GET /api/v1/business/applications/<business_id>
# -------------------------------------------
def get_applications_by_business(business_id):
    db = SessionLocal()
    try:
        apps = db.query(BusinessApplication).filter_by(business_id=business_id).all()
        data = [
            {
                "id": a.id,
                "business_id": a.business_id,
                "description": a.description,
                "checklist": json.loads(a.checklist),
                "photos": json.loads(a.photos),
                "status": a.status,
                "created_at": str(a.created_at)
            }
            for a in apps
        ]
        return jsonify({"applications": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# GET /api/v1/business/applications  (NEW)
# Get ALL applications (for Verifiers/Admins)
# -------------------------------------------
def get_all_applications():
    db = SessionLocal()
    try:
        apps = db.query(BusinessApplication).all()
        data = [
            {
                "id": a.id,
                "business_id": a.business_id,
                "description": a.description,
                "checklist": json.loads(a.checklist),
                "photos": json.loads(a.photos),
                "status": a.status,
                "created_at": str(a.created_at)
            }
            for a in apps
        ]
        return jsonify({"applications": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# PUT /api/v1/business/applications/<app_id>/review
# -------------------------------------------
def review_business_application(app_id: int):
    data = request.get_json() or {}
    action = (data.get("action") or "").lower()
    
    if action not in {"approve", "reject"}:
        return jsonify({"error": "action must be 'approve' or 'reject'"}), 400
        
    db = SessionLocal()
    try:
        app_entry = db.get(BusinessApplication, app_id)
        if not app_entry:
            return jsonify({"error": "Application not found"}), 404
            
        app_entry.status = "approved" if action == "approve" else "rejected"
        
        # If approved, update stamp_status in Business table
        if app_entry.status == "approved":
            from controllers.business_controller import Business
            biz = db.get(Business, int(app_entry.business_id))
            if biz:
                biz.stamp_status = "approved"
            else:
                from controllers.auth_controller import User
                user = db.get(User, int(app_entry.business_id))
                if user:
                    new_biz = Business(
                        id=user.id,
                        name=user.name,
                        location=user.contact,
                        stamp_status="approved"
                    )
                    db.add(new_biz)
        
        db.commit()
        return jsonify({
            "message": f"Application {app_entry.status} successfully",
            "application": {
                "id": app_entry.id,
                "business_id": app_entry.business_id,
                "status": app_entry.status
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
