from flask import Blueprint, request
from controllers.auth_controller import (
    signup_user,
    login_user,
    get_profile_by_id,
    update_profile,
    change_password
)
from utils.security import token_required

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data:
        return {"error": "Invalid or missing JSON body"}, 400
    return signup_user(data)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return {"error": "Invalid or missing JSON body"}, 400
    return login_user(data)

@auth_bp.route("/profile/<int:user_id>", methods=["GET"])
@token_required
def get_profile(user_id):
    return get_profile_by_id(user_id)

@auth_bp.route("/profile/<int:user_id>", methods=["PUT"])
@token_required
def update_user_profile(user_id):
    data = request.get_json() or {}
    return update_profile(user_id, data)

@auth_bp.route("/change-password/<int:user_id>", methods=["POST"])
@token_required
def update_user_password(user_id):
    data = request.get_json() or {}
    return change_password(user_id, data)

@auth_bp.route("/verify-token", methods=["GET"])
@token_required
def verify_token():
    return {"success": True, "message": "Token is valid"}, 200
