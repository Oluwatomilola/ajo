import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi' // cspell:ignore wagmi
import { QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { wagmiConfig, queryClient } from './config/wagmi'

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
)
