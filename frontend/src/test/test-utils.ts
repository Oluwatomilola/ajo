import { render, RenderResult } from '@testing-library/react'
import { ReactElement } from 'react'
import * as usePiggyBankModule from '../hooks/usePiggyBank'
import * as useTimelockModule from '../hooks/useTimelock'
import { vi } from 'vitest'

/**
 * Test utilities for consistent mocking and rendering
 */

// Default mock values
export const defaultMockPiggyBank = {
  balance: BigInt('1000000000000000000'), // 1 ETH
  unlockTime: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
  isOwner: false,
  ownerAddress: undefined,
  deposit: vi.fn(),
  withdraw: vi.fn(),
  isPending: false,
  isConfirming: false,
  isSuccess: false,
  refetchBalance: vi.fn(),
  isConfirmed: false,
  hash: undefined,
}

export const defaultMockTimelock = {
  timeRemaining: {
    days: 0,
    hours: 1,
    minutes: 0,
    seconds: 0,
  },
  isUnlocked: false,
}

/**
 * Setup mocks with custom values
 */
export function setupMocks({
  piggyBank = defaultMockPiggyBank,
  timelock = defaultMockTimelock,
}: {
  piggyBank?: typeof defaultMockPiggyBank
  timelock?: typeof defaultMockTimelock
} = {}) {
  vi.mock('../hooks/usePiggyBank')
  vi.mock('../hooks/useTimelock')

  vi.spyOn(usePiggyBankModule, 'usePiggyBank').mockReturnValue(piggyBank)
  vi.spyOn(useTimelockModule, 'useTimelock').mockReturnValue(timelock)
}

/**
 * Render component with mocks
 */
export function renderWithMocks(
  component: ReactElement,
  mocks?: {
    piggyBank?: typeof defaultMockPiggyBank
    timelock?: typeof defaultMockTimelock
  }
): RenderResult {
  setupMocks(mocks)
  return render(component)
}

/**
 * Create unlocked state mocks
 */
export function createUnlockedState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      unlockTime: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
      isOwner: true,
    },
    timelock: {
      timeRemaining: null,
      isUnlocked: true,
    },
  }
}

/**
 * Create locked state mocks
 */
export function createLockedState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      unlockTime: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      isOwner: true,
    },
    timelock: {
      timeRemaining: {
        days: 0,
        hours: 1,
        minutes: 0,
        seconds: 0,
      },
      isUnlocked: false,
    },
  }
}

/**
 * Create pending transaction state mocks
 */
export function createPendingState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      isPending: true,
    },
    timelock: defaultMockTimelock,
  }
}

/**
 * Create success transaction state mocks
 */
export function createSuccessState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      isSuccess: true,
    },
    timelock: defaultMockTimelock,
  }
}

/**
 * Create error transaction state mocks
 */
export function createErrorState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      isError: true,
    },
    timelock: defaultMockTimelock,
  }
}

/**
 * Create zero balance state mocks
 */
export function createZeroBalanceState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      balance: BigInt('0'),
    },
    timelock: defaultMockTimelock,
  }
}

/**
 * Create large balance state mocks
 */
export function createLargeBalanceState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      balance: BigInt('1000000000000000000000'), // 1000 ETH
    },
    timelock: defaultMockTimelock,
  }
}

/**
 * Create undefined balance state mocks
 */
export function createUndefinedBalanceState() {
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      balance: undefined,
      unlockTime: undefined,
    },
    timelock: {
      timeRemaining: null,
      isUnlocked: false,
    },
  }
}

/**
 * Test helper to simulate time passing
 */
export function advanceTime(seconds: number) {
  const now = Math.floor(Date.now() / 1000)
  return {
    piggyBank: {
      ...defaultMockPiggyBank,
      unlockTime: BigInt(now + seconds),
    },
    timelock: seconds <= 0
      ? { timeRemaining: null, isUnlocked: true }
      : {
          timeRemaining: {
            days: Math.floor(seconds / (24 * 60 * 60)),
            hours: Math.floor((seconds % (24 * 60 * 60)) / (60 * 60)),
            minutes: Math.floor((seconds % (60 * 60)) / 60),
            seconds: seconds % 60,
          },
          isUnlocked: false,
        },
  }
}

/**
 * Test helper to create mock console
 */
export function setupMockConsole() {
  const mockConsole = {
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }

  vi.spyOn(console, 'error').mockImplementation(mockConsole.error)
  vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn)
  vi.spyOn(console, 'log').mockImplementation(mockConsole.log)
  vi.spyOn(console, 'info').mockImplementation(mockConsole.info)
  vi.spyOn(console, 'debug').mockImplementation(mockConsole.debug)

  return mockConsole
}