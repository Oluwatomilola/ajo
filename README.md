# Ajo PiggyBank – Decentralized Savings dApp

Ajo PiggyBank is a decentralized savings application that allows users to deposit ETH into an on-chain piggy bank, lock it for a defined period, and withdraw only after the lock has expired. This repository currently hosts the **React + Vite** frontend, which is designed to connect to a `PiggyBank` smart contract (typically maintained in a separate Foundry repository) deployed on the Base network.

---

## Overview

The Ajo PiggyBank dApp is built to encourage disciplined savings by enforcing time-locked deposits on-chain.

Key capabilities:

- Connect an Ethereum wallet using **REOWN AppKit** with **WalletConnect v2**.
- Deposit ETH into a personal piggy bank contract.
- Configure time-locked savings with enforced lock periods.
- View real-time balance, lock status, and countdown timer.
- Withdraw funds only after the configured unlock time has passed.

> **Scope of this repository:** only the frontend lives here (in `frontend/`). The `PiggyBank` smart contract itself should be managed in a dedicated Solidity/Foundry repository and deployed separately to Base testnet or mainnet.

---

## Tech Stack

| Layer               | Technology                          |
| ------------------- | ----------------------------------- |
| Frontend            | React 19, Vite 7, TypeScript        |
| State / Data        | TanStack Query                      |
| Wallet Integration  | REOWN AppKit, WalletConnect v2      |
| Ethereum Toolkit    | Wagmi, Viem                         |
| Blockchain Network  | Base (Testnet / Mainnet ready)      |
| Smart Contracts     | Solidity (via Foundry – external)   |
| Tooling & Quality   | ESLint, TypeScript, Prettier        |

---

## Project Structure

```text
.
├── frontend/                # React + Vite dApp (UI and wallet integration)
└── README.md                # Project-level documentation (this file)
```

- Frontend details (components, hooks, config, scripts) are documented in `frontend/README.md`.
- The `PiggyBank` smart contract code is expected to live in a **separate** Solidity/Foundry repository (for example, `piggybank-contracts`) and is **not** part of this repo.

### Quickstart (Frontend + Contracts)

Use this if you want to run both the contracts (in your own Foundry repo) and the frontend locally:

1. Contracts (in your contracts repo):

   ```bash
   forge install
   forge build
   forge test -vvv
   # deploy and copy the deployed PiggyBank address
   ```

2. Frontend (in this repo):

   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # set VITE_REOWN_PROJECT_ID and VITE_PIGGYBANK_ADDRESS
   npm run dev
   ```

Additional details on the expected contract interface live in [CONTRACTS.md](./CONTRACTS.md). UX copy and demo scripts are in [docs/](./docs/).

Add a link here to your contracts repository once it is available, for example:

```text
Contracts repository: https://github.com/<org-or-user>/piggybank-contracts
```

---

## Frontend – Getting Started

### Prerequisites

- Node.js **v18+**
- npm (or another Node.js package manager)
- A REOWN Project ID (from [https://cloud.reown.com/](https://cloud.reown.com/))
- A WalletConnect-compatible Ethereum wallet (e.g. MetaMask)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy the example file and set the required values:\r

```bash
cd frontend
cp .env.example .env
```

Edit `.env` and provide your configuration:

```env
VITE_REOWN_PROJECT_ID=your_reown_project_id_here
VITE_PIGGYBANK_ADDRESS=deployed_piggybank_contract_address
```

- `VITE_REOWN_PROJECT_ID` – Project ID from REOWN Cloud.
- `VITE_PIGGYBANK_ADDRESS` – Address of the deployed `PiggyBank` smart contract on the Base network.

### 3. Run the Development Server

```bash
cd frontend
npm run dev
```

By default, Vite serves the application at `http://localhost:3000` (or another available port as indicated in the terminal).

### 4. Build, Preview, and Lint

From the `frontend/` directory:

- Build for production:

  ```bash
  npm run build
  ```

- Preview the built app locally:

  ```bash
  npm run preview
  ```

- Lint the codebase:

  ```bash
  npm run lint
  ```

- Type-check the project:

  ```bash
  npm run type-check
  ```

---

## Smart Contract (Conceptual Overview)

The actual `PiggyBank` implementation should live in your contracts repository (for example, a Foundry project) and be deployed to Base Sepolia or Base mainnet. The frontend in this repo only **consumes** that contract via its address and ABI.

A typical `PiggyBank` contract used with this dApp exposes the following behaviour:

- Stores the owner address.
- Stores a timestamp representing when funds can be withdrawn.
- Accepts ETH deposits while locked.
- Allows the owner to withdraw only after the unlock time.

An illustrative example contract might look as follows (for reference only):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PiggyBank {
    address public owner;
    uint256 public unlockTime;

    constructor(uint256 _unlockTime) payable {
        owner = msg.sender;
        unlockTime = _unlockTime;
    }

    function deposit() external payable {}

    function withdraw() external {
        require(block.timestamp >= unlockTime, "PiggyBank: Locked");
        require(msg.sender == owner, "PiggyBank: Not owner");
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
```

The canonical source of truth for the contract (files, tests, deployment scripts) should be your contracts repository. Use this section to link to it and briefly describe how the frontend and contracts are wired together (e.g. how the ABI and address are kept in sync).

---

## Testing and Quality

### Frontend

From the `frontend/` directory:

- Run linting:

  ```bash
  npm run lint
  ```

- Run TypeScript type checks:

  ```bash
  npm run type-check
  ```

### Smart Contracts (Foundry – Example)

If you manage the `PiggyBank` smart contract with [Foundry](https://book.getfoundry.sh/), a typical workflow might look like:

```bash
forge install
forge build
forge test -vvv
```

Adapt these commands to match your actual contracts repository structure.

---

## Deployment

1. Build the frontend:

   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the contents of `frontend/dist` to your preferred static hosting platform (e.g. Vercel, Netlify, Cloudflare Pages, or an S3 + CDN setup).

3. Ensure the deployed environment has the correct `VITE_REOWN_PROJECT_ID` and `VITE_PIGGYBANK_ADDRESS` values configured.

---

## Security and Disclaimer

- Always audit and thoroughly test smart contracts before deploying to mainnet.
- Do not deposit more funds than you are willing to lose while the system is under active development.
- This project is provided for educational and experimental purposes and comes with no guarantees.

---

## License
MIT