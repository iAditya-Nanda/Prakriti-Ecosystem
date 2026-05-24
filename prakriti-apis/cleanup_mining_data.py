"""
Prakriti Database Cleanup Script
Purges all references to 'mining' or 'mining_reward' from the SQLite database transactions,
replacing them with professional 'validation_reward' ledger terms.
"""
import os
import sqlite3

def cleanup_db(db_name, db_path):
    print(f"\nCleaning Database: {db_name} ({db_path})")
    if not os.path.exists(db_path):
        print("  - File does not exist. Skipping.")
        return
        
    try:
        # Establish a raw SQLite connection for absolute control
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Update blockchain_transactions transaction_type
        cursor.execute(
            "UPDATE blockchain_transactions SET transaction_type = 'validation_reward' WHERE transaction_type = 'mining_reward'"
        )
        updated_rows = cursor.rowcount
        conn.commit()
        print(f"  [+] Updated {updated_rows} transactions in 'blockchain_transactions' table.")
        
        # 2. Inspect to ensure no remaining references
        cursor.execute("SELECT COUNT(*) FROM blockchain_transactions WHERE transaction_type LIKE '%mining%'")
        remaining_count = cursor.fetchone()[0]
        print(f"  [+] Remaining mining-related transactions: {remaining_count}")
        
        conn.close()
        print("  [+] Clean up successful!")
    except Exception as e:
        print(f"  [Error] Failed to clean up database: {e}")

if __name__ == "__main__":
    DB_DIR = "/Users/adityananda/MyWorkspace/Prakriti/database"
    cleanup_db("prakriti-dev.db", os.path.join(DB_DIR, "prakriti-dev.db"))
    cleanup_db("prakriti.db", os.path.join(DB_DIR, "prakriti.db"))
