import '@testing-library/jest-dom/vitest'
/// <reference types="vitest/globals" />
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
})

global.window = dom.window as any
global.document = dom.window.document
global.navigator = dom.window.navigator

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Extend expect with custom matchers if needed
export { expect }

