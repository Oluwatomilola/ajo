# Demo Script

This script has a 30–60s quick demo and a 2–3 minute extended demo. Adjust lines to your voice and pacing.

## 30–60 seconds
1. Open the app and show the home screen.
2. Click "Connect Wallet" (REOWN AppKit opens), connect to Base Sepolia.
3. Show the wallet address badge and Network Switcher.
4. Enter an amount and click "Deposit ETH". Point out the pending toast and explorer link.
5. Show the balance updating and the time-lock countdown.
6. If the lock is expired (or in a pre-deployed demo), click "Withdraw All" to complete.

Key lines:
- "Ajo PiggyBank helps you save with a time lock on Base."
- "I connect via REOWN AppKit, compatible with WalletConnect wallets."
- "Here I deposit 0.01 ETH; a toast appears with a link to the explorer."
- "The balance updates and a countdown shows when it unlocks."

## 2–3 minutes
1. Introduce the concept: time-locked savings, owner-only withdraw after unlock.
2. Walk through wallet connection and supported networks (Base Sepolia/Mainnet). Show the Network Switcher.
3. Review environment variables briefly: project ID, contract address.
4. Deposit flow: amount entry, validations, toasts, and live status.
5. Show Wallet page: Wallet Info (address, network, balance), Connection History, and REOWN info.
6. Explain timelock UX: countdown, unlocked state, and withdraw precondition.
7. Withdraw flow: show disabled state until unlocked; then withdraw and explorer link.
8. Wrap up: portability to Base mainnet and how the contract lives separately.

Sample voiceover lines:
- "With Ajo PiggyBank, deposits are locked until a specific time; only the owner can withdraw."
- "The UI uses Wagmi and Viem for chain interactions, and REOWN AppKit for wallet connections."
- "If I switch networks, the app warns me and I can change to Base with one click."
- "Connection history is stored locally so I can quickly see recent accounts."
