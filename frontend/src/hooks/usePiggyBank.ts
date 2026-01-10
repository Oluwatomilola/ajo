import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { PIGGYBANK_ABI, PIGGYBANK_ADDRESS } from '../config/contracts'
import { TIME } from '../constants/appConstants'

interface Transaction {
  id: string;
  amount: number;
  timestamp: number;
  type: 'deposit' | 'withdrawal';
  user: string;
}

export function usePiggyBank() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const [transactions, setTransactions] = useState<Transaction[]>([])

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
      
      // Add deposit transactions to history
      logs.forEach((log) => {
        // The log.args shape from different providers may vary — coerce to unknown to
        // avoid strict index/property type errors and normalize the values.
        const args: unknown = log.args
        const depositor = args?.depositor ?? args?.from ?? args?.[0]
        const amount = args?.amount ?? args?.[1]
        const timestamp = args?.timestamp ?? Date.now()
        const newTransaction: Transaction = {
          id: `${log.blockNumber}-${log.logIndex}`,
          amount: Number(amount) / 1e18, // Convert from wei to ETH
          timestamp: Number(timestamp),
          type: 'deposit',
          user: depositor as string,
        }
        setTransactions(prev => [newTransaction, ...prev].slice(0, 50)) // Keep last 50 transactions
      })
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
      
      // Add withdrawal transactions to history
      logs.forEach((log) => {
        const args: unknown = log.args
        const withdrawer = args?.withdrawer ?? args?.to ?? args?.[0]
        const amount = args?.amount ?? args?.[1]
        const timestamp = args?.timestamp ?? Date.now()
        const newTransaction: Transaction = {
          id: `${log.blockNumber}-${log.logIndex}`,
          amount: Number(amount) / 1e18, // Convert from wei to ETH
          timestamp: Number(timestamp),
          type: 'withdrawal',
          user: withdrawer as string,
        }
        setTransactions(prev => [newTransaction, ...prev].slice(0, 50)) // Keep last 50 transactions
      })
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

  // Withdraw function (owner-only, withdraws entire contract balance)
  const withdraw = () => {
  // Withdraw function
  const withdraw = (amount: string) => {
  // Memoize withdraw function to prevent recreation on every render
  const withdraw = useCallback(() => {
    if (!address) return

    writeContract({
      address: PIGGYBANK_ADDRESS,
      abi: PIGGYBANK_ABI,
      functionName: 'withdraw',
    })
  }

  // Withdraw all alias — forwards to owner withdraw
  const withdrawAll = () => {
    withdraw()
  }

  // Get contract statistics using the aggregated function
  const { data: contractStats } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'getContractStats',
    query: { enabled: !!address && address === owner },
  })

  // Extract individual values from contractStats tuple
  const totalDeposits = contractStats && contractStats.length >= 3 ? contractStats[0] : undefined
  const totalWithdrawals = contractStats && contractStats.length >= 3 ? contractStats[1] : undefined

  // Compute owner flag for convenience in components and tests
  const isOwner = !!(address && owner && String(address).toLowerCase() === String(owner).toLowerCase())


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
  }
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
