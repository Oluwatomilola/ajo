import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { PIGGYBANK_ABI, PIGGYBANK_ADDRESS } from '../config/contracts'
import { TIME } from '../constants/appConstants'

interface Transaction {
  id: string;
  amount: string;
  timestamp: number;
  type: 'deposit' | 'withdrawal';
  user: string;
}

export function usePiggyBank() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  
  // Debounce refetch to prevent excessive network calls
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoize balance to prevent unnecessary re-renders
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'getBalance',
  })
  
  // Memoize unlock time
  const { data: unlockTime, refetch: refetchUnlockTime } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'unlockTime',
  })

  // Memoize owner to prevent unnecessary re-renders
  const { data: owner } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'owner',
  })

  // Debounced refetch to prevent excessive network calls
  const debouncedRefetch = useCallback(() => {
    // Clear existing timeout
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current)
    }
    
    // Set new timeout
    refetchTimeoutRef.current = setTimeout(() => {
      refetchBalance()
      refetchTimeoutRef.current = null
    }, TIME.DEBOUNCE_DELAY) // 1 second debounce
  }, [refetchBalance])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current)
        refetchTimeoutRef.current = null
      }
    }
  }, [])

  // Watch for Deposited events with debounced refetch
  useWatchContractEvent({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    eventName: 'Deposited',
    onLogs(logs) {
      // Automatically refetch balance when deposit event is detected
      refetchBalance()
      // Only refetch if the event is from our connected address
      if (isConnected && address && logs.some(log => 
        log.args && typeof log.args === 'object' && log.args !== null && 
        'from' in log.args && log.args.from === address
      )) {
        debouncedRefetch()
      }
      console.log('Deposited event:', logs)
      depositedEventRef.current?.()
    },
  })

  // Watch for Withdrawn events with debounced refetch
  useWatchContractEvent({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    eventName: 'Withdrawn',
    onLogs(logs) {
      // Automatically refetch balance when withdrawal event is detected
      refetchBalance()
      // Only refetch if the event is from our connected address
      if (isConnected && address && logs.some(log => 
        log.args && typeof log.args === 'object' && log.args !== null && 
        'to' in log.args && log.args.to === address
      )) {
        debouncedRefetch()
      }
      console.log('Withdrawn event:', logs)
      withdrawnEventRef.current?.()
    },
  })

  // Wait for transaction with memoization
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Memoize deposit function to prevent recreation on every render
  const deposit = useCallback((amount: string) => {
    if (!address) return

    writeContract({
      address: PIGGYBANK_ADDRESS,
      abi: PIGGYBANK_ABI,
      functionName: 'deposit',
      value: parseEther(amount),
    })
  }, [address, writeContract])

  // Withdraw function
  const withdraw = (amount: string) => {
  // Memoize withdraw function to prevent recreation on every render
  const withdraw = useCallback(() => {
    if (!address) return

    writeContract({
      address: PIGGYBANK_ADDRESS,
      abi: PIGGYBANK_ABI,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    })
  }

  // Withdraw all function
  const withdrawAll = () => {
    if (!address) return

    writeContract({
      address: PIGGYBANK_ADDRESS,
      abi: PIGGYBANK_ABI,
      functionName: 'withdrawAll',
    })
  }

  // Admin functions
  const { data: totalDeposits } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'totalDeposits',
    query: { enabled: !!address && address === owner },
  })

  const { data: totalWithdrawals } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'totalWithdrawals',
    query: { enabled: !!address && address === owner },
  })
  }, [address, writeContract])

  // Note: Transaction history implementation would require integration with
  // event indexers or subgraph queries for complete transaction tracking
  const transactions: Transaction[] = []
  // Memoize admin check
  const isOwner = useMemo(() => {
    return !!address && !!owner && address.toLowerCase() === owner.toLowerCase()
  }, [address, owner])

  // Memoize transactions array
  const transactions: Transaction[] = useMemo(() => [], [])

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    balance,
    unlockTime,
    owner,
    transactions,
    deposit,
    withdraw,
    withdrawAll,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    refetchBalance,
    refetchUnlockTime,
    isOwner,
    debouncedRefetch,
  }), [
    balance, 
    unlockTime, 
    owner, 
    transactions, 
    deposit, 
    withdraw, 
    isPending, 
    isConfirming, 
    isSuccess, 
    hash, 
    refetchBalance, 
    refetchUnlockTime,
    isOwner,
    debouncedRefetch
  ])
}
