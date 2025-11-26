// UX Copy Constants
// This file centralizes all UI text used in the application
// For consistency, all text should be defined here and imported where needed

export const BUTTONS = {
  CONNECT_WALLET: 'Connect Wallet',
  DEPOSIT_ETH: 'Deposit ETH',
  WITHDRAW_ALL: 'Withdraw All',
  SWITCH_NETWORK: 'Switch Network',
  DISCONNECT: 'Disconnect',
  CLEAR: 'Clear',
  VIEW_ON_EXPLORER: 'View on Explorer',
};

export const LABELS = {
  AMOUNT_ETH: 'Amount (ETH)',
  AMOUNT_PLACEHOLDER: '0.00',
  DAYS: 'Days',
  HOURS: 'Hours',
  MINUTES: 'Min',
  SECONDS: 'Sec',
};

export const MESSAGES = {
  WELCOME: 'Welcome to Ajo PiggyBank',
  TAGLINE: 'A decentralized savings application on Base blockchain',
  DEPOSIT_HELPER: 'You won\'t be able to withdraw until the lock period ends.',
  LOCKED: 'This piggy bank is locked',
  UNLOCKED: 'This piggy bank is unlocked',
  LOCKED_FOR_DAYS: 'Locked for approximately {n} day(s)',
  LOCKED_FOR_HOURS: 'Locked for approximately {n} hour(s)',
  NO_FUNDS: 'No funds available to withdraw',
  DEPOSIT_SUCCESS: 'Deposit successful! Your ETH is now locked.',
  UNSUPPORTED_NETWORK: 'Unsupported network. Please switch to Base.',
};

export const TRANSACTIONS = {
  PENDING: 'Transaction submitted',
  SUCCESS: 'Transaction confirmed',
  ERROR: 'Transaction failed',
  VIEW_ON_EXPLORER: 'View on Explorer →',
};

export const VALIDATION = {
  INVALID_AMOUNT: 'Please enter a valid amount',
  LOCKED_FUNDS: 'Your funds are still locked. Please wait until the unlock time.',
};

export const ERRORS = {
  MISSING_PROJECT_ID: 'VITE_REOWN_PROJECT_ID is not set. Get one from https://cloud.reown.com/',
  INVALID_ADDRESS: 'VITE_PIGGYBANK_ADDRESS must start with \'0x\' and be 42 characters',
};

export const ONBOARDING = {
  TITLE: 'Get started with Ajo PiggyBank',
  BODY: 'Connect your wallet, deposit ETH, and let discipline do the rest.',
  PRIMARY_ACTION: 'Connect Wallet',
  SECONDARY_ACTION: 'Learn more',
};

export const WALLET = {
  MANAGE_CONNECTION: 'Manage connection',
};

export const formatLockTime = (time: number, unit: 'days' | 'hours'): string => {
  return unit === 'days' 
    ? MESSAGES.LOCKED_FOR_DAYS.replace('{n}', time.toString())
    : MESSAGES.LOCKED_FOR_HOURS.replace('{n}', time.toString());
};
