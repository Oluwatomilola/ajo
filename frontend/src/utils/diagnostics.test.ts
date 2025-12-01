/**
 * Tests for diagnostics utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  gatherDiagnosticsData,
  getEnvironmentFlags,
  getCurrentNetwork,
  saveTransactionForDiagnostics,
  clearDiagnosticsData
} from './diagnostics'
import { base, baseSepolia } from '@reown/appkit/networks'

// Mock viem and @reown/appkit/networks
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    getBlockNumber: vi.fn(),
    getBlock: vi.fn(),
    getCode: vi.fn(),
  })),
  getAddress: vi.fn((address) => address),
  isAddress: vi.fn((address) => address.length === 42 && address.startsWith('0x')),
  getContract: vi.fn(() => ({
    read: {
      owner: vi.fn(),
    },
  })),
  parseEther: vi.fn(),
  formatEther: vi.fn(),
}))

vi.mock('@reown/appkit/networks', () => ({
  base: { id: 8453, name: 'Base', rpcUrls: { default: { http: ['https://mainnet.base.org'] } } },
  baseSepolia: { id: 84532, name: 'Base Sepolia', rpcUrls: { default: { http: ['https://sepolia.base.org'] } } },
}))

// Mock the config files
vi.mock('../config/contracts', () => ({
  PIGGYBANK_ABI: [
    {
      type: 'function',
      name: 'owner',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
  ],
  PIGGYBANK_ADDRESS: '0x1234567890123456789012345678901234567890',
  CHAIN_ID: 84532,
}))

vi.mock('../config/wagmi', () => ({
  wagmiAdapter: {
    wagmiConfig: {},
  },
}))

describe('diagnostics utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('getCurrentNetwork', () => {
    it('should return the correct network for known chain IDs', () => {
      const baseNetwork = getCurrentNetwork()
      expect(baseNetwork?.id).toBe(84532) // Base Sepolia
    })
  })

  describe('getEnvironmentFlags', () => {
    it('should return environment flags with correct structure', () => {
      const flags = getEnvironmentFlags()
      
      expect(flags).toHaveProperty('nodeEnv')
      expect(flags).toHaveProperty('isDevelopment')
      expect(flags).toHaveProperty('isProduction')
      expect(flags).toHaveProperty('chainId')
      expect(flags).toHaveProperty('featureFlags')
      
      expect(flags.featureFlags).toHaveProperty('diagnosticsEnabled')
      expect(flags.featureFlags).toHaveProperty('debugMode')
    })

    it('should enable diagnostics in development mode', () => {
      // Mock development environment
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const flags = getEnvironmentFlags()
      expect(flags.isDevelopment).toBe(true)
      expect(flags.featureFlags?.diagnosticsEnabled).toBe(true)
      
      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('saveTransactionForDiagnostics', () => {
    it('should save transaction data to localStorage', () => {
      const hash = '0xabcdef123456'
      const type = 'deposit'
      
      saveTransactionForDiagnostics(hash, type, 'pending')
      
      expect(localStorage.getItem('lastTransactionHash')).toBe(hash)
      
      const txData = JSON.parse(localStorage.getItem('lastTransactionData') || '{}')
      expect(txData.hash).toBe(hash)
      expect(txData.type).toBe(type)
      expect(txData.status).toBe('pending')
      expect(txData).toHaveProperty('timestamp')
    })

    it('should save different transaction types', () => {
      saveTransactionForDiagnostics('0xwithdrawal', 'withdrawal', 'success')
      
      const txData = JSON.parse(localStorage.getItem('lastTransactionData') || '{}')
      expect(txData.type).toBe('withdrawal')
      expect(txData.status).toBe('success')
    })
  })

  describe('clearDiagnosticsData', () => {
    it('should clear transaction data from localStorage', () => {
      // First save some data
      saveTransactionForDiagnostics('0xtest', 'deposit', 'pending')
      
      // Then clear it
      clearDiagnosticsData()
      
      expect(localStorage.getItem('lastTransactionHash')).toBeNull()
      expect(localStorage.getItem('lastTransactionData')).toBeNull()
    })
  })

  describe('gatherDiagnosticsData', () => {
    it('should return diagnostics data with all required fields', async () => {
      const data = await gatherDiagnosticsData()
      
      expect(data).toHaveProperty('blockchainConnection')
      expect(data).toHaveProperty('contract')
      expect(data).toHaveProperty('lastTransactions')
      expect(data).toHaveProperty('environment')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('version')
      
      expect(Array.isArray(data.lastTransactions)).toBe(true)
      expect(typeof data.timestamp).toBe('number')
      expect(typeof data.version).toBe('string')
    })

    it('should handle blockchain connection failures gracefully', async () => {
      const { createPublicClient } = await import('viem')
      vi.mocked(createPublicClient).mockImplementation(() => ({
        getBlockNumber: vi.fn().mockRejectedValue(new Error('RPC error')),
        getBlock: vi.fn(),
        getCode: vi.fn(),
      }) as any)
      
      const data = await gatherDiagnosticsData()
      
      expect(data.blockchainConnection.isConnected).toBe(false)
      expect(data.blockchainConnection.error).toBeDefined()
    })

    it('should handle contract validation errors gracefully', async () => {
      const { getCode, getContract } = await import('viem')
      vi.mocked(getCode).mockResolvedValue('0x')
      vi.mocked(getContract).mockImplementation(() => ({
        read: {
          owner: vi.fn().mockRejectedValue(new Error('Contract read error')),
        },
      }) as any)
      
      const data = await gatherDiagnosticsData()
      
      expect(data.contract.isDeployed).toBe(true) // Code exists
      expect(data.contract.error).toBeDefined()
    })

    it('should return empty transactions when no data is stored', async () => {
      const data = await gatherDiagnosticsData()
      expect(data.lastTransactions).toEqual([])
    })

    it('should return stored transactions when available', async () => {
      // Store transaction data
      saveTransactionForDiagnostics('0xstored123', 'deposit', 'success')
      
      const data = await gatherDiagnosticsData()
      
      expect(data.lastTransactions).toHaveLength(1)
      expect(data.lastTransactions[0].hash).toBe('0xstored123')
      expect(data.lastTransactions[0].type).toBe('deposit')
      expect(data.lastTransactions[0].status).toBe('success')
    })
  })

  describe('environment flags', () => {
    it('should detect development mode correctly', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const flags = getEnvironmentFlags()
      expect(flags.nodeEnv).toBe('development')
      expect(flags.isDevelopment).toBe(true)
      expect(flags.isProduction).toBe(false)
      
      process.env.NODE_ENV = originalNodeEnv
    })

    it('should detect production mode correctly', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const flags = getEnvironmentFlags()
      expect(flags.nodeEnv).toBe('production')
      expect(flags.isDevelopment).toBe(false)
      expect(flags.isProduction).toBe(true)
      
      process.env.NODE_ENV = originalNodeEnv
    })

    it('should handle missing environment variables gracefully', () => {
      const originalBuildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP
      delete import.meta.env.VITE_BUILD_TIMESTAMP
      
      const flags = getEnvironmentFlags()
      expect(flags.buildTimestamp).toBeDefined()
      
      import.meta.env.VITE_BUILD_TIMESTAMP = originalBuildTimestamp
    })
  })
})