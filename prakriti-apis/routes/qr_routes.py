from flask import Blueprint
from controllers.qr_controller import generate_qr, check_qr_status, mark_qr_scanned
from utils.security import token_required, roles_accepted

qr_bp = Blueprint("qr_bp", __name__)

# POST /api/v1/qr/generate
@qr_bp.route("/generate", methods=["POST"])
@token_required
@roles_accepted("business")
def create_qr():
    return generate_qr()

# GET /api/v1/qr/status/<qr_id>
@qr_bp.route("/status/<string:qr_id>", methods=["GET"])
@token_required
def qr_status(qr_id):
    return check_qr_status(qr_id)

# POST /api/v1/qr/scan
@qr_bp.route("/scan", methods=["POST"])
@token_required
@roles_accepted("user")
def scan_qr():
    return mark_qr_scanned()
