from flask import Blueprint, request
from controllers.tourist_submission_controller import (
    upload_submission_image,
    add_tourist_submission,
    get_all_tourist_submissions,
    review_submission,
)
from utils.security import token_required, roles_accepted

submissions_bp = Blueprint("submissions_bp", __name__)

# Upload Image
@submissions_bp.route("/upload", methods=["POST"])
@token_required
def upload_image_route():
    return upload_submission_image()

# Add Submission
@submissions_bp.route("/add", methods=["POST"])
@token_required
@roles_accepted("user")
def add_submission_route():
    data = request.get_json() or {}
    return add_tourist_submission(data)

# Get All
@submissions_bp.route("/all", methods=["GET"])
@token_required
def get_all_submissions_route():
    return get_all_tourist_submissions()

# Approve or Reject
@submissions_bp.route("/<int:submission_id>/review", methods=["POST"])
@token_required
@roles_accepted("verifier")
def review_submission_route(submission_id: int):
    data = request.get_json() or {}
    return review_submission(submission_id, data)
