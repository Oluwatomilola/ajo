import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { NETWORK } from './src/constants/appConstants';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: NETWORK.DEFAULT_PORT,
    open: true, // Auto-open browser on start
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'wagmi-vendor': ['wagmi', 'viem', '@tanstack/react-query'],
          'reown-vendor': ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
        },
      },
    },
    // Increase chunk size warning limit for Web3 libraries
    chunkSizeWarningLimit: NETWORK.CHUNK_SIZE_WARNING_LIMIT,
    // Source maps for easier debugging
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
})
