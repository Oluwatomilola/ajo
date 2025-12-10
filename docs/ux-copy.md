# UX Copy Guide

Consistent UI text for the Ajo PiggyBank dApp. Keep tone concise, friendly, and action-oriented.

## Buttons
- Connect Wallet: "Connect Wallet"
- Connected Wallet: shows ENS or short address (e.g., 0x1234…abcd). Tooltip: "Manage connection"
- Deposit: "Deposit ETH"
- Withdraw: "Withdraw All"
- Network: "Switch Network"
- Disconnect: "Disconnect"
- Clear history: "Clear"
- View on Explorer: "View on Explorer"

## Labels and placeholders
- Amount (ETH): label "Amount (ETH)"; placeholder "0.00"
- Address badge: short address format `0x1234…abcd`
- Countdown labels: "Days" / "Hours" / "Min" / "Sec"

## Status and helpers
- Home welcome text: "Welcome to Ajo PiggyBank"
- Tagline: "A decentralized savings application on Base blockchain"
- Deposit helper: "You won't be able to withdraw until the lock period ends."
- Lock info (examples):
  - Unlocked: "This piggy bank is unlocked"
  - Approx days: "Locked for approximately {n} day(s)"
  - Approx hours: "Locked for approximately {n} hour(s)"

## Toasts and transaction states
- Pending tx: "Transaction submitted"
- Success tx: "Transaction confirmed"
- Error tx: "Transaction failed"
- Explorer link: "View on Explorer →"

## Warnings and errors
- Invalid amount: "Please enter a valid amount"
- Locked funds: "Your funds are still locked. Please wait until the unlock time."
- No funds: "No funds available to withdraw"
- Unsupported network: "Unsupported network. Please switch to Base."
- Env errors (dev):
  - Missing project ID: "VITE_REOWN_PROJECT_ID is not set. Get one from https://cloud.reown.com/"
  - Invalid address: "VITE_PIGGYBANK_ADDRESS must start with '0x' and be 42 characters"

## Onboarding modal (if added)
- Title: "Get started with Ajo PiggyBank"
- Body: "Connect your wallet, deposit ETH, and let discipline do the rest."
- Primary action: "Connect Wallet"
- Secondary action: "Learn more"
