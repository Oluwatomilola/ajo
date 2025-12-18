import { useState, useEffect } from 'react';
import { usePiggyBank } from '../hooks/usePiggyBank';
import { useTimelock } from '../hooks/useTimelock';
import { useMobile } from '../hooks/useMobile';
import { BUTTONS, LABELS, MESSAGES, VALIDATION } from '../constants/uxCopy';
import { formatLockTime } from '../constants/uxCopy';
import { useSecureAlert } from './SecureNotification';
import { SecureInput } from './ui/SecureInput';
import { validateEthAmount } from '../utils/security';

interface DepositFormProps {
  onAmountChange?: (amount: string) => void;
}

export function DepositForm({ onAmountChange }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const { deposit, isPending, isConfirming, isSuccess, refetchBalance, unlockTime } = usePiggyBank();
  const { timeRemaining } = useTimelock(unlockTime);
  const { error: showError } = useSecureAlert();
  const isMobile = useMobile();
  const [secureAmount, setSecureAmount] = useState('');
  const [amountValid, setAmountValid] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Notify parent component of amount changes
  useEffect(() => {
    if (onAmountChange) {
      onAmountChange(amount);
    }
  }, [amount, onAmountChange]);

  useEffect(() => {
    if (isSuccess) {
      setAmount('');
      setSecureAmount('');
      setAmountValid(false);
      setValidationError('');
      refetchBalance();
    }
  }, [isSuccess, refetchBalance]);

  const handleAmountChange = (value: string, isValid: boolean) => {
    setSecureAmount(value);
    setAmountValid(isValid);
    setValidationError('');

    if (isValid && value) {
      setAmount(value);
    } else {
      setAmount('');
    }
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!secureAmount || !amountValid) {
      setValidationError('Please enter a valid amount');
      showError('Invalid Amount', VALIDATION.INVALID_AMOUNT);
      return;
    }

    const numAmount = parseFloat(secureAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Amount must be greater than 0');
      showError('Invalid Amount', VALIDATION.INVALID_AMOUNT);
      return;
    }

    // Additional security check - validate ETH amount using security utils
    const ethValidation = validateEthAmount(secureAmount);
    if (!ethValidation.isValid) {
      setValidationError(ethValidation.errors.join(', '));
      showError('Invalid Amount', 'Security validation failed');
      return;
    }

    deposit(secureAmount);
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
        <SecureInput
          id="amount"
          label={LABELS.AMOUNT_ETH}
          type="text"
          value={secureAmount}
          onChange={handleAmountChange}
          validationType="amount"
          placeholder={LABELS.AMOUNT_PLACEHOLDER}
          maxLength={20}
          securityMode="strict"
          showValidation={true}
          error={validationError}
          helperText="Enter the amount of ETH to deposit"
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
          ? 'Depositing...'
          : 'Deposit ETH'}
      </button>

      {showError && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          ❌ {showError}
        </div>
      )}

      {isSuccess && (
        <div className="success-message">
          ✅ {MESSAGES.DEPOSIT_SUCCESS}
        </div>
      )}
    </form>
  );
}
