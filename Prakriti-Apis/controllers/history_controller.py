from flask import jsonify
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from datetime import datetime
from db import Base, engine, SessionLocal

# -------------------------------------------
# ✅ History Table (with user_id)
# -------------------------------------------
class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)   # linked to User table
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    points = Column(Float, nullable=False)
    time = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create the table (if not exists)
Base.metadata.create_all(bind=engine)


# -------------------------------------------
# ✅ Add new history entry for a user
# -------------------------------------------
def add_history(data):
    required_fields = ["user_id", "type", "title", "location", "points", "time"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    db = SessionLocal()
    try:
        new_entry = History(
            user_id=data["user_id"],
            type=data["type"],
            title=data["title"],
            location=data["location"],
            points=float(data["points"]),
            time=data["time"]
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)

        return jsonify({
            "message": "History entry added successfully",
            "history": {
                "id": new_entry.id,
                "user_id": new_entry.user_id,
                "type": new_entry.type,
                "title": new_entry.title,
                "location": new_entry.location,
                "points": new_entry.points,
                "time": new_entry.time,
                "created_at": str(new_entry.created_at)
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# ✅ Get all history records for a specific user
# -------------------------------------------
def get_history_by_user(user_id):
    db = SessionLocal()
    try:
        records = db.query(History).filter(History.user_id == user_id).order_by(History.created_at.desc()).all()

        if not records:
            if user_id == 9999:
                # Provide Master Mock History
                mock_data = [
                    {
                        "id": 101, "user_id": 9999, "type": "recycle", "title": "Plastic Bottle Recycled",
                        "location": "Kasol Dustbin #4", "points": 5.0, "time": "2 hours ago",
                        "created_at": str(datetime.utcnow())
                    },
                    {
                        "id": 102, "user_id": 9999, "type": "water", "title": "Water Bottle Refilled",
                        "location": "Old Manali Station", "points": 2.5, "time": "5 hours ago",
                        "created_at": str(datetime.utcnow())
                    },
                    {
                        "id": 103, "user_id": 9999, "type": "compost", "title": "Food Waste Composted",
                        "location": "Community Center", "points": 10.0, "time": "Yesterday",
                        "created_at": str(datetime.utcnow())
                    }
                ]
                return jsonify({"user_id": user_id, "history": mock_data}), 200
            return jsonify({"message": "No history found for this user", "history": []}), 200

        data = [
            {
                "id": h.id,
                "user_id": h.user_id,
                "type": h.type,
                "title": h.title,
                "location": h.location,
                "points": h.points,
                "time": h.time,
                "created_at": str(h.created_at)
            }
            for h in records
        ]

        return jsonify({"user_id": user_id, "history": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
