from flask import Blueprint, request
from controllers.compost_controller import add_compost_point, get_compost_points

compost_bp = Blueprint("compost_bp", __name__)

# POST /api/v1/compost/add
@compost_bp.route("/add", methods=["POST"])
def add_point():
    data = request.get_json()
    if not data:
        return {"error": "Missing JSON body"}, 400
    return add_compost_point(data)

# GET /api/v1/compost/all
@compost_bp.route("/all", methods=["GET"])
def get_all_points():
    return get_compost_points()
