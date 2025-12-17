# PiggyBank Smart Contract Documentation

This document describes the expected PiggyBank contract interface used by the Ajo PiggyBank dApp. The contract itself should live in a separate Solidity/Foundry repository and be deployed to Base Sepolia or Base Mainnet.

> **For comprehensive API documentation**, see [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

## Overview

- Enforces time-locked savings for a single owner.
- Accepts ETH deposits during the lock period.
- Allows owner to withdraw all funds after `unlockTime`.
- Includes pause functionality for emergency situations.
- Supports ownership transfer.

## Public interface

Functions (as used by the frontend ABI):

- `constructor(uint256 _unlockTime) payable`

  - Initializes `owner` to `msg.sender` and sets the `unlockTime` timestamp (in seconds).
  - Optionally accepts initial ETH during deployment.

- `function deposit() external payable`

  - Accepts ETH deposits from anyone when contract is not paused.
  - Requires deposit amount > 0.
  - Emits `Deposited` event.

- `function withdraw() external`

  - Allows owner to withdraw all ETH after unlock time when contract is not paused.
  - Reverts if `block.timestamp < unlockTime`.
  - Reverts if `msg.sender != owner`.
  - Reverts if contract is paused.
  - Transfers the entire contract balance to the owner.
  - Emits `Withdrawn` event.

- `function getBalance() external view returns (uint256)`

  - Returns `address(this).balance`.

- `function owner() external view returns (address)`

  - Returns the owner address.

- `function unlockTime() external view returns (uint256)`

  - Returns the unlock timestamp (seconds since epoch).

- `function isUnlocked() external view returns (bool)`

  - Returns whether the current timestamp is >= unlockTime.

- `function paused() external view returns (bool)`

  - Returns whether the contract is currently paused.

- `function pause() external`

  - Pauses the contract, disabling deposits and withdrawals.
  - Can only be called by the owner when contract is not already paused.
  - Emits `Paused` event.

- `function unpause() external`

  - Unpauses the contract, re-enabling deposits and withdrawals.
  - Can only be called by the owner when contract is paused.
  - Emits `Unpaused` event.

- `function transferOwnership(address newOwner) external`

  - Transfers ownership to a new address.
  - Can only be called by the current owner.
  - Reverts if newOwner is the zero address.
  - Emits `OwnershipTransferred` event.

## Events

The contract emits the following events:

- `event Deposited(address indexed depositor, uint256 amount)`
  - Emitted when ETH is deposited into the contract

- `event Withdrawn(address indexed withdrawer, uint256 amount)`
  - Emitted when ETH is withdrawn from the contract

- `event Paused(address account)`
  - Emitted when the contract is paused

- `event Unpaused(address account)`
  - Emitted when the contract is unpaused

- `event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`
  - Emitted when ownership is transferred

## Storage layout

- `address public owner;`
- `uint256 public unlockTime;`
- `bool public paused;`

## Preconditions and invariants

- Only `owner` can withdraw.
- `withdraw` must not succeed before `unlockTime`.
- `deposit` must be payable and not modify ownership or unlock time.
- Contract functions revert when called in paused state (except pause/unpause).
- Ownership transfer requires non-zero new owner address.

## Testing checklist (contracts)

- Deploy with future `unlockTime` and ensure `withdraw` reverts before that time.
- After `unlockTime`, `withdraw` sends entire balance to `owner`.
- `getBalance` equals total deposits minus withdrawals.
- Optional: events emitted on deposit/withdraw if implemented.

---

## ⚡ Quick Setup Guide

**Get the frontend running with a PiggyBank contract in under 5 minutes!**

This section provides the fastest way to configure the frontend for testing with a local or deployed PiggyBank contract.

### Prerequisites

- Node.js (v18+) and npm
- Foundry installed (for local contract deployment)
- REOWN Project ID from [https://cloud.reown.com/](https://cloud.reown.com/)

### 🚀 Fast Track Options

#### Option A: Quick Local Setup (Fastest - 2 minutes)

1. **Setup environment:**

   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Use the automated setup script:**

   ```bash
   # Unix/Linux/macOS
   ./scripts/switch-env.sh local

   # Windows PowerShell
   .\scripts\switch-env.ps1 -Environment local
   ```

3. **Start everything:**

   ```bash
   # Terminal 1: Start local blockchain
   anvil

   # Terminal 2: Deploy contract (if needed)
   forge create PiggyBank --rpc-url http://localhost:8545 --constructor-args 3600

   # Terminal 3: Start frontend
   npm run dev
   ```

**🎯 Result:** Frontend runs at `http://localhost:3000` with local contract!

#### Option B: Use Existing Testnet Contract (1 minute)

1. **Get a testnet contract address** from your team or deploy one yourself.

2. **Configure environment:**

   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env and set:
   VITE_REOWN_PROJECT_ID=your_project_id_here
   VITE_PIGGYBANK_ADDRESS=0x_your_testnet_contract_address_here
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

**🎯 Result:** Frontend connected to Base Sepolia testnet!

#### Option C: Production Mainnet Setup (1 minute)

1. **Get your mainnet contract address.**

2. **Configure environment:**

   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env and set:
   VITE_REOWN_PROJECT_ID=your_project_id_here
   VITE_PIGGYBANK_ADDRESS=0x_your_mainnet_contract_address_here
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

**⚠️ Warning:** This uses real ETH on Base mainnet!

### 🔄 Environment Switching

Switch between environments instantly:

```bash
cd frontend

# Switch to local development
./scripts/switch-env.sh local

# Switch to testnet
./scripts/switch-env.sh sepolia

# Switch to mainnet
./scripts/switch-env.sh mainnet
```

### ✅ Verification Checklist

- [ ] `VITE_REOWN_PROJECT_ID` is set in `.env`
- [ ] `VITE_PIGGYBANK_ADDRESS` is set correctly for your target network
- [ ] Frontend loads without errors
- [ ] Wallet connects successfully
- [ ] Contract address matches deployed contract on correct network

### 🆘 Need Help?

- **Detailed setup:** See full [Local Development Setup Guide](#-local-development-setup) below
- **Script issues:** Check [Environment Management Scripts](#step-8-environment-management-script)
- **Common problems:** See [Troubleshooting Local Development](#troubleshooting-local-development)

---

## 🔧 Local Development Setup

This section provides step-by-step instructions for contributors to set up local development and testing with the PiggyBank contract.

### Prerequisites

- **Foundry** - Install from [foundry.rs](https://foundry.rs/)
- **Node.js** (v18+) and **npm**
- **REOWN Project ID** - Get from [https://cloud.reown.com/](https://cloud.reown.com/)

### Step 1: Contract Development Setup

1. **Clone and setup contracts:**

   ```bash
   git clone <your-contracts-repo>
   cd <your-contracts-repo>
   forge install
   forge build
   ```

2. **Run tests:**
   ```bash
   forge test -vvv
   ```

### Step 2: Local Contract Deployment

#### Option A: Using Anvil (Recommended for local development)

1. **Start Anvil local chain:**

   ```bash
   anvil
   ```

2. **Deploy PiggyBank contract:**

   ```bash
   # Deploy with 1 hour unlock time (3600 seconds from now)
   forge create PiggyBank --rpc-url http://localhost:8545 --constructor-args 3600
   ```

3. **Copy the deployed contract address:**
   ```
   Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

#### Option B: Using Hardhat local network

1. **Setup Hardhat project:**

   ```bash
   npm install --save-dev hardhat
   npx hardhat init
   ```

2. **Deploy script:**

   ```javascript
   // scripts/deploy.js
   async function main() {
     const PiggyBank = await ethers.getContractFactory("PiggyBank");
     const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
     const piggyBank = await PiggyBank.deploy(unlockTime);
     await piggyBank.deployed();
     console.log("PiggyBank deployed to:", piggyBank.address);
   }
   ```

3. **Run deployment:**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Step 3: Frontend Configuration for Local Development

1. **Setup frontend:**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file:**

   ```env
   VITE_REOWN_PROJECT_ID=your_project_id_from_cloud_reown
   VITE_PIGGYBANK_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```

### Step 4: Local Testing Workflow

#### Complete Local Setup (Contracts + Frontend)

1. **Terminal 1 - Start local blockchain:**

   ```bash
   anvil
   ```

2. **Terminal 2 - Deploy contracts:**

   ```bash
   forge create PiggyBank --rpc-url http://localhost:8545 --constructor-args 3600
   # Copy the deployed address
   ```

3. **Terminal 3 - Setup and start frontend:**

   ```bash
   cd frontend
   cp .env.example .env
   # Update VITE_PIGGYBANK_ADDRESS with deployed address
   npm install
   npm run dev
   ```

4. **Connect wallet to local network:**
   - Add Anvil network to MetaMask
   - Import Anvil private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

#### Network Switching for Testing

**Configure multiple environments in `.env`:**

```env
# Local development
VITE_PIGGYBANK_ADDRESS_LOCAL=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Base Sepolia testnet
VITE_PIGGYBANK_ADDRESS_SEPOLIA=0x1234567890123456789012345678901234567890

# Base mainnet (production)
VITE_PIGGYBANK_ADDRESS_MAINNET=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

**Switch networks by updating `VITE_PIGGYBANK_ADDRESS` in your `.env` file.**

### Step 5: Contract Verification and Debugging

1. **Verify local contract deployment:**

   ```bash
   # Check contract exists
   cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://localhost:8545

   # Call contract functions
   cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "owner()" --rpc-url http://localhost:8545
   cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "unlockTime()" --rpc-url http://localhost:8545
   ```

2. **Test contract interactions:**

   ```bash
   # Deposit 1 ETH
   cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "deposit()" --value 1ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

   # Check balance
   cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "getBalance()" --rpc-url http://localhost:8545
   ```

### Step 6: Frontend Testing with Local Contract

1. **Open frontend in browser:**

   - Go to `http://localhost:3000`
   - Connect MetaMask to localhost network
   - Import Anvil test account

2. **Test functionality:**
   - Connect wallet to local contract
   - Check if contract address is correct in Network tab
   - Test deposit and withdrawal functionality
   - Verify events are being detected

### Troubleshooting Local Development

**Common Issues:**

1. **"Contract not deployed" error:**

   - Verify contract address in `.env`
   - Check local chain is running
   - Ensure correct network is selected in MetaMask

2. **"Function not found" error:**

   - Verify ABI matches deployed contract
   - Check contract address is correct
   - Clear browser cache and restart frontend

3. **Transaction fails:**
   - Check sufficient ETH balance in test account
   - Verify unlock time hasn't passed
   - Check if you're the contract owner

**Debug Commands:**

```bash
# Check chain ID
cast chain-id --rpc-url http://localhost:8545

# Check account balance
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Check gas price
cast gas-price --rpc-url http://localhost:8545
```

### Step 7: Deployment to Testnet/Mainnet

#### Base Sepolia Testnet Deployment

1. **Setup environment variables:**

   ```bash
   export RPC_URL="https://sepolia.base.org"
   export PRIVATE_KEY="your_private_key_here"
   ```

2. **Deploy to testnet:**

   ```bash
   forge create PiggyBank --rpc-url $RPC_URL --private-key $PRIVATE_KEY --constructor-args 3600
   ```

3. **Update frontend configuration:**
   ```env
   VITE_PIGGYBANK_ADDRESS=0xyour_testnet_address_here
   ```

#### Base Mainnet Deployment

1. **Setup mainnet environment:**

   ```bash
   export RPC_URL="https://mainnet.base.org"
   export PRIVATE_KEY="your_mainnet_private_key"
   ```

2. **Deploy to mainnet:**

   ```bash
   forge create PiggyBank --rpc-url $RPC_URL --private-key $PRIVATE_KEY --constructor-args 31536000
   # (1 year unlock time for production)
   ```

3. **Update frontend for production:**
   ```env
   VITE_PIGGYBANK_ADDRESS=0xyour_mainnet_address_here
   ```

### Step 8: Environment Management Script

Create a helper script for environment switching:

```bash
#!/bin/bash
# scripts/switch-env.sh

case "$1" in
  "local")
    echo "Switching to local development"
    echo "VITE_PIGGYBANK_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3" > .env
    echo "Using local contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3"
    ;;
  "sepolia")
    echo "Switching to Base Sepolia testnet"
    echo "VITE_PIGGYBANK_ADDRESS=0x1234567890123456789012345678901234567890" > .env
    echo "Using testnet contract: 0x1234567890123456789012345678901234567890"
    ;;
  "mainnet")
    echo "Switching to Base mainnet"
    echo "VITE_PIGGYBANK_ADDRESS=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" > .env
    echo "Using mainnet contract: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    ;;
  *)
    echo "Usage: $0 {local|sepolia|mainnet}"
    exit 1
    ;;
esac

echo "✅ Environment switched. Restart frontend with: npm run dev"
```

Make executable and use:

```bash
chmod +x scripts/switch-env.sh
./scripts/switch-env.sh local
```

This comprehensive setup guide ensures contributors can easily configure and test the frontend with local/deployed PiggyBank contracts across different environments.
