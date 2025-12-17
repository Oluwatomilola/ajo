import { useEffect, useState } from 'react';
import { usePiggyBank } from '../hooks/usePiggyBank';
import { useTimelock } from '../hooks/useTimelock';
import { formatEther } from 'viem';
import { BUTTONS, MESSAGES, VALIDATION } from '../constants/uxCopy';

export function WithdrawButton() {
  const { balance, unlockTime, withdraw, withdrawAll, isPending, isConfirming, isSuccess, refetchBalance } = usePiggyBank()
  const { isUnlocked } = useTimelock(unlockTime)
  const [showError, setShowError] = useState<string | null>(null)

  useEffect(() => {
    if (isSuccess) {
      refetchBalance()
      setShowError(null)
    }
  }, [isSuccess, refetchBalance])

  const handleWithdraw = () => {
    if (!isUnlocked) {
      setShowError(VALIDATION.LOCKED_FUNDS)
      setTimeout(() => setShowError(null), 5000)
      return
    }
    if (!balance || balance === BigInt(0)) {
      setShowError(MESSAGES.NO_FUNDS)
      setTimeout(() => setShowError(null), 5000)
      return
    }
    withdrawAll()
  }

  return (
    <div className="withdraw-section">
      <div className="withdraw-info">
        {!isUnlocked ? (
          <div className="warning-box">
            <span className="icon">⏰</span>
            <p>
              {VALIDATION.LOCKED_FUNDS}
            </p>
          </div>
        ) : (
          <div className="success-box">
            <p>
              {MESSAGES.UNLOCKED}
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
            : `Withdraw All (${balance ? formatEther(balance) : '0'} ETH)`}
        </button>
        {balance && balance > 0 && (
          <p className="withdraw-note">
            This will withdraw your entire balance of {formatEther(balance)} ETH
          </p>
        )}
      </div>

      {showError && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          ❌ {showError}
        </div>
      )}

      {isSuccess && (
        <div className="success-message">
          ✅ Withdrawal successful! Check your wallet.
        </div>
      )}
    </div>
  )
}
