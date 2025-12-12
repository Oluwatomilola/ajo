/**
 * Shared validation utilities to eliminate code duplication
 * Centralized validation functions used across multiple components
 */

import { VALIDATION, REGEX_PATTERNS } from '../constants/appConstants';

/**
 * Validates input length with configurable min/max
 */
export function validateInputLength(
  input: string,
  minLength: number = 1,
  maxLength: number = VALIDATION.MAX_INPUT_LENGTH,
  fieldName: string = 'Input'
): { isValid: boolean; error?: string } {
  if (input.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (input.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (input.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }

  return { isValid: true };
}

/**
 * Validates numeric input with configurable min/max
 */
export function validateNumericInput(
  input: string,
  minValue: number = 0,
  maxValue: number = VALIDATION.MAX_ETH_AMOUNT,
  decimalPlaces: number = VALIDATION.MAX_DECIMAL_PLACES,
  fieldName: string = 'Amount'
): { isValid: boolean; error?: string } {
  const sanitized = input.trim();
  const amount = parseFloat(sanitized);

  if (isNaN(amount)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (amount < minValue) {
    return { isValid: false, error: `${fieldName} must be at least ${minValue}` };
  }

  if (amount > maxValue) {
    return { isValid: false, error: `${fieldName} must be less than ${maxValue}` };
  }

  if (sanitized.includes('.') && sanitized.split('.')[1].length > decimalPlaces) {
    return { isValid: false, error: `${fieldName} cannot have more than ${decimalPlaces} decimal places` };
  }

  return { isValid: true };
}

/**
 * Validates Ethereum address format
 */
export function validateEthereumAddressFormat(
  address: string,
  fieldName: string = 'Address'
): { isValid: boolean; error?: string } {
  const sanitized = address.trim();

  if (!REGEX_PATTERNS.HEX_ADDRESS.test(sanitized)) {
    return { isValid: false, error: `${fieldName} must be a valid Ethereum address` };
  }

  return { isValid: true };
}

/**
 * Validates transaction hash format
 */
export function validateTransactionHashFormat(
  hash: string,
  fieldName: string = 'Transaction hash'
): { isValid: boolean; error?: string } {
  const sanitized = hash.trim();

  if (!REGEX_PATTERNS.TRANSACTION_HASH.test(sanitized)) {
    return { isValid: false, error: `${fieldName} must be a valid transaction hash` };
  }

  return { isValid: true };
}

/**
 * Validates timestamp range
 */
export function validateTimestampRange(
  timestamp: number,
  minTimestamp: number = VALIDATION.MIN_TIMESTAMP,
  maxTimestamp: number = VALIDATION.MAX_TIMESTAMP,
  fieldName: string = 'Timestamp'
): { isValid: boolean; error?: string } {
  if (isNaN(timestamp)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (timestamp < minTimestamp || timestamp > maxTimestamp) {
    return { isValid: false, error: `${fieldName} must be between ${new Date(minTimestamp * 1000).getFullYear()} and ${new Date(maxTimestamp * 1000).getFullYear()}` };
  }

  return { isValid: true };
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeStringInput(
  input: string,
  maxLength: number = VALIDATION.MAX_INPUT_LENGTH
): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>'"&]/g, '')
    .substring(0, maxLength);
}

/**
 * Validates array size
 */
export function validateArraySize(
  array: any[],
  maxSize: number = VALIDATION.MAX_ARRAY_SIZE,
  fieldName: string = 'Array'
): { isValid: boolean; error?: string } {
  if (array.length > maxSize) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxSize} items` };
  }

  return { isValid: true };
}

/**
 * Validates storage key format
 */
export function validateStorageKey(
  key: string,
  maxLength: number = VALIDATION.MAX_STORAGE_KEY_LENGTH
): { isValid: boolean; error?: string } {
  if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
    return { isValid: false, error: 'Storage key contains invalid characters' };
  }

  if (key.length > maxLength) {
    return { isValid: false, error: `Storage key cannot exceed ${maxLength} characters` };
  }

  return { isValid: true };
}

/**
 * Creates a validation schema for complex objects
 */
export function createValidationSchema<T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, (value: any) => { isValid: boolean; error?: string }>>
): { isValid: boolean; data: T; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const validatedData = { ...data };

  for (const [key, rule] of Object.entries(rules)) {
    if (rule) {
      const result = rule(data[key as keyof T]);
      if (!result.isValid) {
        errors[key] = result.error || 'Validation failed';
      } else {
        validatedData[key as keyof T] = data[key as keyof T];
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    data: validatedData,
    errors
  };
}

/**
 * Common validation patterns
 */
export const COMMON_VALIDATION_PATTERNS = {
  ETH_AMOUNT: REGEX_PATTERNS.ETH_AMOUNT,
  HEX_ADDRESS: REGEX_PATTERNS.HEX_ADDRESS,
  TRANSACTION_HASH: REGEX_PATTERNS.TRANSACTION_HASH,
  NUMBER: REGEX_PATTERNS.NUMBER,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
} as const;

/**
 * Error messages for consistent UX
 */
export const COMMON_ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  TOO_LONG: 'Input is too long',
  TOO_SHORT: 'Input is too short',
  INVALID_ETH_AMOUNT: 'Please enter a valid ETH amount',
  INVALID_ADDRESS: 'Please enter a valid Ethereum address',
  INVALID_HASH: 'Please enter a valid transaction hash',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
} as const;