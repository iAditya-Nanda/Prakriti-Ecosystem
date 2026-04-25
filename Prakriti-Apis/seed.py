"""
🌱 Prakriti Database Seeder
Seeds the PostgreSQL database with essential demo/default data
for all modules to work together.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from db import SessionLocal, engine, Base
from controllers.auth_controller import User
from controllers.business_controller import Business
from controllers.refill_controller import RefillStation
from controllers.compost_controller import CompostPoint
from controllers.places_controller import Place
from controllers.verifier_controller import Verifier
from controllers.history_controller import History
from utils.security import hash_password
import json

def seed():
    db = SessionLocal()
    try:
        # =============================================
        # 1. SEED USERS (if not already seeded)
        # =============================================
        existing = db.query(User).count()
        if existing == 0:
            users = [
                User(name="Aarav Sharma", contact="aarav@prakriti.org", password_hash=hash_password("green123"), role="user"),
                User(name="Priya Mehta", contact="priya@prakriti.org", password_hash=hash_password("green123"), role="user"),
                User(name="Rohan Verma", contact="rohan@prakriti.org", password_hash=hash_password("green123"), role="user"),
                User(name="Ananya Singh", contact="ananya@prakriti.org", password_hash=hash_password("green123"), role="verifier"),
                User(name="Green Cafe Manali", contact="greencafe@prakriti.org", password_hash=hash_password("green123"), role="business"),
                User(name="EcoStay Shimla", contact="ecostay@prakriti.org", password_hash=hash_password("green123"), role="business"),
            ]
            db.add_all(users)
            db.commit()
            print(f"✅ Seeded {len(users)} users")
        else:
            print(f"⏭️  Users already seeded ({existing} found)")

        # =============================================
        # 2. SEED BUSINESSES
        # =============================================
        existing = db.query(Business).count()
        if existing == 0:
            businesses = [
                Business(name="Green Cafe Manali", location="Old Manali, Himachal Pradesh", stamp_status="approved", visitors=340, points_issued=2100, refills_given=180),
                Business(name="EcoStay Shimla", location="Mall Road, Shimla", stamp_status="approved", visitors=890, points_issued=5600, refills_given=350),
                Business(name="Mountain Fresh Water Co.", location="Kullu Valley", stamp_status="pending", visitors=120, points_issued=800, refills_given=95),
            ]
            db.add_all(businesses)
            db.commit()
            print(f"✅ Seeded {len(businesses)} businesses")
        else:
            print(f"⏭️  Businesses already seeded ({existing} found)")

        # =============================================
        # 3. SEED REFILL STATIONS
        # =============================================
        existing = db.query(RefillStation).count()
        if existing == 0:
            stations = [
                RefillStation(name="Mall Road Eco-Station", distance="200m", status="Active", latitude=31.1048, longitude=77.1734),
                RefillStation(name="Bus Stand Refill Point", distance="800m", status="Active", latitude=31.1033, longitude=77.1722),
                RefillStation(name="Ridge Eco-Hub", distance="1.2km", status="Maintenance", latitude=31.1055, longitude=77.1755),
                RefillStation(name="Lakkar Bazaar Point", distance="1.8km", status="Active", latitude=31.1060, longitude=77.1680),
                RefillStation(name="IGMC Hospital Station", distance="2.5km", status="Active", latitude=31.1075, longitude=77.1640),
            ]
            db.add_all(stations)
            db.commit()
            print(f"✅ Seeded {len(stations)} refill stations")
        else:
            print(f"⏭️  Refill stations already seeded ({existing} found)")

        # =============================================
        # 4. SEED COMPOST POINTS
        # =============================================
        existing = db.query(CompostPoint).count()
        if existing == 0:
            compost = [
                CompostPoint(name="Community Garden Composting", distance="500m", benefit="Organic waste → fertilizer", latitude=31.1040, longitude=77.1720),
                CompostPoint(name="University Bio-Hub", distance="1.5km", benefit="Research-grade composting", latitude=31.1015, longitude=77.1690),
                CompostPoint(name="Forest Colony Pit", distance="2.0km", benefit="Leaf litter recycling", latitude=31.1070, longitude=77.1780),
            ]
            db.add_all(compost)
            db.commit()
            print(f"✅ Seeded {len(compost)} compost points")
        else:
            print(f"⏭️  Compost points already seeded ({existing} found)")

        # =============================================
        # 5. SEED PLACES
        # =============================================
        existing = db.query(Place).count()
        if existing == 0:
            places = [
                Place(name="Jakhu Temple Hill", distance="2.4km", type="Trek • Scenic", level="Easy", tags=json.dumps(["Nature", "Eco-Trail"]), latitude=31.1010, longitude=77.1850),
                Place(name="Chadwick Falls", distance="7.0km", type="Waterfall • Forest", level="Moderate", tags=json.dumps(["Water", "Quiet"]), latitude=31.1150, longitude=77.1450),
                Place(name="Viceregal Lodge", distance="3.5km", type="Heritage • Garden", level="Easy", tags=json.dumps(["Architecture", "Parks"]), latitude=31.1030, longitude=77.1430),
                Place(name="Glen Forest", distance="4.0km", type="Forest • Walk", level="Easy", tags=json.dumps(["Trees", "Peaceful"]), latitude=31.1090, longitude=77.1500),
                Place(name="Annandale Ground", distance="3.0km", type="Open • Sports", level="Easy", tags=json.dumps(["Sports", "Valley"]), latitude=31.1000, longitude=77.1550),
            ]
            db.add_all(places)
            db.commit()
            print(f"✅ Seeded {len(places)} places")
        else:
            print(f"⏭️  Places already seeded ({existing} found)")

        # =============================================
        # 6. SEED VERIFIERS
        # =============================================
        existing = db.query(Verifier).count()
        if existing == 0:
            verifiers = [
                Verifier(id=1, name="Ananya Singh", pending_verifications=5, approved_actions=120, rejected_items=8),
                Verifier(id=2, name="Rajesh Kumar", pending_verifications=3, approved_actions=85, rejected_items=12),
                Verifier(id=3, name="Kajal Thakur", pending_verifications=10, approved_actions=95, rejected_items=4),
            ]
            db.add_all(verifiers)
            db.commit()
            print(f"✅ Seeded {len(verifiers)} verifiers")
        else:
            print(f"⏭️  Verifiers already seeded ({existing} found)")

        # =============================================
        # 7. SEED HISTORY for demo users
        # =============================================
        existing = db.query(History).count()
        if existing == 0:
            history_entries = [
                History(user_id=1, type="recycle", title="Plastic Bottle Recycled", location="Mall Road, Shimla", points=5.0, time="2 hours ago"),
                History(user_id=1, type="water", title="Water Bottle Refilled", location="Mall Road Eco-Station", points=2.5, time="5 hours ago"),
                History(user_id=1, type="compost", title="Food Waste Composted", location="Community Garden", points=10.0, time="Yesterday"),
                History(user_id=2, type="recycle", title="Paper Waste Recycled", location="Ridge, Shimla", points=8.0, time="3 hours ago"),
                History(user_id=2, type="tree", title="Tree Planted", location="Jakhu Forest", points=50.0, time="2 days ago"),
                History(user_id=3, type="water", title="Detergent Refilled", location="Bus Stand Refill Point", points=3.0, time="1 hour ago"),
            ]
            db.add_all(history_entries)
            db.commit()
            print(f"✅ Seeded {len(history_entries)} history entries")
        else:
            print(f"⏭️  History already seeded ({existing} found)")

        print("\n🌿 Database seeding complete!")
        
        # Summary
        print("\n📊 Database Summary:")
        print(f"   Users:           {db.query(User).count()}")
        print(f"   Businesses:      {db.query(Business).count()}")
        print(f"   Refill Stations: {db.query(RefillStation).count()}")
        print(f"   Compost Points:  {db.query(CompostPoint).count()}")
        print(f"   Places:          {db.query(Place).count()}")
        print(f"   Verifiers:       {db.query(Verifier).count()}")
        print(f"   History Entries: {db.query(History).count()}")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
