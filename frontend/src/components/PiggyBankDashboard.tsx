import { useState, useEffect } from 'react'
import { BalanceCard } from './BalanceCard'
import { DepositForm } from './DepositForm'
import { WithdrawButton } from './WithdrawButton'
import { SaveForLater } from './SaveForLater'

interface SavedState {
  id: string;
  name: string;
  amount: string;
  unlockTime: number;
  date: string;
}

export function PiggyBankDashboard() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [savedStates, setSavedStates] = useState<SavedState[]>(() => {
    const saved = localStorage.getItem('savedPiggyStates')
    return saved ? JSON.parse(saved) : []
  })
  const [showSavedStates, setShowSavedStates] = useState(false)

  const handleSaveState = (name: string, amount: string, unlockTime: number) => {
    const newState: SavedState = {
      id: Date.now().toString(),
      name,
      amount,
      unlockTime,
      date: new Date().toISOString()
    }
    const updatedStates = [...savedStates, newState]
    setSavedStates(updatedStates)
    localStorage.setItem('savedPiggyStates', JSON.stringify(updatedStates))
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
            console.log('Loading state:', state)
            setShowSavedStates(false)
          }}
          onDeleteState={(id) => {
            const updated = savedStates.filter(state => state.id !== id)
            setSavedStates(updated)
            localStorage.setItem('savedPiggyStates', JSON.stringify(updated))
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
              <DepositForm />
              <button 
                className="save-later-button"
                onClick={() => {
                  const name = prompt('Name this saved state (e.g., "Summer Vacation Fund"):')
                  if (name) {
                    const amount = (document.querySelector('#amount') as HTMLInputElement)?.value || '0'
                    handleSaveState(name, amount, Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) // Default 30 days
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
