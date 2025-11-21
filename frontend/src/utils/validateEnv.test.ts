import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateEnvironment, getEnvironmentInfo } from './validateEnv'

// Mock import.meta.env
const mockImportMeta = {
  env: {
    VITE_REOWN_PROJECT_ID: '',
    VITE_PIGGYBANK_ADDRESS: '',
    PROD: false,
    DEV: true,
    MODE: 'development'
  }
}

// Mock process.env
const originalProcessEnv = process.env

// Setup mocks before each test
beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks()
  
  // Mock console methods to avoid spam in test output
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  
  // Mock import.meta.env
  Object.defineProperty(globalThis, 'import.meta', {
    value: mockImportMeta,
    writable: true,
    configurable: true
  })
  
  // Mock process.env for CI environment variables
  Object.keys(originalProcessEnv).forEach(key => {
    if (key.startsWith('CI') || key.includes('GITHUB') || key.includes('GITLAB') || 
        key.includes('CIRCLE') || key.includes('TRAVIS') || key.includes('JENKINS')) {
      delete originalProcessEnv[key]
    }
  })
})

afterEach(() => {
  // Restore console methods
  vi.restoreAllMocks()
  
  // Restore process.env
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('CI') || key.includes('GITHUB') || key.includes('GITLAB') || 
        key.includes('CIRCLE') || key.includes('TRAVIS') || key.includes('JENKINS')) {
      delete process.env[key]
    }
  })
  
  // Reset import.meta.env
  mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
  mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
  mockImportMeta.env.PROD = false
  mockImportMeta.env.DEV = true
  mockImportMeta.env.MODE = 'development'
})

