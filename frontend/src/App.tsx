import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Header } from './components/Header'
import { PiggyBankDashboard } from './components/PiggyBankDashboard'
import { WalletConnectPage } from './components/WalletConnectPage'
import { AdminDashboard } from './components/AdminDashboard'
import { TransactionToast } from './components/TransactionToast'
import { useWalletHistory } from './hooks/useWalletHistory'
import { usePiggyBank } from './hooks/usePiggyBank'
import './App.css'
import './styles/walletConnect.css'
import './styles/saveForLater.css'

type Page = 'home' | 'wallet' | 'admin'

function App() {
  const { isConnected, address } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isAdmin, setIsAdmin] = useState(false)
  const { owner } = usePiggyBank()

  // Track wallet connection history
  useWalletHistory()

  // Check if current user is admin
  useEffect(() => {
    if (address && owner) {
      setIsAdmin(address.toLowerCase() === owner.toLowerCase())
    } else {
      setIsAdmin(false)
    }
  }, [address, owner])

  return (
    <div className="app">
      <TransactionToast />
      <Header />

      {/* Navigation */}
      <nav className="app-nav">
        <button
          className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
        >
          🏠 Home
        </button>
        <button
          className={`nav-btn ${currentPage === 'wallet' ? 'active' : ''}`}
          onClick={() => setCurrentPage('wallet')}
        >
          🔗 Wallet Connect
        </button>
        {isAdmin && (
          <button
            className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentPage('admin')}
          >
            👑 Admin
          </button>
        )}
      </nav>

      <main className="main-content">
        {currentPage === 'wallet' ? (
          <WalletConnectPage />
        ) : !isConnected ? (
          <div className="connect-prompt">
            <div className="connect-card">
              <h2>Welcome to Ajo PiggyBank</h2>
              <p>A decentralized savings application on Base blockchain</p>
              <div className="features">
                <div className="feature">
                  <span className="icon">🔒</span>
                  <h3>Time-Locked Savings</h3>
                  <p>Lock your ETH for a specific duration</p>
                </div>
                <div className="feature">
                  <span className="icon">💰</span>
                  <h3>Secure Storage</h3>
                  <p>Your funds are safe on-chain</p>
                </div>
                <div className="feature">
                  <span className="icon">⚡</span>
                  <h3>Base Network</h3>
                  <p>Fast and low-cost transactions</p>
                </div>
              </div>
              <div className="connect-action">
                <p>Connect your wallet to get started</p>
                <appkit-button />
              </div>
            </div>
          </div>
        ) : currentPage === 'admin' ? (
          <AdminDashboard />
        ) : (
          <PiggyBankDashboard />
        )}
      </main>

      <footer className="footer">
        <p>Built with REOWN AppKit & WalletConnect on Base</p>
      </footer>
    </div>
  )
}

export default App
