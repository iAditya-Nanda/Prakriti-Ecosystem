from flask import Blueprint, request
from controllers.business_controller import get_business_profile, upsert_business

business_bp = Blueprint("business_bp", __name__)

# GET /api/v1/business/<id>
@business_bp.route("/<int:business_id>", methods=["GET"])
def fetch_business(business_id: int):
    return get_business_profile(business_id)

# (Optional) POST /api/v1/business/upsert
@business_bp.route("/upsert", methods=["POST"])
def upsert_business_route():
    data = request.get_json() or {}
    return upsert_business(data)
