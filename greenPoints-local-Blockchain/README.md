# 🌱 Green Points Blockchain

A **local blockchain implementation** for rewarding environmental actions with Green Points (GP). This system uses proof-of-work consensus to create an immutable ledger of eco-friendly tasks and rewards.

## 🎯 Overview

Green Points Blockchain is a complete blockchain-based reward system that runs locally on your laptop. Users earn Green Points by completing environmental tasks like recycling, planting trees, saving energy, and more. The blockchain ensures transparent and tamper-proof record-keeping of all transactions.

## ✨ Features

- **⛓️ Complete Blockchain Implementation**
  - Proof-of-work consensus mechanism
  - SHA-256 cryptographic hashing
  - Chain validation and integrity verification
  - Configurable mining difficulty

- **💰 Green Points System**
  - Earn points by completing environmental tasks
  - Transfer points between users
  - Mining rewards for block validators
  - Transparent balance tracking

- **📋 Task Management**
  - 12+ pre-defined green tasks across multiple categories
  - Task categories: Recycling, Energy Saving, Transportation, Water Conservation, etc.
  - Difficulty levels (easy, medium, hard)
  - Optional verification requirements

- **👤 User Management**
  - Wallet creation with unique addresses
  - Balance tracking
  - Transaction history
  - Leaderboard system

- **🖥️ Interactive CLI**
  - User-friendly command-line interface
  - Complete system management
  - Real-time blockchain visualization

## 📁 Project Structure

```
greenpoints-local/
├── blockchain.py      # Core blockchain implementation (Block, Blockchain classes)
├── transaction.py     # Transaction and transaction pool management
├── wallet.py          # User wallet and wallet management
├── tasks.py          # Task definitions and completion tracking
├── cli.py            # Interactive command-line interface
├── demo.py           # Automated demonstration script
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.7 or higher
- No external dependencies required (uses only Python standard library)

### Installation

1. Clone or navigate to the project directory:
```bash
cd greenpoints-local-blockchain
```

2. Make scripts executable (optional):
```bash
chmod +x cli.py demo.py
```

### Running the Demo

See the blockchain in action with a pre-configured simulation:

```bash
python demo.py
```

This will:
- Initialize the blockchain
- Create 4 sample users
- Complete various environmental tasks
- Mine blocks with transactions
- Display the complete blockchain state
- Show leaderboard and statistics

### Using the Interactive CLI

Launch the interactive interface:

```bash
python cli.py
```

The CLI provides a full menu system for:
- Creating users
- Viewing available tasks
- Completing tasks
- Mining blocks
- Checking balances
- Transferring points
- Viewing blockchain state
- And more!

## 📖 How It Works

### 1. Blockchain Core

The blockchain uses **proof-of-work** consensus:
- Each block contains multiple transactions
- Blocks are linked via cryptographic hashes
- Mining requires finding a hash with specific leading zeros
- Default difficulty: 2 (configurable)

### 2. Green Points Economy

- **Task Rewards**: Complete environmental tasks to earn GP
- **Mining Rewards**: 10 GP for mining a block
- **Transfers**: Send GP to other users
- **System Account**: "SYSTEM" issues task rewards

### 3. Task Categories

Available task categories:
- 🔄 **Recycling**: Paper, plastic, electronics
- ⚡ **Energy Saving**: LED bulbs, reduced consumption
- 🚲 **Transportation**: Biking, public transport
- 💧 **Water Conservation**: Water-saving devices
- 🌳 **Tree Planting**: Community tree planting
- 🗑️ **Waste Reduction**: Composting, zero-waste shopping
- 📚 **Education**: Environmental workshops
- 🤝 **Community**: Cleanups, volunteering

### 4. Workflow Example

```
1. Alice creates a wallet → Gets unique address
2. Alice completes "Plant a Tree" task → 100 GP added to pending
3. Bob mines the block → Alice receives 100 GP, Bob gets 10 GP mining reward
4. Alice transfers 50 GP to Charlie → Transaction added to pending pool
5. Diana mines the block → Transfer is completed
```

## 💻 Code Examples

### Creating a Blockchain Programmatically

```python
from blockchain import Blockchain
from wallet import UserManager
from tasks import TaskManager
from transaction import Transaction

# Initialize components
blockchain = Blockchain(difficulty=2)
user_manager = UserManager()
task_manager = TaskManager()

# Create users
alice = user_manager.create_wallet("alice", "alice@example.com")
bob = user_manager.create_wallet("bob")

