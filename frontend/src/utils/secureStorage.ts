/**
 * Secure storage utilities with validation and sanitization
 * Replaces unsafe direct localStorage usage to prevent XSS attacks
 */

import { VALIDATION } from '../constants/appConstants';

export interface StorageData {
  [key: string]: unknown;
}

const STORAGE_PREFIX = 'ajo_secure_';

/**
 * Sanitizes input to prevent XSS attacks
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#39;',
        '&': '&',
        "'": ''',
        '&': '&',
      };
      return entities[match];
    })
    .trim()
    .substring(0, VALIDATION.MAX_INPUT_LENGTH); // Limit length
}

/**
 * Validates JSON structure before parsing
 */
function validateJSONStructure(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // For arrays, ensure they're not too large
  if (Array.isArray(data) && data.length > VALIDATION.MAX_ARRAY_SIZE) {
    return false;
  }

  // Check for dangerous properties
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];
  const checkObject = (obj: unknown): boolean => {
    if (typeof obj !== 'object' || obj === null) return true;
    
    for (const key of Object.keys(obj)) {
      if (dangerousProps.includes(key)) return false;
      if (!checkObject((obj as Record<string, unknown>)[key])) return false;
    }
    return true;
  };

  return checkObject(data);
}

/**
 * Safely parses JSON with validation
 */
function safeJSONParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    if (validateJSONStructure(parsed)) {
      return parsed as T;
    }
    console.warn('Invalid JSON structure detected in secureStorage');
    return fallback;
  } catch (error) {
    console.warn('Failed to parse JSON in secureStorage:', error);
    return fallback;
  }
}

/**
 * Securely stores data in localStorage with sanitization
 */
export function secureSetItem<T extends StorageData>(key: string, value: T): boolean {
  try {
    const sanitizedValue = JSON.stringify(value, (k, v) => {
      if (typeof v === 'string') {
        return sanitizeInput(v);
      }
      return v;
    });
    
    localStorage.setItem(STORAGE_PREFIX + key, sanitizedValue);
    return true;
  } catch (error) {
    console.error('Failed to securely store data:', error);
    return false;
  }
}

/**
 * Securely retrieves data from localStorage with validation
 */
export function secureGetItem<T extends StorageData>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) return fallback;
    
    const parsed = safeJSONParse<T>(stored, fallback);
    return validateJSONStructure(parsed) ? parsed : fallback;
  } catch (error) {
    console.error('Failed to securely retrieve data:', error);
    return fallback;
  }
}

/**
 * Securely removes data from localStorage
 */
export function secureRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (error) {
    console.error('Failed to securely remove data:', error);
    return false;
  }
}

/**
 * Securely clears all app data from localStorage
 */
export function secureClear(): boolean {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to securely clear data:', error);
    return false;
  }
}

/**
 * Validates that a storage key is safe to use
 */
function validateStorageKey(key: string): boolean {
  // Only allow alphanumeric characters, hyphens, underscores, and dots
  return /^[a-zA-Z0-9._-]+$/.test(key) && key.length <= VALIDATION.MAX_STORAGE_KEY_LENGTH;
}

/**
 * Secure storage with type safety and validation
 */
export class SecureStorage<T extends StorageData> {
  private prefix: string;

  constructor(prefix: string = 'default') {
    this.prefix = validateStorageKey(prefix) ? prefix : 'default';
  }

  set(key: string, value: T): boolean {
    if (!validateStorageKey(key)) {
      console.error('Invalid storage key:', key);
      return false;
    }
    return secureSetItem(`${this.prefix}_${key}`, value);
  }

  get(key: string, fallback: T): T {
    if (!validateStorageKey(key)) {
      console.error('Invalid storage key:', key);
      return fallback;
    }
    return secureGetItem<T>(`${this.prefix}_${key}`, fallback);
  }

  remove(key: string): boolean {
    if (!validateStorageKey(key)) {
      console.error('Invalid storage key:', key);
      return false;
    }
    return secureRemoveItem(`${this.prefix}_${key}`);
  }

  clear(): boolean {
    try {
      const keysToRemove: string[] = [];
      const prefix = STORAGE_PREFIX + this.prefix + '_';
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      return false;
    }
  }
}