// Environment Variable Validation Utility

export function validateEnvironment() {
  const errors: string[] = []
  const warnings: string[] = []

  // Check REOWN Project ID
  const projectId = import.meta.env.VITE_REOWN_PROJECT_ID
  if (!projectId) {
    errors.push('VITE_REOWN_PROJECT_ID is not set. Get one from https://cloud.reown.com/')
  } else if (projectId.length < 32) {
    warnings.push('VITE_REOWN_PROJECT_ID seems too short. Verify it is correct.')
  }

  // Check PiggyBank Address
  const contractAddress = import.meta.env.VITE_PIGGYBANK_ADDRESS
  if (!contractAddress) {
    warnings.push('VITE_PIGGYBANK_ADDRESS is not set. Smart contract features will not work until you deploy and configure the contract address.')
  } else if (!contractAddress.startsWith('0x')) {
    errors.push('VITE_PIGGYBANK_ADDRESS must start with "0x"')
  } else if (contractAddress.length !== 42) {
    errors.push('VITE_PIGGYBANK_ADDRESS must be 42 characters (including "0x")')
  }

  // Log results
  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:')
    errors.forEach(error => console.error(`  - ${error}`))
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment configuration is valid')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getEnvironmentInfo() {
  return {
    projectId: import.meta.env.VITE_REOWN_PROJECT_ID ? '✅ Set' : '❌ Missing',
    contractAddress: import.meta.env.VITE_PIGGYBANK_ADDRESS ? '✅ Set' : '⚠️  Not Set',
    mode: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  }
}
