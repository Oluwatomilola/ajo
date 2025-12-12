/**
 * Error Handling Utilities
 * Centralized error handling for the application
 */

import { VALIDATION } from '../constants/appConstants';

export interface AppError extends Error {
  readonly id: string
  readonly timestamp: Date
  readonly context?: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly userMessage: string
  readonly technicalDetails?: string
  readonly stack?: string
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: Array<(error: AppError) => void> = []
  private errorHistory: AppError[] = []
  private maxHistorySize = VALIDATION.MAX_ERROR_HISTORY

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Create a structured app error
   */
  createError(
    message: string,
    options: {
      context?: string
      severity?: AppError['severity']
      userMessage?: string
      technicalDetails?: string
      originalError?: Error
    } = {}
  ): AppError {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date()
    const severity = options.severity || 'medium'
    const userMessage = options.userMessage || this.getUserFriendlyMessage(message, severity)
    const technicalDetails = options.technicalDetails || message
    
    const error: AppError = Object.assign(new Error(message), {
      id,
      timestamp,
      context: options.context,
      severity,
      userMessage,
      technicalDetails,
      stack: options.originalError?.stack || new Error().stack,
    })

    return error
  }

  /**
   * Handle and log errors
   */
  handle(error: Error | string, context?: string): AppError {
    const appError = typeof error === 'string' 
      ? this.createError(error, { context })
      : this.createError(error.message, { 
          context, 
          originalError: error,
          severity: this.determineSeverity(error)
        })

    // Add to history
    this.addToHistory(appError)

    // Notify listeners
    this.notifyListeners(appError)

    // Log based on environment
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Application Error')
      console.error('Error:', appError)
      console.error('Context:', context)
      console.error('Stack:', appError.stack)
      console.groupEnd()
    } else {
      // In production, you might want to send to error reporting service
      this.logToService(appError)
    }

    return appError
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener)
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener)
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): AppError[] {
    return [...this.errorHistory]
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error | AppError): boolean {
    const message = error.message.toLowerCase()
    
    // Network errors are often retryable
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return true
    }
    
    // Timeout errors are retryable
    if (message.includes('timeout') || message.includes('timed out')) {
      return true
    }
    
    // 5xx server errors are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true
    }
    
    return false
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(message: string, severity: AppError['severity']): string {
    const lowerMessage = message.toLowerCase()
    
    // Blockchain related errors
    if (lowerMessage.includes('transaction') || lowerMessage.includes('revert') || lowerMessage.includes('gas')) {
      return 'Transaction failed. Please try again with a higher gas fee.'
    }
    
    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection.'
    }
    
    // Wallet errors
    if (lowerMessage.includes('wallet') || lowerMessage.includes('metamask') || lowerMessage.includes('signature')) {
      return 'Wallet operation failed. Please check your wallet connection.'
    }
    
    // Contract errors
    if (lowerMessage.includes('contract') || lowerMessage.includes('abi') || lowerMessage.includes('address')) {
      return 'Contract interaction error. Please verify your wallet is connected to the correct network.'
    }
    
    // Generic fallback
    const severityMessages = {
      low: 'Something small went wrong, but don\'t worry.',
      medium: 'Something went wrong. Please try again.',
      high: 'A significant error occurred. Please refresh the page.',
      critical: 'A critical error occurred. Please contact support.'
    }
    
    return severityMessages[severity]
  }

  /**
   * Determine error severity based on error type and context
   */
  private determineSeverity(error: Error): AppError['severity'] {
    const message = error.message.toLowerCase()
    
    // Critical errors
    if (message.includes('chunk') || message.includes('loading') || message.includes('compilation')) {
      return 'critical'
    }
    
    // High severity errors
    if (message.includes('contract') || message.includes('transaction') || message.includes('wallet')) {
      return 'high'
    }
    
    // Medium severity errors (default for most app errors)
    return 'medium'
  }

  /**
   * Add error to history with size limit
   */
  private addToHistory(error: AppError): void {
    this.errorHistory.unshift(error)
    
    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError)
      }
    })
  }

  /**
   * Log to external service (placeholder for production)
   */
  private logToService(error: AppError): void {
    // In production, you would send this to your error reporting service
    // e.g., Sentry, LogRocket, Bugsnag, etc.
    console.warn('Production error:', {
      id: error.id,
      message: error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
    })
  }
}

// Create global instance
export const errorHandler = ErrorHandler.getInstance()

/**
 * React hook for error handling
 */
import { useState, useEffect } from 'react'

export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([])

  useEffect(() => {
    const unsubscribe = errorHandler.subscribe((error) => {
      setErrors(prev => [error, ...prev].slice(0, VALIDATION.MAX_ERROR_DISPLAY)) // Keep only last 10 errors
    })

    return unsubscribe
  }, [])

  const handleError = (error: Error | string, context?: string) => {
    return errorHandler.handle(error, context)
  }

  const clearErrors = () => {
    setErrors([])
    errorHandler.clearHistory()
  }

  return {
    errors,
    handleError,
    clearErrors,
    isRetryable: errorHandler.isRetryable.bind(errorHandler),
  }
}