// Wallet Connection History Storage

import { VALIDATION, TIME } from '../constants/appConstants';

interface WalletConnection {
  address: string
  chainId: number
  connectedAt: number
  connectorId: string
}

const STORAGE_KEY = 'ajo_wallet_history'
const MAX_HISTORY = VALIDATION.MAX_WALLET_HISTORY

export function saveWalletConnection(connection: Omit<WalletConnection, 'connectedAt'>) {
  try {
    const history = getWalletHistory()

    const newConnection: WalletConnection = {
      ...connection,
      connectedAt: Date.now()
    }

    // Remove duplicates
    const filtered = history.filter(c => c.address.toLowerCase() !== connection.address.toLowerCase())

    // Add new connection at the start
    const updated = [newConnection, ...filtered].slice(0, MAX_HISTORY)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    return true
  } catch (error) {
    console.error('Failed to save wallet connection:', error)
    return false
  }
}

export function getWalletHistory(): WalletConnection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const history = JSON.parse(stored) as WalletConnection[]

    // Filter out connections older than 30 days
    const thirtyDaysAgo = Date.now() - TIME.THIRTY_DAYS_IN_MS
    return history.filter(c => c.connectedAt > thirtyDaysAgo)
  } catch (error) {
    console.error('Failed to get wallet history:', error)
    return []
  }
}

export function clearWalletHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear wallet history:', error)
    return false
  }
}

export function getLastConnectedWallet(): WalletConnection | null {
  const history = getWalletHistory()
  return history[0] || null
}

export function removeWalletFromHistory(address: string) {
  try {
    const history = getWalletHistory()
    const filtered = history.filter(c => c.address.toLowerCase() !== address.toLowerCase())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Failed to remove wallet from history:', error)
    return false
  }
}
