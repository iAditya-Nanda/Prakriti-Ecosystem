import time
import hashlib
import json
from db import Block, BlockchainTransaction, BCLeaderboardCache, BCUser, BCPendingVerification, BCQRCode

DIFFICULTY = 2
MINING_REWARD = 10.0

def calculate_block_hash(index: int, timestamp: float, transactions: list, previous_hash: str, nonce: int) -> str:
    """Calculate SHA-256 hash of block header and transactions"""
    block_string = json.dumps({
        "index": index,
        "timestamp": timestamp,
        "transactions": transactions,
        "previous_hash": previous_hash,
        "nonce": nonce
    }, sort_keys=True)
    return hashlib.sha256(block_string.encode()).hexdigest()

def serialize_transaction(tx: BlockchainTransaction) -> dict:
    """Serialize database transaction record to matching API schema"""
    d = {
        "transaction_id": tx.transaction_id,
        "from": tx.sender_address,
        "to": tx.recipient_address,
        "amount": tx.amount,
        "type": tx.transaction_type,
        "timestamp": tx.timestamp
    }
    if tx.task_id:
        d["task_id"] = tx.task_id
    if tx.task_name:
        d["task_name"] = tx.task_name
    return d

def ensure_genesis_block(db_session):
    """Ensure genesis block exists in database, confirm it if missing"""
    first_block = db_session.query(Block).filter_by(block_index=0).first()
    if first_block:
        return
    
    genesis_timestamp = 1716336000.0  # Stable mock timestamp
    previous_hash = "0"
    transactions = []
    nonce = 0
    target = "0" * DIFFICULTY
    
    block_hash = calculate_block_hash(0, genesis_timestamp, transactions, previous_hash, nonce)
    while block_hash[:DIFFICULTY] != target:
        nonce += 1
        block_hash = calculate_block_hash(0, genesis_timestamp, transactions, previous_hash, nonce)
        
    genesis = Block(
        block_index=0,
        timestamp=genesis_timestamp,
        previous_hash=previous_hash,
        nonce=nonce,
        hash=block_hash
    )
    db_session.add(genesis)
    try:
        db_session.commit()
        print(f"[Blockchain] Genesis Block created successfully: {block_hash}")
    except Exception as commit_err:
        db_session.rollback()
        print(f"Warning: Genesis block creation error or already exists: {commit_err}")

def get_latest_block(db_session) -> Block:
    """Fetch the latest block in the chain"""
    ensure_genesis_block(db_session)
    return db_session.query(Block).order_by(Block.block_index.desc()).first()

def add_transaction(db_session, sender: str, recipient: str, amount: float,
                    transaction_type: str = "transfer", task_id: str = None,
                    task_name: str = None) -> str:
    """Add new pending transaction to database"""
    if amount <= 0:
        raise ValueError("Transaction amount must be positive")
    if not sender or not recipient:
        raise ValueError("Sender and recipient addresses are required")
        
    # Generate unique transaction id
    tx_string = f"{sender}_{recipient}_{amount}_{time.time()}_{transaction_type}"
    tx_id = hashlib.sha256(tx_string.encode()).hexdigest()[:16]
    
    new_tx = BlockchainTransaction(
        transaction_id=tx_id,
        sender_address=sender,
        recipient_address=recipient,
        amount=amount,
        transaction_type=transaction_type,
        timestamp=time.time(),
        task_id=task_id,
        task_name=task_name,
        block_index=None  # Null represents pending pool
    )
    db_session.add(new_tx)
    db_session.commit()
    return tx_id

