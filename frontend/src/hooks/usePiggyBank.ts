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
        const { depositor, amount, timestamp } = log.args
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
        const { withdrawer, amount, timestamp } = log.args
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

  // Withdraw function
  const withdraw = (amount: string) => {
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
  }
}
