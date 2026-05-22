import hashlib, secrets, base64, hmac
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
import jwt

JWT_SECRET = os.getenv("JWT_SECRET", "prakriti_super_secret_key_2026")

def hash_password(password: str) -> str:
    iterations = 120000
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2${iterations}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        _, iterations, b64salt, b64hash = stored_hash.split("$", 3)
        salt = base64.b64decode(b64salt)
        expected = base64.b64decode(b64hash)
        test = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iterations))
        return hmac.compare_digest(test, expected)
    except Exception:
        return False

def generate_access_token(user_id: int, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def generate_refresh_token(user_id: int, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"success": False, "error": "Token is missing"}), 401
            
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return jsonify({"success": False, "error": "Token is invalid or expired"}), 401
            
        g.user_id = payload["sub"]
        g.user_role = payload["role"]
        return f(*args, **kwargs)
    return decorated

def roles_accepted(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, "user_role") or g.user_role not in roles:
                return jsonify({"success": False, "error": "Unauthorized access"}), 403
            return f(*args, **kwargs)
        return decorated
    decorator.__name__ = f"roles_accepted_{'_'.join(roles)}"
    return decorator