# Complete a task
tasks = task_manager.get_all_tasks()
completion = task_manager.complete_task(
    tasks[0].task_id,
    alice.address,
    "Recycled 10kg of paper"
)

# Create reward transaction
tx = Transaction(
    sender="SYSTEM",
    recipient=alice.address,
    amount=tasks[0].reward_points,
    transaction_type="task_reward",
    task_id=tasks[0].task_id
)
blockchain.add_transaction(tx.to_dict())

# Mine block
block = blockchain.mine_pending_transactions(bob.address)

# Check balance
print(f"Alice's balance: {blockchain.get_balance(alice.address)} GP")
```

### Validating the Blockchain

```python
# Check blockchain integrity
is_valid = blockchain.is_chain_valid()
print(f"Blockchain valid: {is_valid}")

# Display entire chain
blockchain.display_chain()
```

## 🎮 CLI Menu Options

```
👤 USER MANAGEMENT
  1. Create new user
  2. View all users
  3. Check user balance

📋 TASK MANAGEMENT
  4. View all tasks
  5. Complete a task
  6. View my completed tasks

⛏️ BLOCKCHAIN OPERATIONS
  7. Mine pending transactions
  8. View blockchain
  9. Validate blockchain
  10. View transaction history

📊 STATISTICS
  11. View leaderboard
  12. System statistics

🔧 OTHER
  13. Transfer green points
  0. Exit
```

## 🔍 Technical Details

### Block Structure
```python
{
    "index": int,
    "timestamp": float,
    "transactions": [Transaction],
    "previous_hash": str,
    "nonce": int,
    "hash": str
}
```

### Transaction Structure
```python
{
    "transaction_id": str,
    "from": str,
    "to": str,
    "amount": float,
    "type": str,  # "transfer", "task_reward", "mining_reward"
    "timestamp": float,
    "task_id": str (optional),
    "task_name": str (optional)
}
```

### Mining Algorithm

The proof-of-work algorithm requires finding a nonce such that:
```
SHA256(block_data + nonce) starts with 'difficulty' number of zeros
```

With difficulty=2, the hash must start with "00..."

## 🎯 Available Tasks (Default)

| Task | Category | Points | Difficulty |
|------|----------|--------|------------|
| Recycle Paper | Recycling | 50 | Easy |
| Recycle Plastic | Recycling | 45 | Easy |
| Plant a Tree | Tree Planting | 100 | Medium |
| Use Public Transport | Transportation | 75 | Medium |
| Bike to Work | Transportation | 80 | Medium |
| Save Electricity | Energy Saving | 120 | Hard |
| LED Bulb Installation | Energy Saving | 60 | Easy |
| Composting | Waste Reduction | 90 | Medium |
| Zero Waste Shopping | Waste Reduction | 70 | Medium |
| Water Conservation | Water Conservation | 55 | Easy |
| Community Cleanup | Community | 85 | Medium |
| Environmental Workshop | Education | 40 | Easy |

## 📊 Blockchain Statistics

The system tracks:
- Total number of users
- Tasks completed
- Blockchain length
- Pending transactions
- Total Green Points in circulation
- Mining difficulty
- Transaction history per user

## 🔒 Security Features

- **Cryptographic Hashing**: SHA-256 for block and transaction IDs
- **Chain Validation**: Verify entire blockchain integrity
- **Immutability**: Once mined, blocks cannot be altered
- **Proof-of-Work**: Computational cost prevents spam
- **Balance Verification**: Prevents spending more than available

## 🌟 Future Enhancements

Potential improvements:
- Persistent storage (save/load blockchain to disk)
- Network capabilities (multiple nodes)
- Smart contracts for automated rewards
- Web interface
- Mobile app integration
- More task categories
- Task verification system
- Reputation scoring
- Green Points marketplace

## 🤝 Contributing

This is a local simulation project for learning and demonstration. Feel free to:
- Modify task definitions
- Adjust mining difficulty
- Add new features
- Improve the UI
- Optimize algorithms

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

Built with Python's standard library:
- `hashlib` for cryptographic hashing
- `json` for data serialization
- `time` for timestamps
- `typing` for type hints

## 📞 Support

For issues or questions:
1. Check the code comments
2. Run the demo script to see examples
3. Review this README

---

**Made with 💚 for a greener planet**

Start your green journey today! 🌱
```

Remember to run `python demo.py` to see the blockchain in action!
