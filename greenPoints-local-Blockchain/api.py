"""
JSON API for Frontend Communication
RESTful-style interface for blockchain operations
All responses in JSON format for easy frontend integration
"""

import json
import time
from typing import Dict, List, Optional
from blockchain import Blockchain
from database import Database
from qr_system import QRCodeManager
from task_definitions import TaskManager, TaskType
from transaction import Transaction


class GreenPointsAPI:
    """
    Main API class for frontend communication
    All methods return JSON-serializable dictionaries
    """
    
    def __init__(self, blockchain: Blockchain, database: Database):
        self.blockchain = blockchain
        self.db = database
        self.qr_manager = QRCodeManager(database, blockchain)
        self.task_manager = TaskManager()
    
    # ==================== USER MANAGEMENT ====================
    
    def register_user(self, name: str, email: Optional[str] = None, 
                     phone: Optional[str] = None) -> Dict:
        """
        Register a new user
        
        Returns JSON response with user data
        """
        if not email and not phone:
            return {
                "success": False,
                "message": "Either email or phone is required",
                "data": None
            }
        
        # Check if user already exists
        if email and self.db.get_user_by_email(email):
            return {"success": False, "message": "Email already registered", "data": None}
        
        if phone and self.db.get_user_by_phone(phone):
            return {"success": False, "message": "Phone already registered", "data": None}
        
        # Generate wallet address
        from wallet import Wallet
        wallet = Wallet(name, email)
        
        # Create user in database
        user_id = self.db.create_user(name, email, phone, 'user', wallet.address)
        
        if user_id:
            return {
                "success": True,
                "message": "User registered successfully",
                "data": {
                    "user_id": user_id,
                    "wallet_address": wallet.address,
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "role": "user",
                    "balance": 0
                }
            }
        else:
            return {"success": False, "message": "Failed to register user", "data": None}
    
    def register_business(self, name: str, email: Optional[str] = None,
                         phone: Optional[str] = None) -> Dict:
        """Register a new business"""
        if not email and not phone:
            return {"success": False, "message": "Either email or phone is required", "data": None}
        
        from wallet import Wallet
        wallet = Wallet(name, email)
        
        user_id = self.db.create_user(name, email, phone, 'business', wallet.address)
        
        if user_id:
            return {
                "success": True,
                "message": "Business registered successfully",
                "data": {
                    "user_id": user_id,
                    "wallet_address": wallet.address,
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "role": "business"
                }
            }
        else:
            return {"success": False, "message": "Failed to register business", "data": None}
    
    def login(self, email: Optional[str] = None, phone: Optional[str] = None) -> Dict:
        """Login user/business"""
        user = None
        if email:
            user = self.db.get_user_by_email(email)
        elif phone:
            user = self.db.get_user_by_phone(phone)
        
        if not user:
            return {"success": False, "message": "User not found", "data": None}
        
        balance = self.blockchain.get_balance(user['wallet_address'])
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "user_id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "phone": user['phone'],
                "role": user['role'],
                "wallet_address": user['wallet_address'],
                "balance": balance,
                "created_at": user['created_at']
            }
        }
    
    def get_user_profile(self, user_id: int) -> Dict:
        """Get complete user profile with stats"""
        user = self.db.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found", "data": None}
        
        balance = self.blockchain.get_balance(user['wallet_address'])
        stats = self.db.get_user_stats(user_id)
        
        return {
            "success": True,
            "message": "Profile retrieved",
            "data": {
                "user_id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "phone": user['phone'],
                "role": user['role'],
                "balance": balance,
                "stats": stats,
                "created_at": user['created_at']
            }
        }
    
    # ==================== TASK OPERATIONS ====================
    
    def get_available_tasks(self) -> Dict:
        """Get all available tasks for users"""
        tasks = self.task_manager.get_tasks_for_frontend()
        return {
            "success": True,
            "message": "Tasks retrieved",
            "data": {"tasks": tasks, "total_count": len(tasks)}
        }
    
    def submit_waste_disposal(self, user_id: int, evidence: str, 
                             image_path: Optional[str] = None,
                             waste_type: str = "general") -> Dict:
        """Submit waste disposal task"""
        user = self.db.get_user_by_id(user_id)
        if not user or user['role'] != 'user':
            return {"success": False, "message": "Invalid user", "data": None}
        
        reward = self.task_manager.calculate_reward(TaskType.WASTE_DISPOSAL)
        
        verification_id = self.db.submit_verification(
            user_id=user_id,
            task_type="waste_disposal",
            evidence=evidence,
            image_path=image_path,
            reward_amount=reward,
            metadata={"waste_type": waste_type}
        )
        
        if verification_id:
            return {
                "success": True,
                "message": "Waste disposal submitted for verification",
                "data": {
                    "verification_id": verification_id,
                    "expected_reward": reward,
                    "status": "pending",
                    "estimated_verification_time": "24 hours"
                }
            }
        else:
            return {"success": False, "message": "Failed to submit task", "data": None}
    
    def submit_litter_report(self, user_id: int, evidence: str,
                            image_path: Optional[str] = None,
                            location: Optional[str] = None,
                            latitude: Optional[float] = None,
                            longitude: Optional[float] = None,
                            severity: str = "medium") -> Dict:
        """Submit litter report"""
        user = self.db.get_user_by_id(user_id)
        if not user or user['role'] != 'user':
            return {"success": False, "message": "Invalid user", "data": None}
        
        reward = self.task_manager.calculate_reward(TaskType.LITTER_REPORT, severity=severity)
        
        verification_id = self.db.submit_verification(
            user_id=user_id,
            task_type="litter_report",
            evidence=evidence,
            image_path=image_path,
            location=location,
            latitude=latitude,
            longitude=longitude,
            reward_amount=reward,
            metadata={"severity": severity}
        )
        
        if verification_id:
            return {
                "success": True,
                "message": "Litter report submitted for verification",
                "data": {
                    "verification_id": verification_id,
                    "expected_reward": reward,
                    "severity": severity,
                    "status": "pending"
                }
            }
        else:
            return {"success": False, "message": "Failed to submit report", "data": None}
    
    def get_user_submissions(self, user_id: int, status: Optional[str] = None) -> Dict:
        """Get user's task submissions"""
        cursor = self.db._dict_cursor()
        
        if status:
            cursor.execute("""
                SELECT * FROM bc_pending_verifications
                WHERE user_id = %s AND status = %s
                ORDER BY submitted_at DESC
            """, (user_id, status))
        else:
            cursor.execute("""
                SELECT * FROM bc_pending_verifications
                WHERE user_id = %s
                ORDER BY submitted_at DESC
            """, (user_id,))
        
        submissions = [dict(row) for row in cursor.fetchall()]
        
        return {
            "success": True,
            "message": "Submissions retrieved",
            "data": {"submissions": submissions, "total_count": len(submissions)}
        }
    
    # ==================== QR CODE OPERATIONS ====================
    
    def generate_qr_code(self, business_id: int, reward_amount: float,
                        service_description: str = "",
                        expires_in_hours: Optional[int] = None) -> Dict:
        """Generate a QR code for a business"""
        business = self.db.get_user_by_id(business_id)
        if not business or business['role'] != 'business':
            return {"success": False, "message": "Only businesses can generate QR codes", "data": None}
        
        success, message, qr_code = self.qr_manager.create_qr_code(
            business_id, reward_amount, service_description, expires_in_hours
        )
        
        if success:
            return {
                "success": True,
                "message": message,
                "data": {
                    "qr_code": qr_code,
                    "reward_amount": reward_amount,
                    "service_description": service_description,
                    "expires_in_hours": expires_in_hours
                }
            }
        else:
            return {"success": False, "message": message, "data": None}
    
    def scan_qr_code(self, qr_code: str, user_id: int) -> Dict:
        """Scan and redeem a QR code"""
        success, message, tx_data = self.qr_manager.scan_qr_code(qr_code, user_id)
        return {"success": success, "message": message, "data": tx_data}
    
    def get_qr_code_info(self, qr_code: str) -> Dict:
        """Get QR code information"""
        return self.qr_manager.get_qr_code_info(qr_code)
    
    # ==================== BLOCKCHAIN OPERATIONS ====================
    
    def mine_block(self, miner_address: str) -> Dict:
        """Mine pending transactions"""
        if len(self.blockchain.pending_transactions) == 0:
            return {"success": False, "message": "No pending transactions", "data": None}
        
        block = self.blockchain.mine_pending_transactions(miner_address)
        self.db.rebuild_leaderboard(self.blockchain)
        
        return {
            "success": True,
            "message": f"Block #{block.index} mined successfully",
            "data": {
                "block_index": block.index,
                "block_hash": block.hash,
                "transactions_count": len(block.transactions),
                "miner_reward": self.blockchain.mining_reward
            }
        }
    
    def get_balance(self, user_id: int) -> Dict:
        """Get user's GP balance"""
        user = self.db.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found", "data": None}
        
        balance = self.blockchain.get_balance(user['wallet_address'])
        
        return {
            "success": True,
            "message": "Balance retrieved",
            "data": {
                "user_id": user_id,
                "name": user['name'],
                "balance": balance,
                "currency": "GP"
            }
        }
    
    def get_transaction_history(self, user_id: int, limit: int = 50) -> Dict:
        """Get user's transaction history"""
        user = self.db.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found", "data": None}
        
        history = self.blockchain.get_transaction_history(user['wallet_address'])
        history = history[-limit:]
        
        return {
            "success": True,
            "message": "Transaction history retrieved",
            "data": {"transactions": history, "total_count": len(history)}
        }
    
    # ==================== LEADERBOARD ====================
    
    def get_leaderboard(self, limit: int = 10) -> Dict:
        """Get top GP holders"""
        leaderboard = self.db.get_leaderboard(limit)
        
        return {
            "success": True,
            "message": "Leaderboard retrieved",
            "data": {
                "leaderboard": leaderboard,
                "total_count": len(leaderboard),
                "last_updated": time.time()
            }
        }
    
    # ==================== ADMIN/VERIFICATION ====================
    
    def get_pending_verifications(self) -> Dict:
        """Get all pending verifications (for admin)"""
        verifications = self.db.get_pending_verifications()
        
        return {
            "success": True,
            "message": "Pending verifications retrieved",
            "data": {"verifications": verifications, "total_count": len(verifications)}
        }
    
    def approve_verification(self, verification_id: int, admin_name: str = "SYSTEM") -> Dict:
        """Approve a verification and create reward transaction"""
        verification = self.db.get_verification_by_id(verification_id)
        if not verification:
            return {"success": False, "message": "Verification not found", "data": None}
        
        if verification['status'] != 'pending':
            return {"success": False, "message": f"Verification already {verification['status']}", "data": None}
        
        user = self.db.get_user_by_id(verification['user_id'])
        
        # Create transaction
        tx = Transaction(
            sender="SYSTEM",
            recipient=user['wallet_address'],
            amount=verification['reward_amount'],
            transaction_type="task_reward",
            task_id=str(verification['id']),
            task_name=verification['task_type'].replace('_', ' ').title()
        )
        
        if self.blockchain.add_transaction(tx.to_dict()):
            self.db.approve_verification(verification_id, admin_name, tx.transaction_id)
            
            return {
                "success": True,
                "message": "Verification approved",
                "data": {
                    "verification_id": verification_id,
                    "user_name": verification['user_name'],
                    "reward_amount": verification['reward_amount'],
                    "transaction_id": tx.transaction_id
                }
            }
        else:
            return {"success": False, "message": "Failed to create transaction", "data": None}
    
    def reject_verification(self, verification_id: int, reason: str, 
                          admin_name: str = "SYSTEM") -> Dict:
        """Reject a verification"""
        if self.db.reject_verification(verification_id, admin_name, reason):
            return {
                "success": True,
                "message": "Verification rejected",
                "data": {"verification_id": verification_id, "reason": reason}
            }
        else:
            return {"success": False, "message": "Failed to reject verification", "data": None}
    
    # ==================== SYSTEM STATS ====================
    
    def get_system_stats(self) -> Dict:
        """Get overall system statistics"""
        total_users = len(self.db.get_all_users(role='user'))
        total_businesses = len(self.db.get_all_users(role='business'))
        
        cursor = self.db._dict_cursor()
        cursor.execute("SELECT COUNT(*) as count FROM bc_pending_verifications WHERE status = 'pending'")
        pending_verifications = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM bc_qr_codes WHERE is_used = 0")
        active_qr_codes = cursor.fetchone()['count']
        
        # Calculate total GP in circulation
        total_gp = 0
        for user in self.db.get_all_users(role='user'):
            total_gp += self.blockchain.get_balance(user['wallet_address'])
        
        return {
            "success": True,
            "message": "System stats retrieved",
            "data": {
                "total_users": total_users,
                "total_businesses": total_businesses,
                "blockchain_length": len(self.blockchain.chain),
                "pending_transactions": len(self.blockchain.pending_transactions),
                "pending_verifications": pending_verifications,
                "active_qr_codes": active_qr_codes,
                "total_gp_circulation": total_gp,
                "mining_difficulty": self.blockchain.difficulty
            }
        }


# Helper function to convert API response to JSON string
def to_json(data: Dict) -> str:
    """Convert dict to JSON string"""
    return json.dumps(data, indent=2, default=str)
