from flask import jsonify
from sqlalchemy import Column, Integer, String, Float
from db import Base, engine, SessionLocal

# -------------------------------------------
# ✅ RefillStations Table
# -------------------------------------------
class RefillStation(Base):
    __tablename__ = "refill_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    distance = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

# Create table if it doesn't exist
Base.metadata.create_all(bind=engine)


# -------------------------------------------
# ✅ Add a Refill Station
# -------------------------------------------
def add_refill_station(data):
    required_fields = ["name", "distance", "status", "latitude", "longitude"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    db = SessionLocal()
    try:
        station = RefillStation(
            name=data["name"],
            distance=data["distance"],
            status=data["status"],
            latitude=data["latitude"],
            longitude=data["longitude"]
        )
        db.add(station)
        db.commit()
        db.refresh(station)

        return jsonify({
            "message": "Refill station added successfully",
            "station": {
                "id": station.id,
                "name": station.name,
                "distance": station.distance,
                "status": station.status,
                "coords": {
                    "latitude": station.latitude,
                    "longitude": station.longitude
                }
            }
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# -------------------------------------------
# ✅ Get all Refill Stations
# -------------------------------------------
def get_refill_stations():
    db = SessionLocal()
    try:
        stations = db.query(RefillStation).all()
        if not stations:
            # Provide Mock Stations for Demo
            mock_data = [
                {"id": 1, "name": "Mall Road Eco-Station", "distance": "200m", "status": "Active", "coords": {"latitude": 31.1048, "longitude": 77.1734}},
                {"id": 2, "name": "Bus Stand Refill Point", "distance": "800m", "status": "Active", "coords": {"latitude": 31.1033, "longitude": 77.1722}},
                {"id": 3, "name": "Ridge Eco-Hub", "distance": "1.2km", "status": "Maintenance", "coords": {"latitude": 31.1055, "longitude": 77.1755}}
            ]
            return jsonify({"refillStations": mock_data}), 200

        data = [
            {
                "id": s.id,
                "name": s.name,
                "distance": s.distance,
                "status": s.status,
                "coords": {"latitude": s.latitude, "longitude": s.longitude}
            }
            for s in stations
        ]
        return jsonify({"refillStations": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
