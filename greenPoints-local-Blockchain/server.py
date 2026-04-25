"""
Flask REST API Server for Green Points Blockchain System
Provides HTTP endpoints for frontend integration
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from blockchain import Blockchain
from database import Database
from api import GreenPointsAPI
import os

app = Flask(__name__)
CORS(app)  # Allow requests from your frontend (React Native/React/etc.)

# Initialize blockchain system
blockchain = Blockchain(difficulty=2)
db = Database()
api = GreenPointsAPI(blockchain, db)

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# ==================== USER ENDPOINTS ====================

@app.route('/api/sync-user', methods=['POST'])
def sync_user():
    """
    Called when user signs up in your existing app
    Creates blockchain wallet for the user
    
    Request: { "name": "John Doe", "email": "john@example.com", "phone": "+1234567890" }
    Response: { "success": true, "data": { "user_id": 1, "wallet_address": "GP_abc..." } }
    """
    data = request.json
    response = api.register_user(
        name=data['name'],
        email=data.get('email'),
        phone=data.get('phone')
    )
    return jsonify(response)

@app.route('/api/login', methods=['POST'])
def login():
    """
    Login user by email or phone
    
    Request: { "email": "john@example.com" } OR { "phone": "+1234567890" }
    Response: { "success": true, "data": { "user_id": 1, "name": "John", "balance": 100 } }
    """
    data = request.json
    response = api.login(
        email=data.get('email'),
        phone=data.get('phone')
    )
    return jsonify(response)

@app.route('/api/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    """
    Get user profile with GP balance
    
    Response: { "success": true, "data": { "user_id": 1, "name": "John", "balance": 100, ... } }
    """
    response = api.get_user_profile(user_id)
    return jsonify(response)

@app.route('/api/balance/<int:user_id>', methods=['GET'])
def get_balance(user_id):
    """
    Get user's current GP balance
    
    Response: { "success": true, "data": { "balance": 100 } }
    """
    response = api.get_balance(user_id)
    return jsonify(response)

# ==================== TASK ENDPOINTS ====================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """
    Get list of available tasks
    
    Response: { "success": true, "data": { "tasks": [...] } }
    """
    response = api.get_available_tasks()
    return jsonify(response)

@app.route('/api/submit-waste', methods=['POST'])
def submit_waste():
    """
    Submit waste disposal task for verification
    
    Request: {
        "user_id": 1,
        "evidence": "Disposed plastic in recycling bin",
        "image_path": "/uploads/waste_001.jpg",
        "waste_type": "recyclable"  // optional: recyclable, organic, general
    }
    Response: { "success": true, "data": { "verification_id": 1, "expected_reward": 20 } }
    """
    data = request.json
    response = api.submit_waste_disposal(
        user_id=data['user_id'],
        evidence=data['evidence'],
        image_path=data.get('image_path'),
        waste_type=data.get('waste_type', 'general')
    )
    return jsonify(response)

@app.route('/api/submit-litter', methods=['POST'])
def submit_litter():
    """
    Submit litter report for verification
    
    Request: {
        "user_id": 1,
        "evidence": "Reported littered area at park",
        "image_path": "/uploads/litter_001.jpg",
        "location": "Central Park",
        "latitude": 40.785091,
        "longitude": -73.968285,
        "severity": "medium"  // optional: low, medium, high
    }
    Response: { "success": true, "data": { "verification_id": 2, "expected_reward": 35 } }
    """
    data = request.json
    response = api.submit_litter_report(
        user_id=data['user_id'],
        evidence=data['evidence'],
        image_path=data.get('image_path'),
        location=data.get('location'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        severity=data.get('severity', 'medium')
    )
    return jsonify(response)

@app.route('/api/submissions/<int:user_id>', methods=['GET'])
def get_submissions(user_id):
    """
    Get user's task submissions
    
    Query params: ?status=pending (optional: pending, approved, rejected)
    Response: { "success": true, "data": { "submissions": [...] } }
    """
    status = request.args.get('status')
    response = api.get_user_submissions(user_id, status)
    return jsonify(response)

# ==================== QR CODE ENDPOINTS ====================

@app.route('/api/qr/generate', methods=['POST'])
def generate_qr():
    """
    Business generates QR code for customer reward
    
    Request: {
        "business_id": 1,
        "reward_amount": 15,
        "service_description": "Coffee purchase",
        "expires_in_hours": 24  // optional
    }
    Response: { "success": true, "data": { "qr_code": "GP-0001-...", "reward_amount": 15 } }
    """
    data = request.json
    response = api.generate_qr_code(
        business_id=data['business_id'],
        reward_amount=data['reward_amount'],
        service_description=data.get('service_description', ''),
        expires_in_hours=data.get('expires_in_hours')
    )
    return jsonify(response)

@app.route('/api/qr/scan', methods=['POST'])
def scan_qr():
    """
    User scans QR code to receive reward
    
    Request: { "user_id": 1, "qr_code": "GP-0001-..." }
    Response: { "success": true, "data": { "amount": 15, "business_name": "Cafe" } }
    """
    data = request.json
    response = api.scan_qr_code(
        qr_code=data['qr_code'],
        user_id=data['user_id']
    )
    
    # After successful scan, mine the block to process reward immediately
    if response['success']:
        mine_result = api.mine_block("SYSTEM")
        if mine_result['success']:
            response['data']['block_mined'] = True
            response['data']['transaction_confirmed'] = True
    
    return jsonify(response)

@app.route('/api/qr/info/<qr_code>', methods=['GET'])
def get_qr_info(qr_code):
    """
    Get information about a QR code
    
    Response: { "success": true, "data": { "qr_code": "...", "reward_amount": 15, ... } }
    """
    response = api.get_qr_code_info(qr_code)
    return jsonify(response)

# ==================== LEADERBOARD ====================

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """
    Get top GP holders
    
    Query params: ?limit=10 (default: 10)
    Response: { "success": true, "data": { "leaderboard": [...] } }
    """
    limit = request.args.get('limit', 10, type=int)
    response = api.get_leaderboard(limit)
    return jsonify(response)

# ==================== ADMIN ENDPOINTS ====================

@app.route('/api/admin/verifications', methods=['GET'])
def get_pending_verifications():
    """
    Get all pending task verifications (admin only)
    
    TODO: Add admin authentication
    Response: { "success": true, "data": { "verifications": [...] } }
    """
    # TODO: Add admin authentication check here
    response = api.get_pending_verifications()
    return jsonify(response)

@app.route('/api/admin/approve/<int:verification_id>', methods=['POST'])
def approve_verification(verification_id):
    """
    Approve a task verification and reward user (admin only)
    
    Request: { "admin_name": "Admin123" }  // optional
    Response: { "success": true, "data": { "verification_id": 1, "user_rewarded": true } }
    """
    # TODO: Add admin authentication check here
    data = request.json or {}
    response = api.approve_verification(
        verification_id=verification_id,
        admin_name=data.get('admin_name', 'SYSTEM')
    )
    
    # Mine block to process reward immediately
    if response['success']:
        mine_result = api.mine_block("SYSTEM")
        if mine_result['success']:
            response['data']['block_mined'] = True
            response['data']['reward_confirmed'] = True
    
    return jsonify(response)

@app.route('/api/admin/reject/<int:verification_id>', methods=['POST'])
def reject_verification(verification_id):
    """
    Reject a task verification (admin only)
    
    Request: { "reason": "Invalid evidence", "admin_name": "Admin123" }
    Response: { "success": true, "message": "Verification rejected" }
    """
    # TODO: Add admin authentication check here
    data = request.json
    response = api.reject_verification(
        verification_id=verification_id,
        reason=data['reason'],
        admin_name=data.get('admin_name', 'SYSTEM')
    )
    return jsonify(response)

# ==================== UTILITIES ====================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Get overall system statistics
    
    Response: { "success": true, "data": { "total_users": 100, "total_gp": 5000, ... } }
    """
    response = api.get_system_stats()
    return jsonify(response)

