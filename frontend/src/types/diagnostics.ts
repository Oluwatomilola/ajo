/**
 * Type definitions for the diagnostics feature
 */

export interface BlockchainConnectionStatus {
  isConnected: boolean;
  chainId?: number;
  chainName?: string;
  rpcUrl?: string;
  blockNumber?: number;
  networkType: 'mainnet' | 'testnet' | 'unknown';
  lastBlockTime?: number;
  error?: string;
}

export interface ContractStatus {
  address: string;
  isValid: boolean;
  isDeployed: boolean;
  abiValid: boolean;
  networkMatch: boolean;
  error?: string;
  functions?: ContractFunction[];
  events?: ContractEvent[];
}

export interface ContractFunction {
  name: string;
  signature: string;
  inputs: string[];
  outputs: string[];
  stateMutability: 'view' | 'pure' | 'payable' | 'nonpayable';
}

export interface ContractEvent {
  name: string;
  signature: string;
  inputs: EventInput[];
}

export interface EventInput {
  indexed: boolean;
  internalType: string;
  name: string;
  type: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'error' | 'unknown';
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  timestamp: number;
  type: 'deposit' | 'withdrawal' | 'unknown';
  error?: string;
}

export interface EnvironmentFlags {
  nodeEnv: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
  appVersion?: string;
  buildTimestamp?: string;
  reownProjectId?: string;
  piggyBankAddress?: string;
  chainId?: number;
  featureFlags?: Record<string, boolean>;
}

export interface DiagnosticsData {
  blockchainConnection: BlockchainConnectionStatus;
  contract: ContractStatus;
  lastTransactions: TransactionStatus[];
  environment: EnvironmentFlags;
  timestamp: number;
  version: string;
}

export interface DiagnosticsError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: number;
}