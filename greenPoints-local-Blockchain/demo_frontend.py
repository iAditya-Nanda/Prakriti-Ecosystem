#!/usr/bin/env python3
"""
Green Points Blockchain - Complete Frontend Integration Demo
Shows the system with User/Business roles, QR codes, waste disposal,
litter reporting, and JSON API responses for frontend
"""

import time
from blockchain import Blockchain
from database import Database
from api import GreenPointsAPI, to_json


def print_header(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def print_json_response(response, title="API Response"):
    print(f"\n📤 {title}:")
    print(to_json(response))


def main():
    print("\n" + "🌱"*40)
    print("GREEN POINTS BLOCKCHAIN - FRONTEND INTEGRATION DEMO")
    print("🌱"*40)
    
    # Initialize system
    print_header("INITIALIZING SYSTEM")
    blockchain = Blockchain(difficulty=2)
    db = Database()
    api = GreenPointsAPI(blockchain, db)
    print("✓ Blockchain initialized")
    print("✓ Database initialized")
    print("✓ API ready for frontend communication")
    
    # Register users
    print_header("USER REGISTRATION (from Frontend Signup)")
    
    users_data = [
        {"name": "Alice Green", "email": "alice@example.com", "phone": "+1234567890"},
        {"name": "Bob Eco", "email": "bob@example.com", "phone": "+1234567891"},
        {"name": "Carol Earth", "email": "carol@example.com", "phone": "+1234567892"},
    ]
    
    users = []
    for user_data in users_data:
        response = api.register_user(**user_data)
        print_json_response(response, f"Register {user_data['name']}")
        if response['success']:
            users.append(response['data'])
    
    if not users:
        print("❌ Failed to register users. Exiting.")
        return
    
    # Register businesses
    print_header("BUSINESS REGISTRATION")
    
    businesses_data = [
        {"name": "Green Cafe", "email": "contact@greencafe.com"},
        {"name": "Eco Shop", "email": "hello@ecoshop.com"},
    ]
    
    businesses = []
    for biz_data in businesses_data:
        response = api.register_business(**biz_data)
        print_json_response(response, f"Register {biz_data['name']}")
        if response['success']:
            businesses.append(response['data'])
    
    if not businesses:
        print("❌ Failed to register businesses. Exiting.")
        return
    
    # User login
    print_header("USER LOGIN (Frontend Login Flow)")
    
    login_response = api.login(email="alice@example.com")
    print_json_response(login_response, "Alice Login")
    
    # Get available tasks
    print_header("GET AVAILABLE TASKS (For Frontend Display)")
    
    tasks_response = api.get_available_tasks()
    print_json_response(tasks_response, "Available Tasks")
    
    # Submit waste disposal
    print_header("TASK SUBMISSION - Waste Disposal")
    
    waste_submission = api.submit_waste_disposal(
        user_id=users[0]['user_id'],
        evidence="Disposed 2kg of plastic in recycling bin",
        image_path="/uploads/waste_alice_001.jpg",
        waste_type="recyclable"
    )
    print_json_response(waste_submission, "Waste Disposal Submission")
    
    # Submit litter report
    print_header("TASK SUBMISSION - Litter Report")
    
    litter_submission = api.submit_litter_report(
        user_id=users[1]['user_id'],
        evidence="Found litter near Central Park entrance",
        image_path="/uploads/litter_bob_001.jpg",
        location="Central Park, Main Entrance",
        latitude=40.785091,
        longitude=-73.968285,
        severity="medium"
    )
    print_json_response(litter_submission, "Litter Report Submission")
    
    # Submit another litter report
    litter_submission2 = api.submit_litter_report(
        user_id=users[2]['user_id'],
        evidence="Large pile of trash on Beach Road",
        image_path="/uploads/litter_carol_001.jpg",
        location="Beach Road, near pier",
        latitude=40.123456,
        longitude=-74.123456,
        severity="high"
    )
    print_json_response(litter_submission2, "Litter Report Submission (High Severity)")
    
    # View user submissions
    print_header("GET USER SUBMISSIONS")
    
    submissions_response = api.get_user_submissions(users[0]['user_id'])
    print_json_response(submissions_response, "Alice's Submissions")
    
    # Admin: Get pending verifications
    print_header("ADMIN - Get Pending Verifications")
    
    pending_response = api.get_pending_verifications()
    print_json_response(pending_response, "Pending Verifications")
    
    # Admin: Approve verifications
    print_header("ADMIN - Approve Verifications")
    
    for verification in pending_response['data']['verifications']:
        approval = api.approve_verification(
            verification['id'],
            admin_name="Admin System"
        )
        print_json_response(approval, f"Approve Verification #{verification['id']}")
    
    # Mine block to process rewards
    print_header("MINING BLOCK (Auto-triggered by System)")
    
    mine_response = api.mine_block("SYSTEM")
    print_json_response(mine_response, "Block Mining Result")
    
    # Check user balances
    print_header("USER BALANCES (After Rewards)")
    
    for user in users:
        balance_response = api.get_balance(user['user_id'])
        print_json_response(balance_response, f"{user['name']}'s Balance")
    
    # Business generates QR codes
    print_header("BUSINESS - Generate QR Codes")
    
    qr_response1 = api.generate_qr_code(
        business_id=businesses[0]['user_id'],
        reward_amount=25.0,
        service_description="Coffee purchase",
        expires_in_hours=24
    )
    print_json_response(qr_response1, "Green Cafe QR Code")
    
    qr_response2 = api.generate_qr_code(
        business_id=businesses[1]['user_id'],
        reward_amount=30.0,
        service_description="Eco product purchase",
        expires_in_hours=None  # Never expires
    )
    print_json_response(qr_response2, "Eco Shop QR Code")
    
    # Users scan QR codes
    print_header("USER - Scan QR Code")
    
    if qr_response1['success']:
        qr_code = qr_response1['data']['qr_code']
        
        # First, get QR info (user scans and sees details before confirming)
        qr_info = api.get_qr_code_info(qr_code)
        print_json_response(qr_info, "QR Code Info (Before Scanning)")
        
        # User confirms and scans
        scan_response = api.scan_qr_code(qr_code, users[0]['user_id'])
        print_json_response(scan_response, "Alice Scans Green Cafe QR")
    
    if qr_response2['success']:
        qr_code = qr_response2['data']['qr_code']
        scan_response = api.scan_qr_code(qr_code, users[1]['user_id'])
        print_json_response(scan_response, "Bob Scans Eco Shop QR")
    
    # Mine block for QR rewards
    print_header("MINING BLOCK (QR Rewards)")
    
    mine_response2 = api.mine_block("SYSTEM")
    print_json_response(mine_response2, "Block Mining Result")
    
    # Get updated balances
    print_header("UPDATED USER BALANCES")
    
    for user in users:
        balance_response = api.get_balance(user['user_id'])
        print_json_response(balance_response, f"{user['name']}'s Balance")
    
    # Get transaction history
    print_header("TRANSACTION HISTORY")
    
    history_response = api.get_transaction_history(users[0]['user_id'], limit=10)
    print_json_response(history_response, "Alice's Transaction History")
    
    # Get leaderboard
    print_header("LEADERBOARD (For Frontend Display)")
    
    leaderboard_response = api.get_leaderboard(limit=10)
    print_json_response(leaderboard_response, "Top GP Holders")
    
    # Get user profile
    print_header("USER PROFILE (Complete Profile Data)")
    
    profile_response = api.get_user_profile(users[0]['user_id'])
    print_json_response(profile_response, "Alice's Complete Profile")
    
    # Get system stats
    print_header("SYSTEM STATISTICS (Dashboard Data)")
    
    stats_response = api.get_system_stats()
    print_json_response(stats_response, "System Statistics")
    
    # Blockchain validation
    print_header("BLOCKCHAIN VALIDATION")
    
    is_valid = blockchain.is_chain_valid()
    validation_response = {
        "success": True,
        "message": "Blockchain validated",
        "data": {
            "is_valid": is_valid,
            "chain_length": len(blockchain.chain),
            "total_blocks": len(blockchain.chain),
            "validation_timestamp": time.time()
        }
    }
    print_json_response(validation_response, "Blockchain Validation")
    
    # Final summary
    print_header("DEMO SUMMARY")
    
    print("""
✅ System Features Demonstrated:
    
1. USER REGISTRATION & LOGIN
   - Users sign up with email/phone
   - JWT-ready authentication flow
   - Role-based access (User vs Business)

2. TASK SUBMISSIONS
   - Waste disposal with photo upload
   - Litter reporting with GPS coordinates
   - Severity-based rewards
   - Pending verification workflow

3. QR CODE SYSTEM
   - Businesses generate QR codes
   - Users scan to earn instant rewards
   - Expiration handling
   - One-time use validation

4. ADMIN VERIFICATION
   - Review pending submissions
   - Approve/Reject with reasons
   - Transaction creation on approval

5. BLOCKCHAIN OPERATIONS
   - Automatic mining
   - Balance tracking
   - Transaction history
   - Chain validation

6. LEADERBOARD & STATS
   - Top GP holders ranking
   - User statistics
   - System-wide metrics

7. JSON API RESPONSES
   - All responses in JSON format
   - Ready for REST API integration
   - Frontend-friendly structure

📊 Final Statistics:
   - Total Users: {total_users}
   - Total Businesses: {total_businesses}
   - Blocks Mined: {blocks}
   - Total Transactions: {transactions}
   - GP in Circulation: {total_gp}
   
🎯 Integration Points for Frontend:
   - POST /api/register - User registration
   - POST /api/login - User authentication
   - GET /api/tasks - Get available tasks
   - POST /api/submit-waste - Submit waste disposal
   - POST /api/submit-litter - Submit litter report
   - POST /api/scan-qr - Scan QR code
   - GET /api/leaderboard - Get leaderboard
   - GET /api/profile/:id - Get user profile
   - GET /api/balance/:id - Get user balance
   - GET /api/transactions/:id - Get transaction history
   
🔐 All data is synced between SQL database and blockchain!
    """.format(
        total_users=len(users),
        total_businesses=len(businesses),
        blocks=len(blockchain.chain),
        transactions=sum(len(block.transactions) for block in blockchain.chain),
        total_gp=sum(blockchain.get_balance(u['wallet_address']) for u in [db.get_user_by_id(user['user_id']) for user in users])
    ))
    
    print("\n" + "🎉"*40)
    print("DEMO COMPLETED SUCCESSFULLY!")
    print("🎉"*40)
    print("\nAll API responses are in JSON format and ready for frontend integration!")
    print("Database file: greenpoints_demo.db")
    print("\n")
    
    # Cleanup
    db.close()


if __name__ == "__main__":
    main()
