import { useState, useEffect } from 'react'
import { usePiggyBank } from '../hooks/usePiggyBank'
import { useTimelock } from '../hooks/useTimelock'

export function DepositForm() {
  const [amount, setAmount] = useState('')
  const { deposit, isPending, isConfirming, isSuccess, refetchBalance, unlockTime } = usePiggyBank()
  const { timeRemaining } = useTimelock(unlockTime)

  useEffect(() => {
    if (isSuccess) {
      setAmount('')
      refetchBalance()
    }
  }, [isSuccess, refetchBalance])

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    deposit(amount)
  }

  const formatLockInfo = () => {
    if (!unlockTime) return 'Lock period will be determined by contract settings'
    if (!timeRemaining) return 'Loading lock information...'

    const days = timeRemaining.days
    const hours = timeRemaining.hours

    if (days > 0) {
      return `Locked for approximately ${days} day${days !== 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `Locked for approximately ${hours} hour${hours !== 1 ? 's' : ''}`
    }
    return 'This piggy bank is unlocked'
  }

  return (
    <form className="deposit-form" onSubmit={handleDeposit}>
      <div className="form-group">
        <label htmlFor="amount">Amount (ETH)</label>
        <input
          id="amount"
          type="number"
          step="0.001"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending || isConfirming}
        />
      </div>

      <div className="info-box">
        <span className="text-lg">ℹ️</span>
        <div>
          <p className="font-medium mb-1">About This Piggy Bank</p>
          <p className="text-sm">
            {formatLockInfo()}. You won't be able to withdraw until the lock period ends.
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!amount || isPending || isConfirming}
      >
        {isPending
          ? 'Waiting for approval...'
          : isConfirming
          ? 'Depositing...'
          : isSuccess
          ? 'Deposited!'
          : 'Deposit ETH'}
      </button>

      {isSuccess && (
        <div className="success-message">
          ✅ Deposit successful! Your ETH is now locked.
        </div>
      )}
    </form>
  )
}
