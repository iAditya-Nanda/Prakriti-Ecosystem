from flask import jsonify
from sqlalchemy import Column, Integer, String, Float
from db import Base, engine, SessionLocal

# -------------------------------------------
# CompostPoints Table
# -------------------------------------------
class CompostPoint(Base):
    __tablename__ = "compost_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    distance = Column(String(50), nullable=False)
    benefit = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

# Create table if it doesn't exist
Base.metadata.create_all(bind=engine)


# -------------------------------------------
# Add Compost Point
# -------------------------------------------
def add_compost_point(data):
    required_fields = ["name", "distance", "benefit", "latitude", "longitude"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    db = SessionLocal()
    try:
        new_point = CompostPoint(
            name=data["name"],
            distance=data["distance"],
            benefit=data["benefit"],
            latitude=data["latitude"],
            longitude=data["longitude"]
        )
        db.add(new_point)
        db.commit()
        db.refresh(new_point)

        return jsonify({
            "message": "Compost point added successfully",
            "point": {
                "id": new_point.id,
                "name": new_point.name,
                "distance": new_point.distance,
                "benefit": new_point.benefit,
                "coords": {
                    "latitude": new_point.latitude,
                    "longitude": new_point.longitude
                }
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# Get All Compost Points
# -------------------------------------------
def get_compost_points():
    db = SessionLocal()
    try:
        points = db.query(CompostPoint).all()
        data = [
            {
                "id": p.id,
                "name": p.name,
                "distance": p.distance,
                "benefit": p.benefit,
                "coords": {"latitude": p.latitude, "longitude": p.longitude}
            }
            for p in points
        ]
        return jsonify({"compostPoints": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
