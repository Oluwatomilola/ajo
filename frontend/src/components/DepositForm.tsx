import { useState, useEffect } from 'react'
import { usePiggyBank } from '../hooks/usePiggyBank'

export function DepositForm() {
  const [amount, setAmount] = useState('')
  const [lockDuration, setLockDuration] = useState('1') // in days
  const { deposit, isPending, isConfirming, isSuccess, refetchBalance, refetchUnlockTime } = usePiggyBank()

  useEffect(() => {
    if (isSuccess) {
      setAmount('')
      refetchBalance()
      refetchUnlockTime()
    }
  }, [isSuccess, refetchBalance, refetchUnlockTime])

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    deposit(amount)
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

      <div className="form-group">
        <label htmlFor="duration">Lock Duration (Days)</label>
        <select
          id="duration"
          value={lockDuration}
          onChange={(e) => setLockDuration(e.target.value)}
          disabled={isPending || isConfirming}
        >
          <option value="1">1 Day</option>
          <option value="7">7 Days</option>
          <option value="14">14 Days</option>
          <option value="30">30 Days</option>
          <option value="90">90 Days</option>
          <option value="180">180 Days</option>
          <option value="365">1 Year</option>
        </select>
      </div>

      <div className="info-box">
        <p>
          Your ETH will be locked for {lockDuration} day{lockDuration !== '1' ? 's' : ''}.
          You won't be able to withdraw until the lock period ends.
        </p>
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