describe('validateEnvironment', () => {
  describe('Project ID Validation', () => {
    it('should return error when project ID is missing', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VITE_REOWN_PROJECT_ID is not set. Get one from https://cloud.reown.com/ This is required for wallet connection functionality.')
      expect(result.warnings).toHaveLength(0)
    })

    it('should return warning when project ID is too short', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = 'short'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true) // Still valid, just a warning
      expect(result.warnings).toContain('VITE_REOWN_PROJECT_ID seems too short. Verify it is correct.')
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation with valid project ID', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012' // 32 chars
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should pass validation with long valid project ID', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012345678901234567890' // 44 chars
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('Contract Address Validation', () => {
    it('should return error when contract address is missing in development', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true) // In development, missing contract address is a warning
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('VITE_PIGGYBANK_ADDRESS is not set')
      expect(result.warnings[0]).toContain('This will be an error in CI/production builds')
    })

    it('should return error when contract address doesn't start with 0x', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS must start with "0x"')
      expect(result.warnings).toHaveLength(0)
    })

    it('should return error when contract address has wrong length', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x12345678901234567890123456789012' // 34 chars instead of 42
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS must be 42 characters (including "0x")')
      expect(result.warnings).toHaveLength(0)
    })

    it('should pass validation with valid contract address', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should accept exactly 42 character contract address', () => {
      const validAddress = '0x' + 'a'.repeat(40)
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = validAddress
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Strict Validation Logic', () => {
    it('should enable strict validation in CI environment', () => {
      // Set various CI environment variables
      process.env.CI = 'true'
      process.env.GITHUB_ACTIONS = 'true'
      
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      mockImportMeta.env.PROD = false
      mockImportMeta.env.DEV = false
      mockImportMeta.env.MODE = 'test'
      
      const result = validateEnvironment()
      
      expect(result.isStrict).toBe(true)
      expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS is not set')
      expect(result.warnings).toHaveLength(0)
    })

    it('should enable strict validation in production mode', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      mockImportMeta.env.PROD = true
      mockImportMeta.env.DEV = false
      mockImportMeta.env.MODE = 'production'
      
      const result = validateEnvironment()
      
      expect(result.isStrict).toBe(true)
      expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS is not set')
      expect(result.warnings).toHaveLength(0)
    })

    it('should disable strict validation in development mode', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      mockImportMeta.env.PROD = false
      mockImportMeta.env.DEV = true
      mockImportMeta.env.MODE = 'development'
      
      const result = validateEnvironment()
      
      expect(result.isStrict).toBe(false)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('This will be an error in CI/production builds')
    })

    it('should handle different CI environment variables', () => {
      const ciVars = [
        { key: 'GITLAB_CI', value: 'true' },
        { key: 'CIRCLECI', value: 'true' },
        { key: 'TRAVIS', value: 'true' },
        { key: 'JENKINS_URL', value: 'http://jenkins.example.com' }
      ]

      ciVars.forEach(({ key, value }) => {
        process.env[key] = value
        
        mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
        mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
        mockImportMeta.env.PROD = false
        mockImportMeta.env.DEV = false
        mockImportMeta.env.MODE = 'test'
        
        const result = validateEnvironment()
        
        expect(result.isStrict).toBe(true)
        expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS is not set')
        
        delete process.env[key]
      })
    })
  })

  describe('Error and Warning Paths', () => {
    it('should handle multiple errors and warnings together', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = 'short' // Too short
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '' // Missing
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(0) // No errors in development
      expect(result.warnings).toHaveLength(2) // Project ID warning + Contract address warning
    })

    it('should handle multiple errors in strict mode', () => {
      process.env.CI = 'true'
      
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = 'short'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '' // Missing
      mockImportMeta.env.PROD = false
      mockImportMeta.env.DEV = false
      mockImportMeta.env.MODE = 'test'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
    })

    it('should return valid result when no issues found', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should call console methods when errors exist', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const consoleWarnSpy = vi.spyOn(console, 'warn')
      const consoleLogSpy = vi.spyOn(console, 'log')
      
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      
      const result = validateEnvironment()
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should call console methods when warnings exist', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const consoleWarnSpy = vi.spyOn(console, 'warn')
      const consoleLogSpy = vi.spyOn(console, 'log')
      
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      
      const result = validateEnvironment()
      
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should call console.log when everything is valid', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const consoleWarnSpy = vi.spyOn(console, 'warn')
      const consoleLogSpy = vi.spyOn(console, 'log')
      
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('getEnvironmentInfo', () => {
    it('should return environment info with valid values', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      mockImportMeta.env.PROD = false
      mockImportMeta.env.DEV = true
      mockImportMeta.env.MODE = 'development'
      
      const info = getEnvironmentInfo()
      
      expect(info.projectId).toBe('✅ Set')
      expect(info.contractAddress).toBe('✅ Set')
      expect(info.mode).toBe('development')
      expect(info.isDevelopment).toBe(true)
      expect(info.isProduction).toBe(false)
    })

    it('should return environment info with missing values', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      mockImportMeta.env.PROD = true
      mockImportMeta.env.DEV = false
      mockImportMeta.env.MODE = 'production'
      
      const info = getEnvironmentInfo()
      
      expect(info.projectId).toBe('❌ Missing')
      expect(info.contractAddress).toBe('⚠️  Not Set')
      expect(info.mode).toBe('production')
      expect(info.isDevelopment).toBe(false)
      expect(info.isProduction).toBe(true)
    })

    it('should return correct info for contract address missing but project ID present', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      mockImportMeta.env.PROD = false
      mockImportMeta.env.DEV = true
      mockImportMeta.env.MODE = 'development'
      
      const info = getEnvironmentInfo()
      
      expect(info.projectId).toBe('✅ Set')
      expect(info.contractAddress).toBe('⚠️  Not Set')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined project ID', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = null as any
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      expect(() => validateEnvironment()).not.toThrow()
      const result = validateEnvironment()
      expect(result.errors.some(error => error.includes('VITE_REOWN_PROJECT_ID'))).toBe(true)
    })

    it('should handle null/undefined contract address', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = null as any
      
      expect(() => validateEnvironment()).not.toThrow()
      const result = validateEnvironment()
      expect(result.errors.some(error => error.includes('VITE_PIGGYBANK_ADDRESS'))).toBe(true)
    })

    it('should handle project ID with exactly 32 characters', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = 'a'.repeat(32)
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle project ID with exactly 31 characters (should warn)', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = 'a'.repeat(31)
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('VITE_REOWN_PROJECT_ID seems too short. Verify it is correct.')
    })

    it('should handle empty string project ID (should error)', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VITE_REOWN_PROJECT_ID is not set')
    })

    it('should handle whitespace-only project ID', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '   '
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      // Whitespace-only should be treated as invalid/too short
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('VITE_REOWN_PROJECT_ID'))).toBe(true)
    })

    it('should handle contract address with leading/trailing whitespace', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '  0x1234567890123456789012345678901234567890  '
      
      const result = validateEnvironment()
      
      // Should fail validation due to whitespace
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('VITE_PIGGYBANK_ADDRESS must start with "0x"'))).toBe(true)
    })

    it('should handle very long contract address', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890abcdefghijklmnop'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS must be 42 characters (including "0x")')
    })
  })

  describe('Environment Variable Combinations', () => {
    it('should handle all variables missing in development', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false) // Missing project ID
      expect(result.errors).toContain('VITE_REOWN_PROJECT_ID is not set')
      expect(result.warnings).toHaveLength(1)
    })

    it('should handle all variables missing in CI', () => {
      process.env.CI = 'true'
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = ''
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = ''
      mockImportMeta.env.PROD = false
      mockImportMeta.env.DEV = false
      mockImportMeta.env.MODE = 'test'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2) // Both should be errors in CI
      expect(result.warnings).toHaveLength(0)
    })

    it('should handle valid project ID with invalid contract address', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = '12345678901234567890123456789012'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = 'invalid-address'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('VITE_PIGGYBANK_ADDRESS must start with "0x"')
    })

    it('should handle invalid project ID with valid contract address', () => {
      mockImportMeta.env.VITE_REOWN_PROJECT_ID = 'short'
      mockImportMeta.env.VITE_PIGGYBANK_ADDRESS = '0x1234567890123456789012345678901234567890'
      
      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true) // Just a warning
      expect(result.warnings).toContain('VITE_REOWN_PROJECT_ID seems too short. Verify it is correct.')
      expect(result.errors).toHaveLength(0)
    })
  })
})