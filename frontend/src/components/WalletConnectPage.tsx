import { WalletInfo } from './WalletInfo'
import { NetworkSwitcher } from './NetworkSwitcher'
import { WalletButton } from './WalletButton'
import { TransactionToast } from './TransactionToast'
import { useAccount } from 'wagmi'
import { getWalletHistory, clearWalletHistory } from '../utils/walletStorage'
import { useState, useCallback } from 'react'

export function WalletConnectPage() {
  const { isConnected } = useAccount()
  const [history, setHistory] = useState(getWalletHistory())

  // Memoized refresh function to prevent unnecessary re-renders
  const refreshHistory = useCallback(() => {
    setHistory(getWalletHistory())
  }, [])

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your wallet connection history?')) {
      clearWalletHistory()
      setHistory([])
    }
  }

  const handleRefreshHistory = () => {
    refreshHistory()
  }

  return (
    <div className="wallet-connect-page">
      <TransactionToast />

      <div className="page-header">
        <h1>Wallet Connect</h1>
        <p>Manage your wallet connections powered by REOWN & WalletConnect</p>
      </div>

      <div className="wallet-grid">
        {/* Connection Section */}
        <div className="wallet-section">
          <h2>Connection</h2>
          <div className="connection-area">
            {!isConnected ? (
              <div className="not-connected">
                <div className="icon-large">🔗</div>
                <h3>Connect Your Wallet</h3>
                <p>Connect with REOWN AppKit to access all features</p>
                <WalletButton />
                <div className="supported-wallets">
                  <p className="text-sm">Supported Wallets:</p>
                  <div className="wallet-icons">
                    <span title="MetaMask">🦊</span>
                    <span title="WalletConnect">🔗</span>
                    <span title="Coinbase Wallet">💙</span>
                    <span title="Rainbow">🌈</span>
                    <span title="Trust Wallet">💎</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="connected-area">
                <NetworkSwitcher />
                <WalletInfo />
              </div>
            )}
          </div>
        </div>

        {/* Connection History */}
        <div className="wallet-section">
          <div className="section-header">
            <h2>Connection History</h2>
            <div className="history-actions">
              <button
                className="btn-refresh"
                onClick={handleRefreshHistory}
                title="Refresh history"
              >
                🔄
              </button>
              {history.length > 0 && (
                <button
                  className="btn-clear"
                  onClick={handleClearHistory}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <p>No connection history</p>
              <span className="icon-muted">📜</span>
            </div>
          ) : (
            <div className="history-list">
              {history.map((connection, index) => (
                <div key={index} className="history-item">
                  <div className="history-icon">🔗</div>
                  <div className="history-details">
                    <div className="history-address">
                      {(() => {
                        // Sanitize address to prevent XSS
                        const sanitizedAddress = connection.address.replace(/[<>'"&]/g, '');
                        return `${sanitizedAddress.slice(0, 6)}...${sanitizedAddress.slice(-4)}`;
                      })()}
                    </div>
                    <div className="history-meta">
                      Chain ID: {connection.chainId} • {new Date(connection.connectedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="wallet-section features-section">
          <h2>WalletConnect Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🔐</span>
              <h3>Secure</h3>
              <p>End-to-end encrypted connections</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📱</span>
              <h3>Mobile</h3>
              <p>Connect from any mobile wallet</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🌐</span>
              <h3>Multi-Chain</h3>
              <p>Support for multiple networks</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>Fast</h3>
              <p>Instant transaction signing</p>
            </div>
          </div>
        </div>

        {/* REOWN Info */}
        <div className="wallet-section reown-info">
          <h2>Powered by REOWN</h2>
          <p>
            This dApp uses <strong>REOWN AppKit</strong> (formerly WalletConnect)
            for secure wallet connections. REOWN is the leading protocol for
            connecting wallets to dApps with over 20 million users worldwide.
          </p>
          <a
            href="https://reown.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
          >
            Learn More About REOWN →
          </a>
        </div>
      </div>
    </div>
  )
}
