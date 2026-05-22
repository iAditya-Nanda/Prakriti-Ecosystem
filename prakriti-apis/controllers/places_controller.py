from flask import jsonify
from sqlalchemy import Column, Integer, String, Float
from db import Base, engine, SessionLocal
import json

# -------------------------------------------
# Places Table
# -------------------------------------------
class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    distance = Column(String(50), nullable=False)
    type = Column(String(100), nullable=False)
    level = Column(String(50), nullable=False)
    tags = Column(String(255), nullable=False)  # store as JSON string
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

# Create table if not exists
Base.metadata.create_all(bind=engine)


# -------------------------------------------
# Add Place
# -------------------------------------------
def add_place(data):
    required_fields = ["name", "distance", "type", "level", "tags", "latitude", "longitude"]
    for f in required_fields:
        if f not in data:
            return jsonify({"error": f"{f} is required"}), 400

    db = SessionLocal()
    try:
        new_place = Place(
            name=data["name"],
            distance=data["distance"],
            type=data["type"],
            level=data["level"],
            tags=json.dumps(data["tags"]),  # serialize tags array
            latitude=data["latitude"],
            longitude=data["longitude"]
        )
        db.add(new_place)
        db.commit()
        db.refresh(new_place)

        return jsonify({
            "message": "Place added successfully",
            "place": {
                "id": new_place.id,
                "name": new_place.name,
                "distance": new_place.distance,
                "type": new_place.type,
                "level": new_place.level,
                "tags": json.loads(new_place.tags),
                "coords": {
                    "latitude": new_place.latitude,
                    "longitude": new_place.longitude
                }
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# Get All Places
# -------------------------------------------
def get_all_places():
    db = SessionLocal()
    try:
        results = db.query(Place).all()
        data = [
            {
                "id": p.id,
                "name": p.name,
                "distance": p.distance,
                "type": p.type,
                "level": p.level,
                "tags": json.loads(p.tags),
                "coords": {
                    "latitude": p.latitude,
                    "longitude": p.longitude
                }
            }
            for p in results
        ]
        return jsonify({"places": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
