from flask import Blueprint
from controllers.business_apply_controller import (
    submit_application,
    get_applications_by_business,
    get_all_applications
)

business_apply_bp = Blueprint("business_apply_bp", __name__)

# POST /api/v1/business/apply
@business_apply_bp.route("/apply", methods=["POST"])
def apply_stamp():
    return submit_application()

# GET /api/v1/business/applications/<business_id>
@business_apply_bp.route("/applications/<int:business_id>", methods=["GET"])
def get_apps(business_id):
    return get_applications_by_business(business_id)

# NEW: GET /api/v1/business/applications
@business_apply_bp.route("/applications", methods=["GET"])
def get_all_apps():
    return get_all_applications()
