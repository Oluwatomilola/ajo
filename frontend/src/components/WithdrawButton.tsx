import { useEffect } from 'react';
import { usePiggyBank } from '../hooks/usePiggyBank';
import { useTimelock } from '../hooks/useTimelock';
import { formatEther } from 'viem';
import { BUTTONS, MESSAGES, VALIDATION } from '../constants/uxCopy';

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
      alert(VALIDATION.LOCKED_FUNDS);
      return;
    }
    if (!balance || balance === BigInt(0)) {
      alert(MESSAGES.NO_FUNDS);
      return;
    }
    withdraw();
  };

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
            {isSuccess && <span className="ml-2">✅ Withdrawn!</span>}
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
          {isPending || isConfirming ? 'Withdrawing...' : BUTTONS.WITHDRAW_ALL}
        </button>
        {balance && balance > 0 && (
          <p className="withdraw-note">
            This will withdraw your entire balance of {formatEther(balance)} ETH
          </p>
        )}
      </div>


    </div>
  )
}
