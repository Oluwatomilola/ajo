import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Header } from './components/Header'
import { PiggyBankDashboard } from './components/PiggyBankDashboard'
import { WalletConnectPage } from './components/WalletConnectPage'
import { AdminDashboard } from './components/AdminDashboard'
import { TransactionToast } from './components/TransactionToast'
import { MobileNavigation } from './components/MobileNavigation'
import { NotificationProvider, NotificationContainer } from './components/SecureNotification'
import { useWalletHistory } from './hooks/useWalletHistory'
import { usePiggyBank } from './hooks/usePiggyBank'
import { useMobile, useTouchDevice } from './hooks/useMobile'
import { DebugPage } from './components/DebugPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'
import './styles/walletConnect.css'
import './styles/saveForLater.css'
import './styles/mobile.css'

type Page = 'home' | 'wallet' | 'admin' | 'debug'

function App() {
  const { isConnected, address } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isAdmin, setIsAdmin] = useState(false)
  const { owner } = usePiggyBank()
  
  // Mobile hooks
  const isMobile = useMobile()
  const isTouchDevice = useTouchDevice()

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
    <NotificationProvider>
      <div className="app">
        <NotificationContainer />
        <TransactionToast />
        
        <div className="header-wrapper">
          <Header />
          {/* Mobile Navigation */}
          {isMobile && (
            <MobileNavigation
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page as Page)}
              isAdmin={isAdmin}
            />
          )}
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
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
            {process.env.NODE_ENV === 'development' && (
              <button
                className={`nav-btn ${currentPage === 'debug' ? 'active' : ''}`}
                onClick={() => setCurrentPage('debug')}
              >
                🔧 Debug
              </button>
            )}
          </nav>
        )}

      <main className="main-content">
        <ErrorBoundary>
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
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          ) : currentPage === 'debug' ? (
            <ErrorBoundary>
              <DebugPage />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <PiggyBankDashboard />
            </ErrorBoundary>
          )}
        </ErrorBoundary>
      </main>

      <footer className="footer">
        <p>Built with REOWN AppKit & WalletConnect on Base</p>
      </footer>
    </div>
    </NotificationProvider>
  )
}

export default App
