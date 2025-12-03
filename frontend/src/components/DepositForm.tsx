import { useState, useEffect } from 'react';
import { usePiggyBank } from '../hooks/usePiggyBank';
import { useTimelock } from '../hooks/useTimelock';
import { useMobile } from '../hooks/useMobile';
import { BUTTONS, LABELS, MESSAGES, VALIDATION } from '../constants/uxCopy';
import { formatLockTime } from '../constants/uxCopy';
import { useSecureAlert } from './SecureNotification';

interface DepositFormProps {
  amount: string;
  setAmount: (amount: string) => void;
}

export function DepositForm({ amount, setAmount }: DepositFormProps) {
  onAmountChange?: (amount: string) => void;
}

export function DepositForm({ onAmountChange }: DepositFormProps) {
  const [amount, setAmount] = useState('')
  const { deposit, isPending, isConfirming, isSuccess, refetchBalance, unlockTime } = usePiggyBank()
  const { timeRemaining } = useTimelock(unlockTime)
  const { error: showError } = useSecureAlert()
  const isMobile = useMobile()

  // Notify parent component of amount changes
  useEffect(() => {
    if (onAmountChange) {
      onAmountChange(amount);
    }
  }, [amount, onAmountChange]);

  useEffect(() => {
    if (isSuccess) {
      setAmount('')
      refetchBalance()
    }
  }, [isSuccess, refetchBalance, setAmount])

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showError('Invalid Amount', VALIDATION.INVALID_AMOUNT);
      return;
    }
    
    deposit(validation.value);
  };

  const formatLockInfo = () => {
    if (!unlockTime) return MESSAGES.LOCKED;
    if (!timeRemaining) return 'Loading lock information...';

    const days = timeRemaining.days;
    const hours = timeRemaining.hours;

    if (days > 0) {
      return formatLockTime(days, 'days');
    } else if (hours > 0) {
      return formatLockTime(hours, 'hours');
    }
    return MESSAGES.UNLOCKED;
  };

  return (
    <form className="deposit-form" onSubmit={handleDeposit}>
      <div className="form-group">
        <label htmlFor="amount">{LABELS.AMOUNT_ETH}</label>
        <input
          id="amount"
          type="number"
          step="0.001"
          min="0"
          placeholder={LABELS.AMOUNT_PLACEHOLDER}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending || isConfirming}
        />
      </div>

      <div className="info-box">
        <span className="text-lg">ℹ️</span>
        <div>
          <p className="font-medium mb-1">About This Piggy Bank</p>
          <p className="helper-text">
            {formatLockInfo()}
            <br />
            <small>{MESSAGES.DEPOSIT_HELPER}</small>
          </p>
        </div>
      </div>

      <button
        type="submit"
        className={`btn btn-primary ${isMobile ? 'mobile-btn mobile-btn-primary' : ''}`}
        disabled={!amount || isPending || isConfirming}
      >
        {isPending
          ? 'Waiting for approval...'
          : isConfirming
          ? 'Processing...'
          : isSuccess
          ? 'Deposited!'
          : BUTTONS.DEPOSIT_ETH}
      </button>

      {isSuccess && (
        <div className="success-message">
          ✅ {MESSAGES.DEPOSIT_SUCCESS}
        </div>
      )}
    </form>
  )
}
