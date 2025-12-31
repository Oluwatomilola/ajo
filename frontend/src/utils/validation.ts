/**
 * Input validation and sanitization utilities
 * Provides centralized validation for user inputs throughout the application
 */

import { sanitizeStringInput, validateNumericInput, validateEthereumAddressFormat, validateTransactionHashFormat, validateTimestampRange, createValidationSchema } from './sharedValidation';
import { VALIDATION, REGEX_PATTERNS } from '../constants/appConstants';

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return sanitizeStringInput(input);
}

/**
 * Validates and sanitizes ETH amount input
 */
export function validateEthAmount(input: string): { isValid: boolean; value: string; error?: string } {
  if (typeof input !== 'string') {
    return { isValid: false, value: '0', error: 'Invalid input type' };
  }

  const sanitized = input.trim();
  const numericValidation = validateNumericInput(sanitized, 0, VALIDATION.MAX_ETH_AMOUNT, VALIDATION.MAX_DECIMAL_PLACES, 'Amount');

  if (!numericValidation.isValid) {
    return { isValid: false, value: '0', error: numericValidation.error };
  }

  return { isValid: true, value: sanitized };
}

/**
 * Validates and sanitizes address input
 */
export function validateAddress(address: string): { isValid: boolean; value: string; error?: string } {
  if (typeof address !== 'string') {
    return { isValid: false, value: '', error: 'Invalid address type' };
  }

  const sanitized = address.trim();
  const addressValidation = validateEthereumAddressFormat(sanitized, 'Address');

  if (!addressValidation.isValid) {
    return { isValid: false, value: '', error: addressValidation.error };
  }

  return { isValid: true, value: sanitized };
}

/**
 * Validates and sanitizes time input (Unix timestamp)
 */
export function validateTime(unixTime: string | number): { isValid: boolean; value: number; error?: string } {
  const time = typeof unixTime === 'string' ? parseInt(unixTime, 10) : unixTime;

  if (isNaN(time)) {
    return { isValid: false, value: 0, error: 'Invalid time value' };
  }

  const timestampValidation = validateTimestampRange(time, VALIDATION.MIN_TIMESTAMP, VALIDATION.MAX_TIMESTAMP, 'Time');

  if (!timestampValidation.isValid) {
    return { isValid: false, value: 0, error: timestampValidation.error };
  }

  return { isValid: true, value: time };
}

/**
 * Validates and sanitizes name/labels input
 */
export function validateName(name: string): { isValid: boolean; value: string; error?: string } {
  if (typeof name !== 'string') {
    return { isValid: false, value: '', error: 'Invalid name type' };
  }

  const sanitized = sanitizeString(name);

  if (sanitized.length === 0) {
    return { isValid: false, value: '', error: 'Name cannot be empty' };
  }

  if (sanitized.length > VALIDATION.MAX_NAME_LENGTH) {
    return { isValid: false, value: '', error: 'Name is too long (max 100 characters)' };
  }

  return { isValid: true, value: sanitized };
}

/**
 * Validates transaction hash input
 */
export function validateTransactionHash(hash: string): { isValid: boolean; value: string; error?: string } {
  if (typeof hash !== 'string') {
    return { isValid: false, value: '', error: 'Invalid hash type' };
  }

  const sanitized = hash.trim();
  const hashValidation = validateTransactionHashFormat(sanitized, 'Transaction hash');

  if (!hashValidation.isValid) {
    return { isValid: false, value: '', error: hashValidation.error };
  }

  return { isValid: true, value: sanitized };
}

/**
 * Generic input validation interface
 */
export interface ValidationResult<T> {
  isValid: boolean;
  value: T;
  error?: string;
}

/**
 * Creates a validation schema for complex objects
 */
export function createValidationSchema<T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, (value: any) => ValidationResult<any>>>
): { isValid: boolean; data: T; errors: Record<string, string> } {
  return createValidationSchema(data, rules);
}

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  ETH_AMOUNT: REGEX_PATTERNS.ETH_AMOUNT,
  HEX_ADDRESS: REGEX_PATTERNS.HEX_ADDRESS,
  TRANSACTION_HASH: REGEX_PATTERNS.TRANSACTION_HASH,
  NUMBER: REGEX_PATTERNS.NUMBER,
} as const;

/**
 * Error messages for consistent UX
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_ETH_AMOUNT: 'Please enter a valid ETH amount',
  INVALID_ADDRESS: 'Please enter a valid Ethereum address',
  INVALID_HASH: 'Please enter a valid transaction hash',
  TOO_LONG: 'Input is too long',
  TOO_SHORT: 'Input is too short',
  INVALID_FORMAT: 'Invalid format',
} as const;