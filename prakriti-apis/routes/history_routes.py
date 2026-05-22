from flask import Blueprint, request
from controllers.history_controller import add_history, get_history_by_user

history_bp = Blueprint("history_bp", __name__)

# POST /api/v1/history/add
@history_bp.route("/add", methods=["POST"])
def add_new_history():
    data = request.get_json()
    if not data:
        return {"error": "Missing JSON body"}, 400
    return add_history(data)

# GET /api/v1/history/<user_id>
@history_bp.route("/<int:user_id>", methods=["GET"])
def fetch_user_history(user_id):
    return get_history_by_user(user_id)
