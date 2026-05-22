from flask import Blueprint, request
from controllers.places_controller import add_place, get_all_places

places_bp = Blueprint("places_bp", __name__)

# POST /api/v1/places/add
@places_bp.route("/add", methods=["POST"])
def add_new_place():
    data = request.get_json()
    if not data:
        return {"error": "Missing JSON body"}, 400
    return add_place(data)

# GET /api/v1/places/all
@places_bp.route("/all", methods=["GET"])
def get_places():
    return get_all_places()
