/**
 * Common error handling utilities to eliminate code duplication
 * Centralized error handling functions used across multiple components
 */

import { VALIDATION } from '../constants/appConstants';

/**
 * Creates a standardized error object
 */
export function createStandardError(
  message: string,
  code: string,
  details?: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Error & { code: string; severity: string; details?: any } {
  const error = new Error(message) as Error & { code: string; severity: string; details?: any };
  error.code = code;
  error.severity = severity;
  error.details = details;
  return error;
}

/**
 * Handles API errors consistently
 */
export function handleApiError(
  error: unknown,
  context: string = 'API',
  fallbackMessage: string = 'An error occurred'
): Error {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createStandardError(
        'Network connection issue. Please check your internet connection.',
        'NETWORK_ERROR',
        { originalError: error.message },
        'high'
      );
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return createStandardError(
        'Request timed out. Please try again.',
        'TIMEOUT_ERROR',
        { originalError: error.message },
        'medium'
      );
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
      return createStandardError(
        'Server error occurred. Please try again later.',
        'SERVER_ERROR',
        { originalError: error.message },
        'high'
      );
    }

    // Return the original error with additional context
    const enhancedError = createStandardError(
      error.message,
      'API_ERROR',
      { context, originalError: error.message },
      'medium'
    );
    return enhancedError;
  }

  // Handle non-Error objects
  return createStandardError(
    fallbackMessage,
    'UNKNOWN_ERROR',
    { context, originalError: String(error) },
    'high'
  );
}

/**
 * Handles blockchain transaction errors
 */
export function handleBlockchainError(
  error: unknown,
  transactionType: string = 'transaction'
): Error {
  if (error instanceof Error) {
    // Revert errors
    if (error.message.includes('revert') || error.message.includes('reverted')) {
      return createStandardError(
        `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} failed. Please check the transaction details.`,
        'BLOCKCHAIN_REVERT',
        { originalError: error.message },
        'high'
      );
    }

    // Gas errors
    if (error.message.includes('gas') || error.message.includes('insufficient funds')) {
      return createStandardError(
        'Insufficient funds or gas for this transaction. Please check your wallet balance.',
        'INSUFFICIENT_FUNDS',
        { originalError: error.message },
        'critical'
      );
    }

    // User rejected errors
    if (error.message.includes('user rejected') || error.message.includes('denied')) {
      return createStandardError(
        'Transaction was rejected by the user.',
        'USER_REJECTED',
        { originalError: error.message },
        'low'
      );
    }

    // Network errors
    if (error.message.includes('network') || error.message.includes('chain')) {
      return createStandardError(
        'Blockchain network error. Please check your network connection and try again.',
        'BLOCKCHAIN_NETWORK_ERROR',
        { originalError: error.message },
        'high'
      );
    }
  }

  return createStandardError(
    `Failed to complete ${transactionType}. Please try again.`,
    'BLOCKCHAIN_ERROR',
    { originalError: String(error) },
    'high'
  );
}

/**
 * Handles validation errors consistently
 */
export function handleValidationError(
  errors: Record<string, string>,
  context: string = 'Validation'
): Error {
  const errorMessages = Object.values(errors).join(', ');
  return createStandardError(
    `Validation failed: ${errorMessages}`,
    'VALIDATION_ERROR',
    { errors, context },
    'medium'
  );
}

/**
 * Creates error messages for rate limiting
 */
export function createRateLimitError(
  maxAttempts: number = VALIDATION.RATE_LIMIT_DEFAULT_ATTEMPTS,
  windowMinutes: number = VALIDATION.RATE_LIMIT_DEFAULT_WINDOW / 60000
): Error {
  return createStandardError(
    `Too many attempts. Please wait ${windowMinutes} minutes before trying again.`,
    'RATE_LIMIT_EXCEEDED',
    { maxAttempts, windowMinutes },
    'medium'
  );
}

/**
 * Handles wallet connection errors
 */
export function handleWalletError(error: unknown): Error {
  if (error instanceof Error) {
    // Wallet not found
    if (error.message.includes('wallet') && (error.message.includes('not found') || error.message.includes('detected'))) {
      return createStandardError(
        'Wallet not found. Please install a compatible wallet extension.',
        'WALLET_NOT_FOUND',
        { originalError: error.message },
        'critical'
      );
    }

    // Connection errors
    if (error.message.includes('connection') || error.message.includes('connect')) {
      return createStandardError(
        'Failed to connect to wallet. Please check your wallet and try again.',
        'WALLET_CONNECTION_ERROR',
        { originalError: error.message },
        'high'
      );
    }

    // Chain errors
    if (error.message.includes('chain') || error.message.includes('network')) {
      return createStandardError(
        'Wallet is connected to the wrong network. Please switch to the correct network.',
        'WRONG_NETWORK',
        { originalError: error.message },
        'critical'
      );
    }
  }

  return createStandardError(
    'Wallet operation failed. Please check your wallet and try again.',
    'WALLET_ERROR',
    { originalError: String(error) },
    'high'
  );
}

/**
 * Logs errors consistently based on environment
 */
export function logError(
  error: Error,
  context: string = 'Application',
  level: 'debug' | 'info' | 'warn' | 'error' = 'error'
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      code: (error as any).code || 'UNKNOWN',
      severity: (error as any).severity || 'medium',
      stack: undefined
    }
  };

  switch (level) {
    case 'debug':
      console.debug('🐞 [DEBUG]', logData);
      break;
    case 'info':
      console.info('ℹ️ [INFO]', logData);
      break;
    case 'warn':
      console.warn('⚠️ [WARN]', logData);
      break;
    case 'error':
    default:
      console.error('❌ [ERROR]', logData);
      break;
  }
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR', 'BLOCKCHAIN_NETWORK_ERROR'];
  const retryableMessages = ['network', 'timeout', 'fetch', 'connection', '500', '502', '503', '504'];

  const code = (error as any).code;
  const message = error.message.toLowerCase();

  return retryableCodes.includes(code) || retryableMessages.some(msg => message.includes(msg));
}

/**
 * Creates user-friendly error messages
 */
export function createUserFriendlyMessage(error: Error): string {
  const code = (error as any).code;
  const severity = (error as any).severity;

  const messages: Record<string, string> = {
    NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    BLOCKCHAIN_REVERT: 'Transaction failed. Please check the transaction details.',
    INSUFFICIENT_FUNDS: 'Insufficient funds or gas for this transaction.',
    USER_REJECTED: 'Transaction was rejected.',
    BLOCKCHAIN_NETWORK_ERROR: 'Blockchain network error. Please check your connection.',
    VALIDATION_ERROR: 'Please correct the errors in the form and try again.',
    RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait before trying again.',
    WALLET_NOT_FOUND: 'Wallet not found. Please install a wallet extension.',
    WALLET_CONNECTION_ERROR: 'Failed to connect to wallet. Please try again.',
    WRONG_NETWORK: 'Wrong network. Please switch to the correct network.',
    WALLET_ERROR: 'Wallet operation failed. Please try again.',
  };

  return messages[code] || 'An error occurred. Please try again.';
}