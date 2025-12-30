// Environment Variable Validation Utility

/**
 * Determines if the current environment requires strict validation
 * Strict validation is enabled for CI, production builds, and non-dev environments
 */
function isStrictValidationEnabled(): boolean {
  // Check if running in CI environment
  const isCI = Boolean(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.JENKINS_URL
  )

  // Strict validation in production build or CI
  const isProduction = import.meta.env.PROD
  const isDevelopment = import.meta.env.DEV

  return isCI || isProduction || !isDevelopment
}

export function validateEnvironment() {
  const errors: string[] = []
  const warnings: string[] = []
  const isStrict = isStrictValidationEnabled()

  // Check REOWN Project ID
  const projectId = import.meta.env.VITE_REOWN_PROJECT_ID
  if (!projectId) {
    errors.push(
      'VITE_REOWN_PROJECT_ID is not set. ' +
      'Get one from https://cloud.reown.com/ ' +
      'This is required for wallet connection functionality.'
    )
  } else if (projectId.length < 32) {
    warnings.push('VITE_REOWN_PROJECT_ID seems too short. Verify it is correct.')
  }

  // Check PiggyBank Address - strict validation in CI/production
  const contractAddress = import.meta.env.VITE_PIGGYBANK_ADDRESS
  if (!contractAddress) {
    const message =
      'VITE_PIGGYBANK_ADDRESS is not set. ' +
      'The application cannot interact with the smart contract without this address. ' +
      'Deploy your contract and set this variable in your .env file.'

    if (isStrict) {
      // Error in CI/production - this should block builds
      errors.push(message)
    } else {
      // Warning in local dev - allows developers to work on UI without contract
      warnings.push(message + ' (This will be an error in CI/production builds)')
    }
  } else if (!contractAddress.startsWith('0x')) {
    errors.push('VITE_PIGGYBANK_ADDRESS must start with "0x"')
  } else if (contractAddress.length !== 42) {
    errors.push('VITE_PIGGYBANK_ADDRESS must be 42 characters (including "0x")')
  }

  // Log results
  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:')
    errors.forEach(error => console.error(`  - ${error}`))

    if (isStrict) {
      console.error('\n🚫 Build cannot proceed with missing required environment variables.')
      console.error('Please check your .env file or CI/CD environment variable configuration.')
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (errors.length === 0 && warnings.length === 0) {
    // Only log success in development mode
    if (import.meta.env.DEV) {
      console.log('✅ Environment configuration is valid')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isStrict
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
