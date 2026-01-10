import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiConfig } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { wagmiAdapter, queryClient } from './config/wagmi'
import { validateEnvironment } from './utils/validateEnv'

// Validate environment variables on startup
const validation = validateEnvironment()

// Throw error in strict mode (CI/production) if validation fails
if (!validation.isValid && validation.isStrict) {
  throw new Error(
    'Environment validation failed. Required environment variables are missing. ' +
    'Check console for details.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiConfig config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiConfig>
  </StrictMode>,
)
