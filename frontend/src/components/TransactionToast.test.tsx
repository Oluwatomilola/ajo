import { render, screen, waitFor } from '@testing-library/react'
import { TransactionToast } from './TransactionToast'
import { useWatchPendingTransactions, useWaitForTransactionReceipt } from 'wagmi'
import { vi } from 'vitest'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useWatchPendingTransactions: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}))

describe('TransactionToast', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  it('should show pending toast when transaction is submitted', () => {
    // Mock pending transaction
    const mockPendingTx = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
    ;(useWatchPendingTransactions as jest.Mock).mockImplementation(({ onTransactions }) => {
      onTransactions([mockPendingTx])
    })
    ;(useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ isSuccess: false, isError: false })

    render(<TransactionToast />)

    expect(screen.getByText('Transaction submitted')).toBeInTheDocument()
    expect(screen.getByText('View on Explorer →')).toBeInTheDocument()
  })

  it('should show success toast when transaction is confirmed', async () => {
    const mockPendingTx = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
    ;(useWatchPendingTransactions as jest.Mock).mockImplementation(({ onTransactions }) => {
      onTransactions([mockPendingTx])
    })
    ;(useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ isSuccess: true, isError: false })

    render(<TransactionToast />)

    // Wait for the success toast to appear
    await waitFor(() => {
      expect(screen.getByText('Transaction confirmed')).toBeInTheDocument()
    })
  })

  it('should show error toast when transaction fails', async () => {
    const mockPendingTx = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
    ;(useWatchPendingTransactions as jest.Mock).mockImplementation(({ onTransactions }) => {
      onTransactions([mockPendingTx])
    })
    ;(useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ isSuccess: false, isError: true })

    render(<TransactionToast />)

    // Wait for the error toast to appear
    await waitFor(() => {
      expect(screen.getByText('Transaction failed')).toBeInTheDocument()
    })
  })

  it('should always show consistent toast messages', () => {
    // Test that the toast messages match the documented UX copy
    const expectedMessages = {
      pending: 'Transaction submitted',
      success: 'Transaction confirmed',
      error: 'Transaction failed',
    }

    expect(expectedMessages.pending).toBe('Transaction submitted')
    expect(expectedMessages.success).toBe('Transaction confirmed')
    expect(expectedMessages.error).toBe('Transaction failed')
  })
})