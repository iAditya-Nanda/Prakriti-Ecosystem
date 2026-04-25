from flask import jsonify
from sqlalchemy import Column, Integer, String
from db import Base, engine, SessionLocal

# -------------------------------
# Business table (compact)
# -------------------------------
class Business(Base):
    __tablename__ = "business"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    stamp_status = Column(String(20), nullable=False, default="pending")  # "approved" | "pending"
    visitors = Column(Integer, nullable=False, default=0)
    points_issued = Column(Integer, nullable=False, default=0)
    refills_given = Column(Integer, nullable=False, default=0)

Base.metadata.create_all(bind=engine)

# -------------------------------
# GET /: profile + metrics
# -------------------------------
def get_business_profile(business_id: int):
    db = SessionLocal()
    try:
        # Master User Bypass
        if business_id == 9999:
            return jsonify({
                "businessName": "Master Green Store",
                "location": "Himachal Pradesh, India",
                "stampStatus": "approved",
                "metrics": {
                    "visitors": 1250,
                    "pointsIssued": 8450,
                    "refillsGiven": 420
                }
            }), 200

        biz = db.get(Business, business_id)
        if not biz:
            return jsonify({"error": "business not found"}), 404

        return jsonify({
            "businessName": biz.name,
            "location": biz.location,
            "stampStatus": biz.stamp_status,
            "metrics": {
                "visitors": biz.visitors,
                "pointsIssued": biz.points_issued,
                "refillsGiven": biz.refills_given
            }
        }), 200
    finally:
        db.close()

# -------------------------------
# (Optional) POST /upsert for seeding
# body: { id?, name, location, stampStatus, visitors, pointsIssued, refillsGiven }
# -------------------------------
def upsert_business(data: dict):
    required = ["name", "location", "stampStatus"]
    for k in required:
        if k not in data:
            return jsonify({"error": f"{k} is required"}), 400

    db = SessionLocal()
    try:
        biz = None
        if "id" in data and data["id"]:
            biz = db.get(Business, int(data["id"]))

        if not biz:
            biz = Business()

        biz.name = data["name"]
        biz.location = data["location"]
        biz.stamp_status = data.get("stampStatus", "pending")
        biz.visitors = int(data.get("visitors", 0))
        biz.points_issued = int(data.get("pointsIssued", 0))
        biz.refills_given = int(data.get("refillsGiven", 0))

        db.add(biz)
        db.commit()
        db.refresh(biz)

        return jsonify({"message": "upserted", "id": biz.id}), 200
    finally:
        db.close()
