import { useState, useEffect } from 'react'
import { BalanceCard } from './BalanceCard'
import { DepositForm } from './DepositForm'
import { WithdrawButton } from './WithdrawButton'
import { SaveForLater } from './SaveForLater'
import { secureStorageUtils } from '../utils/secureStorage'

interface SavedState {
  id: string;
  name: string;
  amount: string;
  unlockTime: number;
  date: string;
}

// Save State Button Component to replace DOM manipulation
interface SaveStateButtonProps {
  onSave: (name: string, amount: string, unlockTime: number) => Promise<void>
}

const SaveStateButton: React.FC<SaveStateButtonProps> = ({ onSave }) => {
  const [isSaving, setIsSaving] = useState(false)
  const [amount, setAmount] = useState('')

  const handleSave = async () => {
    if (isSaving) return
    
    setIsSaving(true)
    try {
      const name = prompt('Name this saved state (e.g., "Summer Vacation Fund"):')
      if (name && name.trim()) {
        // Use the amount from state instead of DOM manipulation
        const sanitizedAmount = amount || '0'
        await onSave(name, sanitizedAmount, Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) // Default 30 days
      }
    } catch (error) {
      console.error('Failed to save state:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <input
        type="text"
        placeholder="Amount to save (optional)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="amount-input"
        aria-label="Amount for saved state"
      />
      <button 
        className="save-later-button"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? '💾 Saving...' : '💾 Save for Later'}
      </button>
    </>
  )
}

export function PiggyBankDashboard() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
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
              <DepositForm onAmountChange={setCurrentAmount} />
              <button 
                className="save-later-button"
                onClick={() => {
                  const name = prompt('Name this saved state (e.g., "Summer Vacation Fund"):')
                  if (name) {
                    handleSaveState(name, currentAmount || '0', Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) // Default 30 days
                  }
                }}
              >
                💾 Save for Later
              </button>
            </>
          ) : (
            <WithdrawButton />
          )}
        </div>
      </div>
    </div>
  )
}
