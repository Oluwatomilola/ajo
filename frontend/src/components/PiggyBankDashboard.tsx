import { useState } from 'react'
import { BalanceCard } from './BalanceCard'
import { DepositForm } from './DepositForm'
import { WithdrawButton } from './WithdrawButton'
import { SaveForLater } from './SaveForLater'
import { SecurePrompt, useSecurePrompt } from './SecurePrompt'
import { useMobile } from '../hooks/useMobile'

interface SavedState {
  id: string;
  name: string;
  amount: string;
  unlockTime: number;
  date: string;
}

// Secure Save for Later button component
function SaveForLaterButton({ 
  onSave, 
  amount 
}: { 
  onSave: (name: string, amount: string, unlockTime: number) => void,
  amount: string 
}) {
  const { showPrompt, PromptComponent } = useSecurePrompt()
  const isMobile = useMobile()

  const handleSaveClick = async () => {
    try {
      const name = await showPrompt({
        title: 'Save Piggy Bank State',
        message: 'Enter a name for this saved state (e.g., "Summer Vacation Fund"):',
        placeholder: 'State name...',
        maxLength: 50
      })
      
      onSave(name, amount || '0', Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) // Default 30 days
    } catch (error) {
      // User cancelled
    }
  }

  return (
    <>
      <button 
        className={`save-later-button ${isMobile ? 'mobile-btn mobile-btn-primary' : ''}`}
        onClick={handleSaveClick}
      >
        💾 Save for Later
      </button>
      {PromptComponent}
    </>
  )
}

export function PiggyBankDashboard() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [savedStates, setSavedStates] = useState<SavedState[]>(() => {
    const saved = localStorage.getItem('savedPiggyStates')
    return saved ? JSON.parse(saved) : []
  })
  const [savedStates, setSavedStates] = useState<SavedState[]>([])
  const [showSavedStates, setShowSavedStates] = useState(false)
  const [currentAmount, setCurrentAmount] = useState('')

  // Load saved states on component mount
  useEffect(() => {
    const loadSavedStates = async () => {
      try {
        // Migrate any legacy unencrypted data first
        await secureStorageUtils.migratePiggyStates()
        
        // Load encrypted data
        const loaded = await secureStorageUtils.getSavedStates()
        if (Array.isArray(loaded)) {
          setSavedStates(loaded)
        }
      } catch (error) {
        console.warn('Failed to load saved states:', error)
        setSavedStates([])
      }
    }
    
    loadSavedStates()
  }, [])

  const handleSaveState = async (name: string, amount: string, unlockTime: number) => {
    try {
      // Sanitize inputs
      const sanitizedName = name.trim().slice(0, 100) // Limit length and trim
      const sanitizedAmount = amount.trim().slice(0, 20) // Limit amount string length
      
      const newState: SavedState = {
        id: Date.now().toString(),
        name: sanitizedName,
        amount: sanitizedAmount,
        unlockTime,
        date: new Date().toISOString()
      }
      const updatedStates = [...savedStates, newState]
      setSavedStates(updatedStates)
      
      // Store encrypted using secure storage
      await secureStorageUtils.setSavedStates(updatedStates)
    } catch (error) {
      console.error('Failed to save state securely:', error)
      alert('Failed to save state. Please try again.')
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Your PiggyBank</h2>
          <p>Manage your savings with discipline</p>
        </div>
        <button 
          className="save-button"
          onClick={() => setShowSavedStates(!showSavedStates)}
        >
          {showSavedStates ? 'Hide Saved' : 'View Saved'}
        </button>
      </div>

      {showSavedStates && (
        <SaveForLater 
          savedStates={savedStates}
          onLoadState={(state) => {
            // Handle loading a saved state
            setShowSavedStates(false)
          }}
          onDeleteState={async (id) => {
            try {
              const updated = savedStates.filter(state => state.id !== id)
              setSavedStates(updated)
              await secureStorageUtils.setSavedStates(updated)
            } catch (error) {
              console.error('Failed to delete state:', error)
              alert('Failed to delete state. Please try again.')
            }
          }}
        />
      )}

      <BalanceCard />

      <div className="action-panel">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </button>
          <button
            className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'deposit' ? (
            <>
              <DepositForm amount={amount} setAmount={setAmount} />
              <SaveForLaterButton onSave={handleSaveState} amount={amount} />
            </>
          ) : (
            <WithdrawButton />
          )}
        </div>
      </div>
    </div>
  )
}
