// PiggyBank Smart Contract Configuration

import { NETWORK } from '../constants/appConstants';

export const PIGGYBANK_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_unlockTime', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'constructor'
  },
  { inputs: [], name: 'PiggyBank__Blacklisted', type: 'error' },
  { inputs: [], name: 'PiggyBank__DepositTooHigh', type: 'error' },
  { inputs: [], name: 'PiggyBank__DepositTooLow', type: 'error' },
  { inputs: [], name: 'PiggyBank__EmergencyModeActive', type: 'error' },
  { inputs: [], name: 'PiggyBank__InsufficientBalance', type: 'error' },
  { inputs: [], name: 'PiggyBank__InvalidLockTime', type: 'error' },
  { inputs: [], name: 'PiggyBank__InvalidUnlockTime', type: 'error' },
  { inputs: [], name: 'PiggyBank__MaxUsersReached', type: 'error' },
  { inputs: [], name: 'PiggyBank__NoDeposit', type: 'error' },
  { inputs: [], name: 'PiggyBank__NotOwner', type: 'error' },
  { inputs: [], name: 'PiggyBank__Paused', type: 'error' },
  { inputs: [], name: 'PiggyBank__ReentrancyAttack', type: 'error' },
  { inputs: [], name: 'PiggyBank__StillLocked', type: 'error' },
  { inputs: [], name: 'PiggyBank__TransferFailed', type: 'error' },
  { inputs: [], name: 'PiggyBank__Unauthorized', type: 'error' },
  { inputs: [], name: 'PiggyBank__ZeroAddress', type: 'error' },
  { inputs: [], name: 'PiggyBank__ZeroAmount', type: 'error' },
  { inputs: [], name: 'PiggyBank__ZeroValue', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldLimit', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newLimit', type: 'uint256' }
    ],
    name: 'DepositLimitUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'depositor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'Deposited',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oldGuardian', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newGuardian', type: 'address' }
    ],
    name: 'EmergencyGuardianChanged',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'activator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'unlockTime', type: 'uint256' }
    ],
    name: 'EmergencyModeActivated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'EmergencyWithdrawal',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Paused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Unpaused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'withdrawer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'Withdrawn',
    type: 'event'
  },
  { stateMutability: 'payable', type: 'fallback' },
  {
    inputs: [],
    name: 'MAX_DEPOSIT_AMOUNT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'MAX_LOCK_TIME',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'MIN_DEPOSIT_AMOUNT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'MIN_LOCK_TIME',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_unlockTime', type: 'uint256' }],
    name: 'activateEmergencyMode',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'canWithdraw',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'deactivateEmergencyMode',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'depositTimestamps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'deposits',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergencyGuardian',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergencyMode',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergencyUnlockTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getContractStats',
    outputs: [
      { internalType: 'uint256', name: 'totalDeposits_', type: 'uint256' },
      { internalType: 'uint256', name: 'totalWithdrawals_', type: 'uint256' },
      { internalType: 'uint256', name: 'numberOfDepositors_', type: 'uint256' },
      { internalType: 'bool', name: 'emergencyMode_', type: 'bool' },
      { internalType: 'uint256', name: 'contractBalance_', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getEmergencyTimeRemaining',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getMaxAdditionalDeposit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTimeRemaining',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getUnlockTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserDepositInfo',
    outputs: [
      { internalType: 'uint256', name: 'userDeposit', type: 'uint256' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'uint256', name: 'count', type: 'uint256' },
      { internalType: 'uint256', name: 'timeRemaining', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'isUnlocked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'numberOfDepositors',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'newGuardian', type: 'address' }],
    name: 'setEmergencyGuardian',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalDeposits',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalWithdrawals',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unlockTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'newMaxAmount', type: 'uint256' }],
    name: 'updateMaxDepositAmount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'userDepositCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'withdrawAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  { stateMutability: 'payable', type: 'receive' }
] as const

// Contract address - Update this after deployment
export const PIGGYBANK_ADDRESS = (import.meta.env.VITE_PIGGYBANK_ADDRESS || '') as `0x${string}`

// Network configuration
export const CHAIN_ID: number = 84532 // Base Sepolia testnet

// Contract limits - must match PiggyBank.sol contract constants
// NOTE: values are in ETH (frontend UI units). Contract uses uint256 max for max deposit.
export const MAX_DEPOSIT_AMOUNT = 100 // 100 ETH (UI validation)
export const MIN_DEPOSIT_AMOUNT = 0.001 // 0.001 ETH
