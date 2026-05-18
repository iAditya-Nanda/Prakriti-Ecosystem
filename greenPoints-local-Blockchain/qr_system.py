"""
QR Code System for Business Rewards
Businesses generate QR codes, users scan to earn GP
"""

import hashlib
import time
import json
from typing import Optional, Dict, Tuple, List


class QRCodeGenerator:
    """Generates unique QR codes for businesses"""
    
    @staticmethod
    def generate_qr_code(business_id: int, reward_amount: float, 
                        service_description: str = "") -> str:
        """
        Generate a unique QR code
        
        Args:
            business_id: ID of the business
            reward_amount: GP amount to reward
            service_description: Optional description
        
        Returns:
            Unique QR code string
        """
        timestamp = time.time()
        data = f"{business_id}_{reward_amount}_{service_description}_{timestamp}"
        hash_value = hashlib.sha256(data.encode()).hexdigest()
        
        # Create a readable QR code format
        qr_code = f"GP-{business_id:04d}-{hash_value[:12].upper()}"
        return qr_code
    
    @staticmethod
    def generate_batch_qr_codes(business_id: int, reward_amount: float,
                               count: int, service_description: str = "") -> list:
        """
        Generate multiple QR codes for a business
        
        Args:
            business_id: ID of the business
            reward_amount: GP amount per code
            count: Number of codes to generate
            service_description: Service description
        
        Returns:
            List of QR codes
        """
        qr_codes = []
        for i in range(count):
            # Add slight delay to ensure unique timestamps
            time.sleep(0.001)
            qr_code = QRCodeGenerator.generate_qr_code(
                business_id, 
                reward_amount, 
                f"{service_description}_batch_{i}"
            )
            qr_codes.append(qr_code)
        
        return qr_codes


