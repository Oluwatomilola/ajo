import React, { useMemo } from 'react'
import { formatEther } from 'viem'
import { usePiggyBank } from '../hooks/usePiggyBank'
import { useTimelock } from '../hooks/useTimelock'
import { usePerformanceMonitor } from '../utils/performance'

// Memoized formatting function to prevent recreation on every render
const formatUnlockDate = (timestamp: bigint | undefined): string => {
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

function BalanceCardComponent() {
  const { endRender } = usePerformanceMonitor('BalanceCard')
  const { balance, unlockTime } = usePiggyBank()
  const { timeRemaining, isUnlocked } = useTimelock(unlockTime)

  // Memoize formatted values to prevent unnecessary recalculations
  const formattedBalance = useMemo(() => {
    return balance ? formatEther(balance) : '0.00'
  }, [balance])

  const formattedUnlockDate = useMemo(() => {
    return formatUnlockDate(unlockTime)
  }, [unlockTime])

  // Memoize time units to prevent re-rendering every second
  const timeUnits = useMemo(() => {
    if (!timeRemaining) return null
    
    return {
      days: timeRemaining.days,
      hours: timeRemaining.hours,
      minutes: timeRemaining.minutes,
      seconds: timeRemaining.seconds
    }
  }, [timeRemaining?.days, timeRemaining?.hours, timeRemaining?.minutes, timeRemaining?.seconds])

  // Clean up render time measurement
  useMemo(() => {
    return endRender
  }, [endRender])

  return (
    <div className="balance-card">
      <div className="balance-info">
        <h3>Total Balance</h3>
        <div className="balance-amount">
          {formattedBalance} ETH
        </div>
      </div>

      <div className="timelock-info">
        {isUnlocked ? (
          <div className="unlocked">
            <span className="status-icon">🔓</span>
            <p className="font-semibold text-green-400">Unlocked - Ready to withdraw!</p>
            <p className="text-sm text-gray-400 mt-2">
              Unlocked on: {formattedUnlockDate}
            </p>
          </div>
        ) : timeUnits ? (
          <div className="locked">
            <span className="status-icon">🔒</span>
            <p className="font-semibold mb-2">Locked until: {formattedUnlockDate}</p>
            <div className="countdown">
              <div className="time-unit">
                <span className="value">{timeUnits.days}</span>
                <span className="label">Days</span>
              </div>
              <div className="time-unit">
                <span className="value">{timeUnits.hours}</span>
                <span className="label">Hours</span>
              </div>
              <div className="time-unit">
                <span className="value">{timeUnits.minutes}</span>
                <span className="label">Min</span>
              </div>
              <div className="time-unit">
                <span className="value">{timeUnits.seconds}</span>
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

// Memoize the component to prevent unnecessary re-renders
export const BalanceCard = BalanceCardComponent
