/**
 * Utility functions for gathering diagnostics data
 */

import { createPublicClient, http, getAddress, isAddress, getContract } from 'viem'
import { base, baseSepolia } from '@reown/appkit/networks'
import { 
  BlockchainConnectionStatus, 
  ContractStatus, 
  EnvironmentFlags, 
  TransactionStatus,
  DiagnosticsData,
  DiagnosticsError,
  ContractFunction,
  ContractEvent
} from '../types/diagnostics'
import { PIGGYBANK_ABI, PIGGYBANK_ADDRESS, CHAIN_ID } from '../config/contracts'
import { wagmiAdapter } from '../config/wagmi'

/**
 * Get current network information
 */
export function getCurrentNetwork() {
  const chains = [base, baseSepolia]
  return chains.find(chain => chain.id === CHAIN_ID) || null
}

/**
 * Create public client for RPC calls
 */
export function createDiagnosticsClient(chainId: number = CHAIN_ID) {
  const network = [base, baseSepolia].find(chain => chain.id === chainId)
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  
  return createPublicClient({
    chain: network,
    transport: http()
  })
}

/**
 * Check blockchain connection status
 */
export async function checkBlockchainConnection(): Promise<BlockchainConnectionStatus> {
  try {
    const client = createDiagnosticsClient()
    const network = getCurrentNetwork()
    
    // Test RPC connectivity
    const blockNumber = await client.getBlockNumber()
    const block = await client.getBlock({ blockNumber })
    
    return {
      isConnected: true,
      chainId: CHAIN_ID,
      chainName: network?.name || 'Unknown',
      rpcUrl: network?.rpcUrls.default.http[0] || 'Unknown',
      blockNumber: Number(blockNumber),
      networkType: CHAIN_ID === base.id ? 'mainnet' : CHAIN_ID === baseSepolia.id ? 'testnet' : 'unknown',
      lastBlockTime: Number(block.timestamp) * 1000, // Convert to milliseconds
    }
  } catch (error) {
    return {
      isConnected: false,
      networkType: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown connection error',
    }
  }
}

/**
 * Check contract status
 */
export async function checkContractStatus(): Promise<ContractStatus> {
  try {
    const client = createDiagnosticsClient()
    
    // Basic contract address validation
    if (!PIGGYBANK_ADDRESS) {
      return {
        address: '',
        isValid: false,
        isDeployed: false,
        abiValid: false,
        networkMatch: false,
        error: 'Contract address not configured'
      }
    }
    
    if (!isAddress(PIGGYBANK_ADDRESS)) {
      return {
        address: PIGGYBANK_ADDRESS,
        isValid: false,
        isDeployed: false,
        abiValid: true, // ABI is valid, just address is invalid
        networkMatch: true,
        error: 'Invalid contract address format'
      }
    }
    
    // Check if contract is deployed and get code
    const code = await client.getCode(getAddress(PIGGYBANK_ADDRESS))
    const isDeployed = !!code && code !== '0x'
    
    // Create contract instance to test ABI
    const contract = getContract({
      address: getAddress(PIGGYBANK_ADDRESS),
      abi: PIGGYBANK_ABI,
      client,
    })
    
    // Test basic read function
    let canRead = false
    let owner: string | undefined
    
    try {
      owner = await contract.read.owner()
      canRead = true
    } catch (error) {
      // Contract might not have owner function or other issues
    }
    
    // Analyze ABI functions and events
    const functions: ContractFunction[] = PIGGYBANK_ABI
      .filter((item): item is any => item.type === 'function')
      .map(fn => ({
        name: (fn as any).name || 'unknown',
        signature: `${(fn as any).name}(${(fn as any).inputs?.map((i: any) => i.type).join(',') || ''})`,
        inputs: (fn as any).inputs?.map((i: any) => i.type) || [],
        outputs: (fn as any).outputs?.map((o: any) => o.type) || [],
        stateMutability: (fn as any).stateMutability || 'view'
      }))
    
    const events: ContractEvent[] = PIGGYBANK_ABI
      .filter((item): item is any => item.type === 'event')
      .map(event => ({
        name: (event as any).name || 'unknown',
        signature: `${(event as any).name}(${(event as any).inputs?.map((i: any) => i.type).join(',') || ''})`,
        inputs: (event as any).inputs?.map((input: any) => ({
          indexed: input.indexed || false,
          internalType: input.internalType,
          name: input.name,
          type: input.type
        })) || []
      }))
    
    return {
      address: PIGGYBANK_ADDRESS,
      isValid: isAddress(PIGGYBANK_ADDRESS),
      isDeployed,
      abiValid: PIGGYBANK_ABI.length > 0,
      networkMatch: true, // Assumes ABI is for current network
      functions,
      events,
      error: !isDeployed ? 'Contract not deployed at specified address' : undefined,
    }
  } catch (error) {
    return {
      address: PIGGYBANK_ADDRESS,
      isValid: false,
      isDeployed: false,
      abiValid: true,
      networkMatch: true,
      error: error instanceof Error ? error.message : 'Unknown contract error',
    }
  }
}