class QRCodeManager:
    """Manages QR code operations"""
    
    def __init__(self, database, blockchain):
        self.db = database
        self.blockchain = blockchain
    
    def create_qr_code(self, business_id: int, reward_amount: float,
                      service_description: str = "",
                      expires_in_hours: Optional[int] = None,
                      custom_qr_code: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
        """
        Create a new QR code for a business
        
        Returns:
            (success, message, qr_code)
        """
        # Validate business
        business = self.db.get_user_by_id(business_id)
        if not business:
            return False, "Business not found", None
        
        if business['role'] != 'business':
            return False, "Only businesses can generate QR codes", None
        
        if reward_amount <= 0:
            return False, "Reward amount must be positive", None
        
        # Generate QR code
        qr_code = custom_qr_code or QRCodeGenerator.generate_qr_code(
            business_id, reward_amount, service_description
        )
        
        # Save to database
        qr_id = self.db.create_qr_code(
            business_id, reward_amount, qr_code, 
            service_description, expires_in_hours
        )
        
        if qr_id:
            return True, "QR code created successfully", qr_code
        else:
            return False, "Failed to create QR code", None
    
    def create_batch_qr_codes(self, business_id: int, reward_amount: float,
                            count: int, service_description: str = "",
                            expires_in_hours: Optional[int] = None) -> Tuple[bool, str, List[str]]:
        """
        Create multiple QR codes for a business
        
        Returns:
            (success, message, list of qr_codes)
        """
        business = self.db.get_user_by_id(business_id)
        if not business or business['role'] != 'business':
            return False, "Invalid business", []
        
        qr_codes = []
        for i in range(count):
            success, message, qr_code = self.create_qr_code(
                business_id, reward_amount, 
                f"{service_description} (#{i+1})", 
                expires_in_hours
            )
            if success:
                qr_codes.append(qr_code)
        
        return True, f"Generated {len(qr_codes)} QR codes", qr_codes
    
    def scan_qr_code(self, qr_code: str, user_id: int) -> Tuple[bool, str, Optional[Dict]]:
        """
        Process a QR code scan by a user
        
        Returns:
            (success, message, transaction_data)
        """
        # Validate user
        user = self.db.get_user_by_id(user_id)
        if not user:
            return False, "User not found", None
        
        if user['role'] != 'user':
            return False, "Only users can scan QR codes", None
        
        # Validate QR code
        is_valid, message, qr_data = self.db.validate_qr_code(qr_code)
        if not is_valid:
            return False, message, None
        
        # Create blockchain transaction
        from transaction import Transaction
        
        # Get business wallet
        business = self.db.get_user_by_id(qr_data['business_id'])
        
        tx = Transaction(
            sender="SYSTEM",  # Business rewards come from system
            recipient=user['wallet_address'],
            amount=qr_data['reward_amount'],
            transaction_type="qr_reward",
            task_id=qr_code,
            task_name=f"Business Visit: {qr_data['business_name']}"
        )
        
        # Add transaction to blockchain
        if self.blockchain.add_transaction(tx.to_dict()):
            # Mark QR code as used
            self.db.use_qr_code(qr_code, user_id, tx.transaction_id)
            
            return True, f"Earned {qr_data['reward_amount']} GP from {qr_data['business_name']}!", {
                "transaction_id": tx.transaction_id,
                "amount": qr_data['reward_amount'],
                "business_name": qr_data['business_name'],
                "service": qr_data['service_description'],
                "timestamp": time.time()
            }
        else:
            return False, "Failed to process transaction", None
    
    def get_qr_code_info(self, qr_code: str) -> Dict:
        """
        Get QR code information (for display before scanning)
        
        Returns:
            QR code details in JSON format
        """
        is_valid, message, qr_data = self.db.validate_qr_code(qr_code)
        
        if not qr_data:
            return {
                "valid": False,
                "message": "QR code not found",
                "data": None
            }
        
        return {
            "valid": is_valid,
            "message": message,
            "data": {
                "business_name": qr_data['business_name'],
                "reward_amount": qr_data['reward_amount'],
                "service_description": qr_data['service_description'],
                "is_used": bool(qr_data['is_used']),
                "created_at": qr_data['created_at'],
                "expires_at": qr_data['expires_at'],
                "expired": qr_data['expires_at'] and time.time() > qr_data['expires_at']
            }
        }
    
    def get_business_qr_codes(self, business_id: int, include_used: bool = False) -> List[Dict]:
        """Get all QR codes for a business"""
        cursor = self.db._dict_cursor()
        
        if include_used:
            cursor.execute("""
                SELECT * FROM bc_qr_codes 
                WHERE business_id = %s 
                ORDER BY created_at DESC
            """, (business_id,))
        else:
            cursor.execute("""
                SELECT * FROM bc_qr_codes 
                WHERE business_id = %s AND is_used = 0
                ORDER BY created_at DESC
            """, (business_id,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def get_qr_code_stats(self, business_id: int) -> Dict:
        """Get QR code statistics for a business"""
        cursor = self.db._dict_cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total_generated,
                SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as redeemed,
                SUM(CASE WHEN is_used = 0 AND (expires_at IS NULL OR expires_at > %s) THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_used = 1 THEN reward_amount ELSE 0 END) as total_gp_distributed
            FROM bc_qr_codes
            WHERE business_id = %s
        """, (time.time(), business_id))
        
        return dict(cursor.fetchone())


def create_qr_code_display_data(qr_code: str, qr_data: Dict) -> Dict:
    """
    Create display data for QR code (for frontend rendering)
    
    Returns:
        JSON data for frontend
    """
    return {
        "qr_code": qr_code,
        "business": qr_data.get('business_name', 'Unknown Business'),
        "reward": f"{qr_data.get('reward_amount', 0)} GP",
        "service": qr_data.get('service_description', 'Service'),
        "status": "Used" if qr_data.get('is_used') else "Active",
        "created": time.strftime('%Y-%m-%d %H:%M', time.localtime(qr_data.get('created_at', 0))),
        "expires": time.strftime('%Y-%m-%d %H:%M', time.localtime(qr_data.get('expires_at', 0))) if qr_data.get('expires_at') else "Never",
        "used_at": time.strftime('%Y-%m-%d %H:%M', time.localtime(qr_data.get('used_at', 0))) if qr_data.get('used_at') else None
    }
