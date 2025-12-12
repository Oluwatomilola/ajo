import { useMemo } from 'react'
import { usePiggyBank } from './usePiggyBank'

/**
 * Optimized wrapper for usePiggyBank with additional performance enhancements
 * Provides derived values and computed states to prevent unnecessary calculations
 */
export function useOptimizedPiggyBank() {
  const hookData = usePiggyBank()
  
  // Memoize derived values to prevent recalculation on every render
  const optimized = useMemo(() => {
    const balance = hookData.balance ? Number(hookData.balance) / 1e18 : 0
    const isLocked = hookData.unlockTime ? Date.now() / 1000 < Number(hookData.unlockTime) : true
    const timeRemaining = hookData.unlockTime ? Number(hookData.unlockTime) - Math.floor(Date.now() / 1000) : 0
    
    return {
      ...hookData,
      // Derived values
      balanceInEth: balance,
      isLocked,
      timeRemaining,
      formattedBalance: balance.toFixed(4) + ' ETH',
      formattedTimeRemaining: formatTimeRemaining(timeRemaining),
      canWithdraw: !isLocked,
      // Performance flags
      isLoading: hookData.isPending || hookData.isConfirming,
      hasError: false, // Could be extended with error handling
      isReady: !!hookData.balance && !!hookData.owner,
    }
  }, [
    hookData.balance,
    hookData.unlockTime,
    hookData.isPending,
    hookData.isConfirming,
    hookData.owner
  ])

  return optimized
}

// Utility function for formatting time remaining
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Unlocked'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}