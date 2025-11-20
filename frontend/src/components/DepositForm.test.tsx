import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DepositForm } from './DepositForm'
import * as usePiggyBankModule from '../hooks/usePiggyBank'
import * as useTimelockModule from '../hooks/useTimelock'

// Mock the hooks
vi.mock('../hooks/usePiggyBank')
vi.mock('../hooks/useTimelock')

describe('DepositForm', () => {
  const mockUsePiggyBank = vi.spyOn(usePiggyBankModule, 'usePiggyBank')
  const mockUseTimelock = vi.spyOn(useTimelockModule, 'useTimelock')
  const mockDeposit = vi.fn()
  const mockRefetchBalance = vi.fn()
  const mockAlert = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = mockAlert
  })

  describe('Form Input', () => {
    it('should render amount input field', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('placeholder', '0.00')
    })

    it('should update amount when user types', async () => {
      const user = userEvent.setup()

      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i) as HTMLInputElement
      await user.type(input, '1.5')

      expect(input.value).toBe('1.5')
    })

    it('should disable input when pending', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i)
      expect(input).toBeDisabled()
    })

    it('should disable input when confirming', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: true,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i)
      expect(input).toBeDisabled()
    })
  })

  describe('formatLockInfo Function', () => {
    it('should display default message when unlockTime is undefined', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/Lock period will be determined by contract settings/i)).toBeInTheDocument()
    })

    it('should display loading message when timeRemaining is null but unlockTime exists', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/Loading lock information.../i)).toBeInTheDocument()
    })

    it('should display days when lock period is in days (singular)', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: {
          days: 1,
          hours: 0,
          minutes: 0,
          seconds: 0,
        },
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/Locked for approximately 1 day/i)).toBeInTheDocument()
    })

    it('should display days when lock period is in days (plural)', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 48 * 60 * 60),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: {
          days: 2,
          hours: 5,
          minutes: 30,
          seconds: 45,
        },
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/Locked for approximately 2 days/i)).toBeInTheDocument()
    })

    it('should display hours when lock period is less than a day (singular)', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: {
          days: 0,
          hours: 1,
          minutes: 30,
          seconds: 45,
        },
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/Locked for approximately 1 hour/i)).toBeInTheDocument()
    })

    it('should display hours when lock period is less than a day (plural)', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 7200),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: {
          days: 0,
          hours: 5,
          minutes: 30,
          seconds: 45,
        },
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/Locked for approximately 5 hours/i)).toBeInTheDocument()
    })

    it('should display unlocked message when no days or hours', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 120),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: {
          days: 0,
          hours: 0,
          minutes: 2,
          seconds: 30,
        },
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/This piggy bank is unlocked/i)).toBeInTheDocument()
    })

    it('should handle zero days and zero hours correctly', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 30),
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 30,
        },
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText(/This piggy bank is unlocked/i)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call deposit function with valid amount', async () => {
      const user = userEvent.setup()

      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i)
      await user.type(input, '1.5')

      const button = screen.getByRole('button', { name: /Deposit ETH/i })
      await user.click(button)

      expect(mockDeposit).toHaveBeenCalledWith('1.5')
      expect(mockAlert).not.toHaveBeenCalled()
    })

    it('should show alert when amount is empty', async () => {
      const user = userEvent.setup()

      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const button = screen.getByRole('button', { name: /Deposit ETH/i })

      // Remove disabled to test validation
      button.removeAttribute('disabled')
      await user.click(button)

      expect(mockAlert).toHaveBeenCalledWith('Please enter a valid amount')
      expect(mockDeposit).not.toHaveBeenCalled()
    })

    it('should show alert when amount is zero', async () => {
      const user = userEvent.setup()

      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i)
      await user.type(input, '0')

      const button = screen.getByRole('button', { name: /Deposit ETH/i })
      button.removeAttribute('disabled')
      await user.click(button)

      expect(mockAlert).toHaveBeenCalledWith('Please enter a valid amount')
      expect(mockDeposit).not.toHaveBeenCalled()
    })

    it('should show alert when amount is negative', async () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i) as HTMLInputElement

      // Directly set the value to bypass HTML5 validation
      fireEvent.change(input, { target: { value: '-1' } })

      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(mockAlert).toHaveBeenCalledWith('Please enter a valid amount')
      expect(mockDeposit).not.toHaveBeenCalled()
    })
  })

  describe('Button States', () => {
    it('should display "Deposit ETH" when idle', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByRole('button', { name: /Deposit ETH/i })).toBeInTheDocument()
    })

    it('should display "Waiting for approval..." when pending', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByRole('button', { name: /Waiting for approval.../i })).toBeInTheDocument()
    })

    it('should display "Depositing..." when confirming', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: true,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByRole('button', { name: /Depositing.../i })).toBeInTheDocument()
    })

    it('should display "Deposited!" when successful', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: true,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByRole('button', { name: /Deposited!/i })).toBeInTheDocument()
    })

    it('should disable button when amount is empty', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should disable button when pending', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should disable button when confirming', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: true,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Success State', () => {
    it('should display success message when deposit is successful', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: true,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.getByText('✅ Deposit successful! Your ETH is now locked.')).toBeInTheDocument()
    })

    it('should not display success message when deposit is not successful', () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      expect(screen.queryByText('✅ Deposit successful! Your ETH is now locked.')).not.toBeInTheDocument()
    })

    it('should clear amount field when deposit is successful', async () => {
      const user = userEvent.setup()

      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      const { rerender } = render(<DepositForm />)

      const input = screen.getByLabelText(/Amount \(ETH\)/i) as HTMLInputElement
      await user.type(input, '1.5')
      expect(input.value).toBe('1.5')

      // Now simulate success
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: true,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      rerender(<DepositForm />)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('should call refetchBalance when deposit is successful', async () => {
      mockUsePiggyBank.mockReturnValue({
        deposit: mockDeposit,
        isPending: false,
        isConfirming: false,
        isSuccess: true,
        refetchBalance: mockRefetchBalance,
        unlockTime: undefined,
        balance: undefined,
        isOwner: false,
        ownerAddress: undefined,
        withdraw: vi.fn(),
        isConfirmed: false,
        hash: undefined,
      })

      mockUseTimelock.mockReturnValue({
        timeRemaining: null,
        isUnlocked: false,
      })

      render(<DepositForm />)

      await waitFor(() => {
        expect(mockRefetchBalance).toHaveBeenCalled()
      })
    })
  })
})
