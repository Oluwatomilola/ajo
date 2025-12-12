import { useState, useEffect } from 'react'
import { useWatchPendingTransactions, useWaitForTransactionReceipt } from 'wagmi'

interface Toast {
  id: string
  message: string
  type: 'pending' | 'success' | 'error'
  txHash?: string
}

/**
 * TransactionToast component provides consistent feedback for all transaction states.
 * Always shows clear messages for:
 * - Pending: "Transaction submitted"
 * - Success: "Transaction confirmed"
 * - Error: "Transaction failed"
 * This ensures users always receive feedback about their transaction status.
 */
export function TransactionToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  // Watch for pending transactions
  useWatchPendingTransactions({
    onTransactions(transactions) {
      transactions.forEach((tx) => {
        addToast({
          id: tx,
          message: 'Transaction submitted',
          type: 'pending',
          txHash: tx,
        })
        // Set the first pending transaction for confirmation watching
        if (!pendingTxHash) {
          setPendingTxHash(tx as `0x${string}`)
        }
      })
    },
  })

  // Watch for transaction confirmation
  const { isSuccess, isError } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && pendingTxHash) {
      // Remove pending toast
      removeToast(pendingTxHash)

      // Add success toast
      addToast({
        id: `${pendingTxHash}-success`,
        message: 'Transaction confirmed',
        type: 'success',
        txHash: pendingTxHash,
      })

      // Reset pending hash
      setPendingTxHash(undefined)
    }
  }, [isSuccess, pendingTxHash])

  // Handle failed transaction
  useEffect(() => {
    if (isError && pendingTxHash) {
      // Remove pending toast
      removeToast(pendingTxHash)

      // Add error toast
      addToast({
        id: `${pendingTxHash}-error`,
        message: 'Transaction failed',
        type: 'error',
        txHash: pendingTxHash,
      })

      // Reset pending hash
      setPendingTxHash(undefined)
    }
  }, [isError, pendingTxHash])

  const addToast = (toast: Toast) => {
    setToasts((prev) => [...prev, toast])

    // Auto-remove after 5 seconds for success/error, 10 seconds for pending
    const timeout = toast.type === 'pending' ? 10000 : 5000
    setTimeout(() => {
      removeToast(toast.id)
    }, timeout)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'pending' && '⏳'}
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
            </span>
            <div className="toast-text">
              <p className="toast-message">{toast.message}</p>
              {toast.txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${toast.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="toast-link"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
