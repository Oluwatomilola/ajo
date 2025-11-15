import { formatEther } from 'viem'
import { usePiggyBank } from '../hooks/usePiggyBank'
import { useTimelock } from '../hooks/useTimelock'

export function BalanceCard() {
  const { balance, unlockTime } = usePiggyBank()
  const { timeRemaining, isUnlocked } = useTimelock(unlockTime)

  const formatUnlockDate = (timestamp: bigint | undefined) => {
    if (!timestamp) return 'Not set'
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="balance-card">
      <div className="balance-info">
        <h3>Total Balance</h3>
        <div className="balance-amount">
          {balance ? formatEther(balance) : '0.00'} ETH
        </div>
      </div>

      <div className="timelock-info">
        {isUnlocked ? (
          <div className="unlocked">
            <span className="status-icon">🔓</span>
            <p className="font-semibold text-green-400">Unlocked - Ready to withdraw!</p>
            <p className="text-sm text-gray-400 mt-2">
              Unlocked on: {formatUnlockDate(unlockTime)}
            </p>
          </div>
        ) : timeRemaining ? (
          <div className="locked">
            <span className="status-icon">🔒</span>
            <p className="font-semibold mb-2">Locked until: {formatUnlockDate(unlockTime)}</p>
            <div className="countdown">
              <div className="time-unit">
                <span className="value">{timeRemaining.days}</span>
                <span className="label">Days</span>
              </div>
              <div className="time-unit">
                <span className="value">{timeRemaining.hours}</span>
                <span className="label">Hours</span>
              </div>
              <div className="time-unit">
                <span className="value">{timeRemaining.minutes}</span>
                <span className="label">Min</span>
              </div>
              <div className="time-unit">
                <span className="value">{timeRemaining.seconds}</span>
                <span className="label">Sec</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-lock">
            <p className="text-gray-400">No active time lock</p>
          </div>
        )}
      </div>
    </div>
  )
}
