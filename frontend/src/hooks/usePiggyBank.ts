import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { PIGGYBANK_ABI, PIGGYBANK_ADDRESS } from '../config/contracts'

interface Transaction {
  id: string;
  amount: number;
  timestamp: number;
  type: 'deposit' | 'withdrawal';
  user: string;
}

export function usePiggyBank() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Read balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'getBalance',
  })

  // Watch for Deposited events
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

  // Watch for Withdrawn events
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

  // Read unlock time
  const { data: unlockTime, refetch: refetchUnlockTime } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'unlockTime',
  })

  // Read owner
  const { data: owner } = useReadContract({
    address: PIGGYBANK_ADDRESS,
    abi: PIGGYBANK_ABI,
    functionName: 'owner',
  })

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Deposit function
  const deposit = (amount: string) => {
    if (!address) return

    writeContract({
      address: PIGGYBANK_ADDRESS,
      abi: PIGGYBANK_ABI,
      functionName: 'deposit',
      value: parseEther(amount),
    })
  }

  // Withdraw function (owner-only, withdraws entire contract balance)
  const withdraw = () => {
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



  return {
    balance,
    unlockTime,
    owner,
    totalDeposits,
    totalWithdrawals,
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
}
