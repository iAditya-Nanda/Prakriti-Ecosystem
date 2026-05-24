"""
Prakriti Production Database Recovery & Restore Engine
Restores the active production database (prakriti.db) from the latest database snapshot
in the backups directory, ensuring zero data loss during fresh deployments or folder deletion.
"""
import os
import sys
import shutil
import glob

def restore_production_db():
    print("="*60)
    print("Prakriti Production Database Restore Engine")
    print("="*60)

    # 1. Locate root folder and directories
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_DIR = os.path.join(BASE_DIR, "database")
    BACKUP_DIR = os.path.join(DB_DIR, "backups")
    dest_db_path = os.path.join(DB_DIR, "prakriti.db")

    print(f"[*] Workspace Root: {BASE_DIR}")
    print(f"[*] Database Dir:   {DB_DIR}")
    print(f"[*] Backups Dir:    {BACKUP_DIR}")
    print(f"[*] Target DB Path: {dest_db_path}")

    # 2. Check if the backups directory exists
    if not os.path.exists(BACKUP_DIR):
        print(f"\n[Error] Backup folder not found: {BACKUP_DIR}")
        print("[!] No production snapshots are available to restore from. Cannot seed database.")
        sys.exit(1)

    # 3. Find all production snapshot files (prakriti_backup_*.db)
    # Note: excluding development snapshots (prakriti-dev_backup_*.db)
    search_pattern = os.path.join(BACKUP_DIR, "prakriti_backup_*.db")
    snapshots = glob.glob(search_pattern)

    if not snapshots:
        print(f"\n[Warning] No production snapshot files found in backups folder matching 'prakriti_backup_*.db'")
        print("[!] Please make sure a backup has been created first.")
        sys.exit(1)

    # 4. Sort snapshots chronologically (latest modified/created first)
    snapshots.sort(key=os.path.getmtime, reverse=True)
    latest_snapshot = snapshots[0]
    snapshot_filename = os.path.basename(latest_snapshot)

    print(f"\n[+] Found {len(snapshots)} production snapshots.")
    print(f"[+] Latest Snapshot identified: {snapshot_filename}")
    print(f"    - Full Path: {latest_snapshot}")
    print(f"    - Timestamp: {os.path.getmtime(latest_snapshot)}")

    # 5. Ensure target database folder exists (self-healing)
    if not os.path.exists(DB_DIR):
        try:
            os.makedirs(DB_DIR)
            print("[+] Created missing database directory successfully.")
        except Exception as err:
            print(f"[Error] Failed to create database directory: {err}")
            sys.exit(1)

    # 6. Perform the restore operation
    print(f"\n[*] Restoring database file...")
    try:
        # Copy file back, preserving metadata
        shutil.copy2(latest_snapshot, dest_db_path)
        print(f"\n[Success] Production database restored successfully to: {dest_db_path}")
        print(f"[Success] Seeding via snapshot '{snapshot_filename}' complete!")
        print("="*60)
    except Exception as copy_err:
        print(f"\n[Error] Failed to copy snapshot to active database: {copy_err}")
        sys.exit(1)

if __name__ == "__main__":
    restore_production_db()
