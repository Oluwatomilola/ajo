# PiggyBank Smart Contract Documentation

This document describes the expected PiggyBank contract interface used by the Ajo PiggyBank dApp. The contract itself should live in a separate Solidity/Foundry repository and be deployed to Base Sepolia or Base Mainnet.

## Overview

- Enforces time-locked savings for a single owner.
- Accepts ETH deposits during the lock period.
- Allows owner to withdraw all funds after `unlockTime`.

## Public interface

Functions (as used by the frontend ABI):

- `constructor(uint256 _unlockTime) payable`
  - Initializes `owner` to `msg.sender` and sets the `unlockTime` timestamp (in seconds).
  - Optionally accepts initial ETH.

- `function deposit() external payable`
  - Accepts ETH deposits. Does not change the lock time.

- `function withdraw() external`
  - Reverts if `block.timestamp < unlockTime`.
  - Reverts if `msg.sender != owner`.
  - Transfers the entire contract balance to the owner.

- `function getBalance() external view returns (uint256)`
  - Returns `address(this).balance`.

- `function owner() external view returns (address)`
  - Returns the owner address.

- `function unlockTime() external view returns (uint256)`
  - Returns the unlock timestamp (seconds since epoch).

## Events

- The minimal ABI currently used by the frontend does not include events.
  - You may optionally add:
    - `event Deposited(address indexed from, uint256 amount);`
    - `event Withdrawn(address indexed to, uint256 amount);`

Update the frontend ABI if you add events.

## Storage layout

- `address public owner;`
- `uint256 public unlockTime;`

No other persistent storage is required by the frontend.

## Preconditions and invariants

- Only `owner` can withdraw.
- `withdraw` must not succeed before `unlockTime`.
- `deposit` must be payable and not modify ownership or unlock time.

## Testing checklist (contracts)

- Deploy with future `unlockTime` and ensure `withdraw` reverts before that time.
- After `unlockTime`, `withdraw` sends entire balance to `owner`.
- `getBalance` equals total deposits minus withdrawals.
- Optional: events emitted on deposit/withdraw if implemented.