def mine_pending_transactions(db_session, miner_address: str) -> dict:
    """Confirm and commit all pending transactions into a new Block"""
    ensure_genesis_block(db_session)
    latest_block = get_latest_block(db_session)
    next_index = latest_block.block_index + 1
    
    # Query all active pending transactions in database
    pending_txs = db_session.query(BlockchainTransaction).filter_by(block_index=None).all()
    
    # Generate system validation reward transaction
    reward_tx_id = hashlib.sha256(f"SYSTEM_{miner_address}_{MINING_REWARD}_{time.time()}_mining_reward".encode()).hexdigest()[:16]
    reward_tx = BlockchainTransaction(
        transaction_id=reward_tx_id,
        sender_address="SYSTEM",
        recipient_address=miner_address,
        amount=MINING_REWARD,
        transaction_type="mining_reward",
        timestamp=time.time(),
        block_index=None
    )
    db_session.add(reward_tx)
    db_session.flush()
    
    # Prepare complete transaction list for hash validation
    tx_list = [serialize_transaction(tx) for tx in pending_txs] + [serialize_transaction(reward_tx)]
    
    nonce = 0
    target = "0" * DIFFICULTY
    block_timestamp = time.time()
    block_hash = calculate_block_hash(next_index, block_timestamp, tx_list, latest_block.hash, nonce)
    
    while block_hash[:DIFFICULTY] != target:
        nonce += 1
        block_hash = calculate_block_hash(next_index, block_timestamp, tx_list, latest_block.hash, nonce)
        
    new_block = Block(
        block_index=next_index,
        timestamp=block_timestamp,
        previous_hash=latest_block.hash,
        nonce=nonce,
        hash=block_hash
    )
    db_session.add(new_block)
    
    # Update all committed transactions to point to this block index
    for tx in pending_txs:
        tx.block_index = next_index
    reward_tx.block_index = next_index
    
    db_session.commit()
    
    # Update Leaderboard Cache
    rebuild_leaderboard(db_session)
    
    return {
        "index": next_index,
        "timestamp": block_timestamp,
        "transactions": tx_list,
        "previous_hash": latest_block.hash,
        "nonce": nonce,
        "hash": block_hash
    }

def get_balance(db_session, address: str) -> float:
    """Calculate total confirmed wallet balance"""
    balance = 0.0
    txs = db_session.query(BlockchainTransaction).filter(
        BlockchainTransaction.block_index.isnot(None),
        (BlockchainTransaction.sender_address == address) | (BlockchainTransaction.recipient_address == address)
    ).all()
    
    for tx in txs:
        if tx.sender_address == address:
            balance -= tx.amount
        if tx.recipient_address == address:
            balance += tx.amount
            
    return balance

def is_chain_valid(db_session) -> bool:
    """Dynamically validate blockchain and cryptographic hashes"""
    blocks = db_session.query(Block).order_by(Block.block_index.asc()).all()
    if not blocks:
        return False
        
    for i in range(1, len(blocks)):
        current_block = blocks[i]
        previous_block = blocks[i - 1]
        
        # Query committed transactions in this block
        txs = db_session.query(BlockchainTransaction).filter_by(block_index=current_block.block_index).all()
        serialized_txs = [serialize_transaction(tx) for tx in txs]
        
        # Verify calculated hash
        recalc_hash = calculate_block_hash(
            current_block.block_index,
            current_block.timestamp,
            serialized_txs,
            current_block.previous_hash,
            current_block.nonce
        )
        if current_block.hash != recalc_hash:
            return False
            
        # Verify reference link
        if current_block.previous_hash != previous_block.hash:
            return False
            
        # Verify proof of work difficulty
        if not current_block.hash.startswith("0" * DIFFICULTY):
            return False
            
    return True

def get_transaction_history(db_session, wallet_address: str) -> list:
    """Fetch complete list of confirmed transactions for wallet address"""
    history = []
    txs = db_session.query(BlockchainTransaction).filter(
        BlockchainTransaction.block_index.isnot(None),
        (BlockchainTransaction.sender_address == wallet_address) | (BlockchainTransaction.recipient_address == wallet_address)
    ).order_by(BlockchainTransaction.timestamp.asc()).all()
    
    for tx in txs:
        block = db_session.query(Block).filter_by(block_index=tx.block_index).first()
        history.append({
            **serialize_transaction(tx),
            "block_index": tx.block_index,
            "block_hash": block.hash if block else ""
        })
    return history

def rebuild_leaderboard(db_session):
    """Rebuild all leaderboard rankings dynamically based on real data"""
    users = db_session.query(BCUser).filter_by(role="user", is_active=1).all()
    for u in users:
        balance = get_balance(db_session, u.wallet_address)
        
        # Tasks completed = approved verifications + used qr codes
        approved_count = db_session.query(BCPendingVerification).filter_by(
            user_id=u.id, status="approved"
        ).count()
        
        qr_count = db_session.query(BCQRCode).filter_by(
            used_by=u.id, is_used=1
        ).count()
        
        tasks_completed = approved_count + qr_count
        
        cache_entry = db_session.query(BCLeaderboardCache).filter_by(user_id=u.id).first()
        if cache_entry:
            cache_entry.name = u.name
            cache_entry.total_gp = balance
            cache_entry.tasks_completed = tasks_completed
            cache_entry.last_updated = time.time()
        else:
            new_cache = BCLeaderboardCache(
                user_id=u.id,
                name=u.name,
                total_gp=balance,
                tasks_completed=tasks_completed,
                last_updated=time.time()
            )
            db_session.add(new_cache)
            
    db_session.commit()
