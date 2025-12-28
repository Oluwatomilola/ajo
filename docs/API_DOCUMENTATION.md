# PiggyBank Smart Contract API Documentation

This document provides comprehensive API documentation for the PiggyBank smart contract, including all functions, events, and usage patterns.

## Table of Contents

- [Contract Overview](#contract-overview)
- [Functions](#functions)
  - [Constructor](#constructor)
  - [Deposit Functions](#deposit-functions)
  - [Withdrawal Functions](#withdrawal-functions)
  - [View Functions](#view-functions)
  - [Admin Functions](#admin-functions)
- [Events](#events)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Contract Overview

The PiggyBank contract is a decentralized time-locked savings solution that enforces disciplined ETH deposits. Key features include:

- **Time-locked withdrawals**: Funds can only be withdrawn after a specified unlock time
- **Multi-user deposits**: Anyone can deposit ETH into the contract
- **Single-owner withdrawals**: Only the contract owner can withdraw funds
- **Pause functionality**: Emergency pause/unpause for security incidents
- **Ownership transfer**: Ability to transfer contract ownership

## Functions

### Constructor

```solidity
constructor(uint256 _unlockTime) payable
```

**Parameters:**
- `_unlockTime` (uint256): Timestamp (in seconds) when the contract becomes unlocked

**Description:**
Initializes the PiggyBank contract with the specified unlock time. The deployer becomes the initial owner. Can optionally receive ETH during deployment.

**Events Emitted:**
- `OwnershipTransferred(address(0), msg.sender)`

### Deposit Functions

#### deposit

```solidity
function deposit() external payable
```

**Description:**
Allows anyone to deposit ETH into the contract. The function is payable and accepts any positive ETH amount.

**Requirements:**
- Contract must not be paused
- Deposit amount must be > 0

**Events Emitted:**
- `Deposited(msg.sender, msg.value)`

**Error Conditions:**
- `Contract is paused`: If called when contract is paused
- `Must deposit something`: If deposit amount is 0

**Example Usage:**
```javascript
// Using ethers.js
await contract.deposit({ value: ethers.utils.parseEther("1.0") });
```

### Withdrawal Functions

#### withdraw

```solidity
function withdraw() external
```

**Description:**
Allows the contract owner to withdraw all ETH from the contract after the unlock time has passed.

**Requirements:**
- Contract must not be paused
- Current timestamp must be >= unlockTime
- Caller must be the contract owner

**Events Emitted:**
- `Withdrawn(msg.sender, amount)`

**Error Conditions:**
- `Contract is paused`: If called when contract is paused
- `PiggyBank: Still locked`: If called before unlock time
- `PiggyBank: Not owner`: If called by non-owner
- `Transfer failed`: If ETH transfer fails

**Example Usage:**
```javascript
// Using ethers.js
await contract.withdraw();
```

### View Functions

#### getBalance

```solidity
function getBalance() external view returns (uint256)
```

**Returns:**
- `uint256`: Current ETH balance of the contract in wei

**Description:**
Returns the current ETH balance held by the contract.

**Example Usage:**
```javascript
const balance = await contract.getBalance();
console.log(`Contract balance: ${ethers.utils.formatEther(balance)} ETH`);
```

#### getUnlockTime

```solidity
function getUnlockTime() external view returns (uint256)
```

**Returns:**
- `uint256`: Unlock timestamp in seconds since epoch

**Description:**
Returns the timestamp when the contract becomes unlocked for withdrawals.

**Example Usage:**
```javascript
const unlockTime = await contract.getUnlockTime();
console.log(`Unlock time: ${new Date(unlockTime * 1000)}`);
```

#### isUnlocked

```solidity
function isUnlocked() external view returns (bool)
```

**Returns:**
- `bool`: true if contract is unlocked, false otherwise

**Description:**
Returns whether the current timestamp is >= the unlock time.

**Example Usage:**
```javascript
const isUnlocked = await contract.isUnlocked();
console.log(`Contract is ${isUnlocked ? 'unlocked' : 'locked'}`);
```

#### owner

```solidity
function owner() external view returns (address)
```

**Returns:**
- `address`: Current owner address

**Description:**
Returns the address of the current contract owner.

**Example Usage:**
```javascript
const owner = await contract.owner();
console.log(`Contract owner: ${owner}`);
```

#### paused

```solidity
function paused() external view returns (bool)
```

**Returns:**
- `bool`: true if contract is paused, false otherwise

**Description:**
Returns whether the contract is currently paused.

**Example Usage:**
```javascript
const isPaused = await contract.paused();
console.log(`Contract is ${isPaused ? 'paused' : 'active'}`);
```

### Admin Functions

#### pause

```solidity
function pause() external
```

**Description:**
Pauses the contract, disabling deposits and withdrawals. Can only be called by the owner when the contract is not already paused.

**Requirements:**
- Caller must be the contract owner
- Contract must not already be paused

**Events Emitted:**
- `Paused(msg.sender)`

**Error Conditions:**
- `Not owner`: If called by non-owner
- `Contract is not paused`: If contract is already paused

**Example Usage:**
```javascript
await contract.pause();
```

#### unpause

```solidity
function unpause() external
```

**Description:**
Unpauses the contract, re-enabling deposits and withdrawals. Can only be called by the owner when the contract is paused.

**Requirements:**
- Caller must be the contract owner
- Contract must be paused

**Events Emitted:**
- `Unpaused(msg.sender)`

**Error Conditions:**
- `Not owner`: If called by non-owner
- `Contract is not paused`: If contract is not paused

**Example Usage:**
```javascript
await contract.unpause();
```

#### transferOwnership

```solidity
function transferOwnership(address newOwner) external
```

**Parameters:**
- `newOwner` (address): Address to transfer ownership to

**Description:**
Transfers ownership of the contract to a new address.

**Requirements:**
- Caller must be the current owner
- newOwner must not be the zero address

**Events Emitted:**
- `OwnershipTransferred(owner, newOwner)`

**Error Conditions:**
- `Not owner`: If called by non-owner
- `New owner is zero address`: If newOwner is address(0)

**Example Usage:**
```javascript
await contract.transferOwnership("0xNewOwnerAddress");
```

## Events

### Deposited

```solidity
event Deposited(address indexed depositor, uint256 amount)
```

**Parameters:**
- `depositor` (address): Address that made the deposit
- `amount` (uint256): Amount of ETH deposited in wei

**Description:**
Emitted when ETH is successfully deposited into the contract.

### Withdrawn

```solidity
event Withdrawn(address indexed withdrawer, uint256 amount)
```

**Parameters:**
- `withdrawer` (address): Address that initiated the withdrawal
- `amount` (uint256): Amount of ETH withdrawn in wei

**Description:**
Emitted when ETH is successfully withdrawn from the contract.

### Paused

```solidity
event Paused(address account)
```

**Parameters:**
- `account` (address): Address that paused the contract

**Description:**
Emitted when the contract is paused by the owner.

### Unpaused

```solidity
event Unpaused(address account)
```

**Parameters:**
- `account` (address): Address that unpaused the contract

**Description:**
Emitted when the contract is unpaused by the owner.

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

**Parameters:**
- `previousOwner` (address): Previous owner address
- `newOwner` (address): New owner address

**Description:**
Emitted when ownership of the contract is transferred.

## Error Handling

The contract uses descriptive error messages for common failure conditions:

| Error Message | Condition |
|---------------|-----------|
| `Contract is paused` | Function called when contract is paused |
| `Contract is not paused` | Pause/unpause function called in wrong state |
| `Must deposit something` | Deposit called with 0 ETH |
| `PiggyBank: Still locked` | Withdraw called before unlock time |
| `PiggyBank: Not owner` | Owner-only function called by non-owner |
| `New owner is zero address` | Transfer ownership called with zero address |
| `Not owner` | Owner-only function called by non-owner |
| `Transfer failed` | ETH transfer fails during withdrawal |

## Usage Examples

### Complete Workflow Example

```javascript
// Connect to contract
const contract = new ethers.Contract(contractAddress, abi, signer);

// 1. Check contract status
const [balance, unlockTime, isUnlocked, owner] = await Promise.all([
  contract.getBalance(),
  contract.getUnlockTime(),
  contract.isUnlocked(),
  contract.owner()
]);

console.log(`Contract Status:
  Balance: ${ethers.utils.formatEther(balance)} ETH
  Unlock Time: ${new Date(unlockTime * 1000)}
  Is Unlocked: ${isUnlocked}
  Owner: ${owner}
`);

// 2. Deposit ETH
await contract.deposit({ value: ethers.utils.parseEther("1.0") });
console.log("Deposit successful!");

// 3. Check if unlocked and withdraw (if owner)
if (isUnlocked && (await signer.getAddress()) === owner) {
  await contract.withdraw();
  console.log("Withdrawal successful!");
}
```

### Admin Functions Example

```javascript
// Pause the contract (owner only)
await contract.pause();
console.log("Contract paused");

// Transfer ownership
const newOwner = "0xNewOwnerAddress";
await contract.transferOwnership(newOwner);
console.log(`Ownership transferred to ${newOwner}`);

// Unpause the contract
await contract.unpause();
console.log("Contract unpaused");
```

## Best Practices

### Security Considerations

1. **Always verify contract address**: Ensure you're interacting with the correct contract address
2. **Check contract state**: Verify `paused` status before making deposits or withdrawals
3. **Validate unlock time**: Confirm `isUnlocked()` before attempting withdrawals
4. **Use proper error handling**: Handle transaction reverts gracefully in your frontend

### Gas Optimization

1. **Batch view calls**: Use multicall patterns to fetch multiple view function results in one call
2. **Event listening**: Use event listeners for real-time updates instead of polling
3. **Proper transaction monitoring**: Track transaction states (pending, success, failure)

### Testing Recommendations

1. **Test with small amounts**: Always test with small ETH amounts first
2. **Verify unlock time**: Ensure the unlock time is set correctly for your use case
3. **Test pause functionality**: Verify that pause/unpause works as expected
4. **Test ownership transfer**: Confirm ownership transfer works properly

This comprehensive API documentation should help developers understand and integrate with the PiggyBank smart contract effectively.