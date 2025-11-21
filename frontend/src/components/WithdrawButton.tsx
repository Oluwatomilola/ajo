import { useEffect } from 'react'
import { usePiggyBank } from '../hooks/usePiggyBank'
import { useTimelock } from '../hooks/useTimelock'
import { formatEther } from 'viem'

export function WithdrawButton() {
  const { balance, unlockTime, withdraw, isPending, isConfirming, isSuccess, refetchBalance } = usePiggyBank()
  const { isUnlocked } = useTimelock(unlockTime)

  useEffect(() => {
    if (isSuccess) {
      refetchBalance()
    }
  }, [isSuccess, refetchBalance])

  const handleWithdraw = () => {
    if (!isUnlocked) {
      alert('Your funds are still locked. Please wait until the unlock time.')
      return
    }
    if (!balance || balance === BigInt(0)) {
      alert('No funds available to withdraw')
      return
    }
    withdraw()
  }

  return (
    <div className="withdraw-section">
      <div className="withdraw-info">
        {!isUnlocked ? (
          <div className="warning-box">
            <span className="icon">⏰</span>
            <p>
              Your funds are currently locked. You can withdraw once the lock
              period expires.
            </p>
          </div>
        ) : (
          <div className="success-box">
            <span className="icon">✅</span>
            <p>
              Your funds are unlocked! You can now withdraw your ETH.
            </p>
          </div>
        )}
      </div>

      <div className="withdraw-actions">
        <button
          className="btn btn-primary"
          onClick={handleWithdraw}
          disabled={!isUnlocked || !balance || isPending || isConfirming}
          title={balance ? `Withdraw ${formatEther(balance)} ETH` : 'No funds to withdraw'}
        >
          {isPending
            ? 'Waiting for approval...'
            : isConfirming
            ? 'Withdrawing...'
            : isSuccess
            ? 'Withdrawn!'
            : `Withdraw All (${balance ? formatEther(balance) : '0'} ETH)`}
        </button>
        {balance && balance > 0 && (
          <p className="withdraw-note">
            This will withdraw your entire balance of {formatEther(balance)} ETH
          </p>
        )}
      </div>

      {isSuccess && (
        <div className="success-message">
          ✅ Withdrawal successful! Check your wallet.
        </div>
      )}
    </div>
  )
}
