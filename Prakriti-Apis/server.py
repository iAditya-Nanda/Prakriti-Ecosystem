from flask import Flask
from flask_cors import CORS
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

print("🚀 Initializing Prakriti Server...")
app = Flask(__name__)
print("✅ Flask app created.")
CORS(app)
print("✅ CORS initialized.")

# Register routes
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

@app.route("/")
def home():
    return {"message": "Prakriti API is running 🚀"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
