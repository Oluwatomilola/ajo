import { useState } from 'react'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { formatEther } from 'viem'
// Using simple inline symbols instead of Heroicons to avoid an extra dependency in tests

// Network explorer URLs mapping
const NETWORK_EXPLORERS = {
  84532: 'https://sepolia.basescan.org', // Base Sepolia
  8453: 'https://basescan.org',          // Base Mainnet
  1: 'https://etherscan.io',            // Ethereum Mainnet
  11155111: 'https://sepolia.etherscan.io', // Ethereum Sepolia
  137: 'https://polygonscan.com',        // Polygon Mainnet
  80001: 'https://mumbai.polygonscan.com', // Polygon Mumbai
}

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({
    address: address,
  })
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Fallback copy failed: ', err)
      }
      document.body.removeChild(textArea)
    }
  }

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="wallet-info-card">
      <div className="wallet-header">
        <h3>Wallet Information</h3>
        <button
          className="disconnect-btn"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>

      <div className="wallet-details">
        <div className="detail-row">
          <span className="label">Address:</span>
          <span className="value address-value" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            className="copy-btn group relative"
            onClick={() => copyToClipboard(address || '')}
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <span className="h-5 w-5 text-green-500">✓</span>
            ) : (
              <span className="h-5 w-5 text-gray-400">📋</span>
            )}
            <span className="tooltip">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <div className="detail-row">
          <span className="label">Network:</span>
          <span className="value">{chain?.name || 'Unknown'}</span>
        </div>

        <div className="detail-row">
          <span className="label">Balance:</span>
          <span className="value">
            {balance ? formatEther(balance.value) : '0.00'} ETH
          </span>
        </div>

        <div className="detail-row">
          <span className="label">Chain ID:</span>
          <span className="value">{chain?.id || 'N/A'}</span>
        </div>
      </div>

      <div className="wallet-actions">
        <button
          className="btn-secondary"
          onClick={() => {
            const getExplorerUrl = (chainId?: number) => {
              switch (chainId) {
                case 8453: // Base mainnet
                  return `https://basescan.org/address/${address}`
                case 84532: // Base Sepolia testnet
                  return `https://sepolia.basescan.org/address/${address}`
                case 1: // Ethereum mainnet
                  return `https://etherscan.io/address/${address}`
                case 11155111: // Ethereum Sepolia testnet
                  return `https://sepolia.etherscan.io/address/${address}`
                default:
                  return `https://basescan.org/address/${address}` // fallback to Base
              }
            }
            window.open(getExplorerUrl(chain?.id), '_blank')
            const explorerUrl = chain?.id ? NETWORK_EXPLORERS[chain.id as keyof typeof NETWORK_EXPLORERS] : null
            if (explorerUrl) {
              window.open(`${explorerUrl}/address/${address}`, '_blank')
            } else {
              alert('Explorer not available for this network')
            }
          }}
        >
          View on Explorer
        </button>
      </div>
    </div>
  )
}