/**
 * Get environment flags
 */
export function getEnvironmentFlags(): EnvironmentFlags {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    isDevelopment,
    isProduction,
    appVersion: import.meta.env.VITE_APP_VERSION || '0.0.0',
    buildTimestamp: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
    reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID ? 'configured' : 'missing',
    piggyBankAddress: PIGGYBANK_ADDRESS || 'not configured',
    chainId: CHAIN_ID,
    featureFlags: {
      diagnosticsEnabled: isDevelopment,
      debugMode: import.meta.env.DEV,
      walletConnectEnabled: !!import.meta.env.VITE_REOWN_PROJECT_ID,
    }
  }
}

/**
 * Get recent transaction statuses
 * Note: This is a simplified implementation - in a real app you'd fetch from an indexer
 */
export function getRecentTransactions(): TransactionStatus[] {
  try {
    // Get transaction history from local storage or wallet
    const txHash = localStorage.getItem('lastTransactionHash')
    const txData = localStorage.getItem('lastTransactionData')
    
    if (!txHash) return []
    
    const transaction: TransactionStatus = {
      hash: txHash,
      status: txData ? (JSON.parse(txData).status || 'pending') : 'pending',
      timestamp: JSON.parse(txData || '{}').timestamp || Date.now(),
      type: JSON.parse(txData || '{}').type || 'unknown',
    }
    
    return [transaction]
  } catch (error) {
    console.warn('Failed to get recent transactions:', error)
    return []
  }
}

/**
 * Main function to gather all diagnostics data
 */
export async function gatherDiagnosticsData(): Promise<DiagnosticsData> {
  const [blockchainConnection, contract, recentTransactions, environment] = await Promise.allSettled([
    checkBlockchainConnection(),
    checkContractStatus(),
    Promise.resolve(getRecentTransactions()),
    Promise.resolve(getEnvironmentFlags())
  ])
  
  // Handle any rejected promises
  const connection = blockchainConnection.status === 'fulfilled' ? blockchainConnection.value : {
    isConnected: false,
    networkType: 'unknown' as const,
    error: blockchainConnection.reason?.message || 'Failed to check connection'
  }
  
  const contractStatus = contract.status === 'fulfilled' ? contract.value : {
    address: PIGGYBANK_ADDRESS,
    isValid: false,
    isDeployed: false,
    abiValid: false,
    networkMatch: false,
    error: contract.reason?.message || 'Failed to check contract'
  }
  
  const transactions = recentTransactions.status === 'fulfilled' ? recentTransactions.value : []
  
  const envFlags = environment.status === 'fulfilled' ? environment.value : getEnvironmentFlags()
  
  return {
    blockchainConnection: connection,
    contract: contractStatus,
    lastTransactions: transactions,
    environment: envFlags,
    timestamp: Date.now(),
    version: '1.0.0',
  }
}

/**
 * Save transaction data for diagnostics
 */
export function saveTransactionForDiagnostics(hash: string, type: 'deposit' | 'withdrawal', status: 'pending' | 'success' | 'error' = 'pending') {
  const txData = {
    hash,
    type,
    status,
    timestamp: Date.now()
  }
  
  localStorage.setItem('lastTransactionHash', hash)
  localStorage.setItem('lastTransactionData', JSON.stringify(txData))
}

/**
 * Clear diagnostics data
 */
export function clearDiagnosticsData() {
  localStorage.removeItem('lastTransactionHash')
  localStorage.removeItem('lastTransactionData')
}