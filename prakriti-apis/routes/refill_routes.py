from flask import Blueprint, request
from controllers.refill_controller import add_refill_station, get_refill_stations

refill_bp = Blueprint("refill_bp", __name__)

# POST /api/v1/refill/add
@refill_bp.route("/add", methods=["POST"])
def add_station():
    data = request.get_json()
    if not data:
        return {"error": "Missing JSON body"}, 400
    return add_refill_station(data)

# GET /api/v1/refill/all
@refill_bp.route("/all", methods=["GET"])
def get_all_stations():
    return get_refill_stations()