@app.route('/api/transactions/<int:user_id>', methods=['GET'])
def get_transactions(user_id):
    """
    Get user's transaction history
    
    Query params: ?limit=50 (default: 50)
    Response: { "success": true, "data": { "transactions": [...] } }
    """
    limit = request.args.get('limit', 50, type=int)
    response = api.get_transaction_history(user_id, limit)
    return jsonify(response)

@app.route('/api/mine', methods=['POST'])
def mine_block():
    """
    Manually trigger mining of pending transactions
    
    Response: { "success": true, "data": { "block_hash": "...", "transactions": 3 } }
    """
    data = request.json or {}
    miner = data.get('miner', 'SYSTEM')
    response = api.mine_block(miner)
    return jsonify(response)

# ==================== IMAGE UPLOAD ====================

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """
    Upload task evidence image
    
    Form data: file=<image>
    Response: { "success": true, "path": "/uploads/image_123.jpg" }
    """
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No file selected"}), 400
    
    # Generate unique filename
    import uuid
    from werkzeug.utils import secure_filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    file.save(filepath)
    
    return jsonify({
        "success": True,
        "path": f"/{filepath}",
        "filename": filename
    })

# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Green Points Blockchain API",
        "version": "1.0.0"
    })

@app.route('/', methods=['GET'])
def index():
    """API documentation endpoint"""
    return jsonify({
        "service": "Green Points Blockchain API",
        "version": "1.0.0",
        "endpoints": {
            "users": {
                "POST /api/sync-user": "Register new user",
                "POST /api/login": "Login user",
                "GET /api/profile/<user_id>": "Get user profile",
                "GET /api/balance/<user_id>": "Get user balance"
            },
            "tasks": {
                "GET /api/tasks": "Get available tasks",
                "POST /api/submit-waste": "Submit waste disposal",
                "POST /api/submit-litter": "Submit litter report",
                "GET /api/submissions/<user_id>": "Get user submissions"
            },
            "qr_codes": {
                "POST /api/qr/generate": "Generate QR code (business)",
                "POST /api/qr/scan": "Scan QR code (user)",
                "GET /api/qr/info/<qr_code>": "Get QR code info"
            },
            "admin": {
                "GET /api/admin/verifications": "Get pending verifications",
                "POST /api/admin/approve/<verification_id>": "Approve verification",
                "POST /api/admin/reject/<verification_id>": "Reject verification"
            },
            "utilities": {
                "GET /api/leaderboard": "Get top users",
                "GET /api/transactions/<user_id>": "Get transaction history",
                "GET /api/stats": "Get system statistics",
                "POST /api/mine": "Mine pending transactions",
                "POST /api/upload-image": "Upload image"
            }
        },
        "documentation": "See INTEGRATION_GUIDE.md for complete documentation"
    })

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting Green Points Blockchain API Server...")
    print("📍 Server running at: http://localhost:5000")
    print("📖 API documentation: http://localhost:5000")
    print("💚 Health check: http://localhost:5000/health")
    print("\nPress CTRL+C to stop the server\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
