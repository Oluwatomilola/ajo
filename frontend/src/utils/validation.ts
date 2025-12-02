/**
 * Input validation and sanitization utilities
 * Provides centralized validation for user inputs throughout the application
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Validates and sanitizes ETH amount input
 */
export function validateEthAmount(input: string): { isValid: boolean; value: string; error?: string } {
  if (typeof input !== 'string') {
    return { isValid: false, value: '0', error: 'Invalid input type' };
  }

  const sanitized = input.trim();
  
  // Check if it's a number
  const amount = parseFloat(sanitized);
  if (isNaN(amount)) {
    return { isValid: false, value: '0', error: 'Please enter a valid number' };
  }

  // Check if positive
  if (amount <= 0) {
    return { isValid: false, value: '0', error: 'Amount must be greater than 0' };
  }

  // Check if not too large (practical limits)
  if (amount > 1000000) {
    return { isValid: false, value: '0', error: 'Amount is too large' };
  }

  // Limit decimal places to 18 (Wei precision)
  const decimalPlaces = sanitized.split('.')[1]?.length || 0;
  if (decimalPlaces > 18) {
    return { 
      isValid: false, 
      value: '0', 
      error: 'Maximum 18 decimal places allowed' 
    };
  }

  return { isValid: true, value: amount.toString() };
}

/**
 * Validates and sanitizes address input
 */
export function validateAddress(address: string): { isValid: boolean; value: string; error?: string } {
  if (typeof address !== 'string') {
    return { isValid: false, value: '', error: 'Invalid address type' };
  }

  const sanitized = address.trim();
  
  // Check if it's a valid Ethereum address format
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(sanitized)) {
    return { isValid: false, value: '', error: 'Invalid Ethereum address format' };
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

  // Check if time is in reasonable range (between 2020 and 2100)
  const minTime = Date.UTC(2020, 0, 1) / 1000;
  const maxTime = Date.UTC(2100, 0, 1) / 1000;
  
  if (time < minTime || time > maxTime) {
    return { isValid: false, value: 0, error: 'Time must be between 2020 and 2100' };
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

  if (sanitized.length > 100) {
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
  
  // Check if it's a valid transaction hash format
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!txHashRegex.test(sanitized)) {
    return { isValid: false, value: '', error: 'Invalid transaction hash format' };
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
  const errors: Record<string, string> = {};
  const validatedData = { ...data };

  for (const [key, rule] of Object.entries(rules)) {
    if (rule) {
      const result = rule(data[key as keyof T]);
      if (!result.isValid) {
        errors[key] = result.error || 'Validation failed';
      } else {
        validatedData[key as keyof T] = result.value;
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
export const VALIDATION_PATTERNS = {
  ETH_AMOUNT: /^\d*\.?\d*$/,
  HEX_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
  NUMBER: /^\d+$/,
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