import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { useMemo, useCallback, useRef } from 'react'
import { PIGGYBANK_ABI, PIGGYBANK_ADDRESS } from '../config/contracts'

interface Transaction {
  id: string;
  amount: string;
  timestamp: number;
  type: 'deposit' | 'withdrawal';
  user: string;
}

export function usePiggyBank() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()

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

  // Create refetch callbacks once and reuse them
  const balanceRefetch = useCallback(() => {
    refetchBalance()
  }, [refetchBalance])

  // Watch for Deposited events with optimized callback
  useWatchContractEvent({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    eventName: 'Deposited',
    onLogs(logs) {
      console.log('Deposited event:', logs)
      // Use callback to refetch balance
      balanceRefetch()
    },
  })

  // Watch for Withdrawn events with optimized callback
  useWatchContractEvent({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    eventName: 'Withdrawn',
    onLogs(logs) {
      console.log('Withdrawn event:', logs)
      // Use callback to refetch balance
      balanceRefetch()
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

  // Memoize withdraw function to prevent recreation on every render
  const withdraw = useCallback(() => {
    if (!address) return

    writeContract({
      address: PIGGYBANK_ADDRESS,
      abi: PIGGYBANK_ABI,
      functionName: 'withdraw',
    })
  }, [address, writeContract])

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
    isPending,
    isConfirming,
    isSuccess,
    hash,
    refetchBalance,
    refetchUnlockTime,
    isOwner,
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
    isOwner
  ])
}
