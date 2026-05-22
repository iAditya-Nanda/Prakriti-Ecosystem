from flask import Flask
from flask_cors import CORS

# Route blueprints
from routes.auth_routes import auth_bp
from routes.history_routes import history_bp
from routes.refill_routes import refill_bp
from routes.compost_routes import compost_bp
from routes.places_routes import places_bp
from routes.business_routes import business_bp
from routes.business_apply_routes import business_apply_bp
from routes.qr_routes import qr_bp
from routes.verifier_routes import verifier_bp
from routes.tourist_submission_routes import submissions_bp
from routes.blockchain_routes import blockchain_bp

# AI blueprints
from ai.chat import ai_chat_bp
from ai.vision import ai_vision_bp

app = Flask(__name__)
CORS(app)

# Register API routes
app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
app.register_blueprint(history_bp, url_prefix="/api/v1/history")
app.register_blueprint(refill_bp, url_prefix="/api/v1/refill")
app.register_blueprint(compost_bp, url_prefix="/api/v1/compost")
app.register_blueprint(places_bp, url_prefix="/api/v1/places")
app.register_blueprint(business_bp, url_prefix="/api/v1/business")
app.register_blueprint(business_apply_bp, url_prefix="/api/v1/business")
app.register_blueprint(qr_bp, url_prefix="/api/v1/qr")
app.register_blueprint(verifier_bp, url_prefix="/api/v1/verifier")
app.register_blueprint(submissions_bp, url_prefix="/api/v1/submissions")
app.register_blueprint(blockchain_bp, url_prefix="/api")
app.register_blueprint(ai_chat_bp, url_prefix="/api/v1/ai")
app.register_blueprint(ai_vision_bp, url_prefix="/api/v1/ai")

@app.route("/")
def home():
    return {"message": "Prakriti API is running"}

@app.route("/api/v1/dashboard/stats")
def dashboard_stats():
    from db import SessionLocal
    from controllers.auth_controller import User
    from controllers.tourist_submission_controller import TouristSubmission
    from controllers.qr_controller import BusinessQR
    
    with SessionLocal() as db:
        try:
            real_users = db.query(User).filter(User.role == "user").count()
            real_businesses = db.query(User).filter(User.role == "business").count()
            real_submissions = db.query(TouristSubmission).count()
            real_scanned_qrs = db.query(BusinessQR).filter(BusinessQR.is_scanned.is_(True)).count()
            
            total_reviewed = (
                db.query(TouristSubmission)
                .filter(TouristSubmission.status.in_("approved", "rejected"))
                .count()
            )
            approved = (
                db.query(TouristSubmission)
                .filter(TouristSubmission.status == "approved")
                .count()
            )
            compliance_rate = 0
            if total_reviewed > 0:
                compliance_rate = int((approved / total_reviewed) * 100)
            
            return {
                "success": True,
                "totals": {
                    "ecoActions": real_submissions + real_scanned_qrs,
                    "activeTourists": real_users,
                    "certifiedBusinesses": real_businesses,
                    "complianceRate": compliance_rate,
                },
            }
        except Exception as e:
            return {"success": False, "error": str(e)}, 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
