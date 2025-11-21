import { useState, useEffect } from 'react'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { formatEther } from 'viem'
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

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
              <CheckIcon className="h-5 w-5 text-green-500" />
            ) : (
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
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
          onClick={() => window.open(`https://sepolia.basescan.org/address/${address}`, '_blank')}
        >
          View on Explorer
        </button>
      </div>
    </div>
  )
}
