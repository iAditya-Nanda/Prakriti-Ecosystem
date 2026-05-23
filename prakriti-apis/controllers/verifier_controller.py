from flask import jsonify, request
from sqlalchemy import Column, Integer, String
from db import Base, engine, SessionLocal

# -------------------------------------------
# Verifier Table
# -------------------------------------------
class Verifier(Base):
    __tablename__ = "verifiers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    pending_verifications = Column(Integer, default=0)
    approved_actions = Column(Integer, default=0)
    rejected_items = Column(Integer, default=0)

Base.metadata.create_all(bind=engine)


# -------------------------------------------
# Get Verifier Dashboard
# -------------------------------------------
def get_verifier_dashboard(verifier_id: int):
    db = SessionLocal()
    try:
        from controllers.tourist_submission_controller import TouristSubmission
        pending_count = db.query(TouristSubmission).filter_by(status="pending").count()
        approved_count = db.query(TouristSubmission).filter_by(status="approved").count()
        rejected_count = db.query(TouristSubmission).filter_by(status="rejected").count()

        # Master User Bypass
        if verifier_id == 9999:
            return jsonify({
                "verifierName": "Master Verifier",
                "department": "Department of Environment",
                "verifiedCount": approved_count,
                "pendingCount": pending_count,
                "rejectedItems": rejected_count
            }), 200

        verifier = db.get(Verifier, verifier_id)
        if not verifier:
            return jsonify({"error": "Verifier not found"}), 404

        return jsonify({
            "verifier_id": verifier.id,
            "name": verifier.name,
            "pendingVerifications": pending_count,
            "approvedActions": approved_count,
            "rejectedItems": rejected_count
        }), 200
    finally:
        db.close()


# -------------------------------------------
# Upsert Verifier (ID Required)
# -------------------------------------------
def upsert_verifier(data):
    db = SessionLocal()
    try:
        # Validate input
        if "id" not in data or not data["id"]:
            return jsonify({"error": "id is required"}), 400
        if "name" not in data:
            return jsonify({"error": "name is required"}), 400

        verifier_id = int(data["id"])

        # Try to get existing verifier
        verifier = db.get(Verifier, verifier_id)

        if verifier:
            # Update existing record
            verifier.name = data.get("name", verifier.name)
            verifier.pending_verifications = data.get("pendingVerifications", verifier.pending_verifications)
            verifier.approved_actions = data.get("approvedActions", verifier.approved_actions)
            verifier.rejected_items = data.get("rejectedItems", verifier.rejected_items)
        else:
            # Create new with the given ID
            verifier = Verifier(
                id=verifier_id,
                name=data["name"],
                pending_verifications=data.get("pendingVerifications", 0),
                approved_actions=data.get("approvedActions", 0),
                rejected_items=data.get("rejectedItems", 0)
            )
            db.add(verifier)

        db.commit()
        db.refresh(verifier)

        return jsonify({
            "message": "Verifier upserted successfully",
            "verifier": {
                "id": verifier.id,
                "name": verifier.name,
                "pendingVerifications": verifier.pending_verifications,
                "approvedActions": verifier.approved_actions,
                "rejectedItems": verifier.rejected_items
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
