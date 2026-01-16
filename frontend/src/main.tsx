import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from '@reown/appkit-adapter-wagmi'
import { App } from './App'
import { wagmiClient } from './wagmiClient'

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
  <StrictMode>
    <WagmiProvider client={wagmiClient}>
      <App /> 
    </WagmiProvider>
  </StrictMode>,
)
