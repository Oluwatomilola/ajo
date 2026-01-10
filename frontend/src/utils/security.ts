/**
 * Security Utilities
 * Comprehensive security functions for input validation, XSS prevention, and safe data handling
 */

import { VALIDATION } from '../constants/appConstants';

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: string
}

export interface SecurityConfig {
  maxLength?: number
  allowedChars?: RegExp
  disallowedPatterns?: RegExp[]
  allowHTML?: boolean
  allowUrls?: boolean
  strictMode?: boolean
}

/**
 * Default security patterns
 */
export const SECURITY_PATTERNS = {
  // XSS patterns
  XSS_SCRIPT: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  XSS_EVENT: /\bon\w+\s*=/gi,
  XSS_JAVASCRIPT: /javascript:/gi,
  XSS_VBSCRIPT: /vbscript:/gi,
  XSS_DATA: /data:/gi,
  XSS_SRC: /src\s*=\s*["']?data:/gi,
  
  // HTML injection patterns
  HTML_TAG: /<\/?[a-zA-Z][^<>]*>/gi,
  HTML_SCRIPT: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  HTML_IFRAME: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  HTML_OBJECT: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  
  // SQL injection patterns
  SQL_INJECTION: /(?:'|\"|;|\|\||--|\*|\/|\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/gi,
  
  // Path traversal patterns
  PATH_TRAVERSAL: /\.\.\/|\.\.\\|\/|\./gi,
  
  // Email validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // URL validation
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  
  // Address validation (Ethereum address)
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  
  // Amount validation (ETH amounts)
  ETH_AMOUNT: /^0x[0-9a-fA-F]{0,64}$|^[0-9]*\.?[0-9]*$/,
  
  // Phone number validation
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  
  // Strong password validation
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
}

/**
 * Sanitize and validate input to prevent XSS and injection attacks
 */
export function sanitizeInput(
  input: string, 
  config: SecurityConfig = {}
): ValidationResult {
  const {
    maxLength = VALIDATION.MAX_INPUT_LENGTH,
    allowedChars,
    disallowedPatterns = [
      SECURITY_PATTERNS.XSS_SCRIPT,
      SECURITY_PATTERNS.XSS_EVENT,
      SECURITY_PATTERNS.XSS_JAVASCRIPT,
      SECURITY_PATTERNS.XSS_VBSCRIPT,
      SECURITY_PATTERNS.HTML_TAG,
      SECURITY_PATTERNS.SQL_INJECTION,
    ],
    allowHTML = false,
    strictMode = false
  } = config

  const errors: string[] = []

  // Check if input is string
  if (typeof input !== 'string') {
    return {
      isValid: false,
      errors: ['Input must be a string']
    }
  }

  // Check length
  if (input.length === 0) {
    return {
      isValid: false,
      errors: ['Input cannot be empty']
    }
  }

  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`)
  }

  // Check for null bytes
  if (input.includes('\0')) {
    errors.push('Input contains null bytes')
  }

  // Validate allowed characters
  if (allowedChars && !allowedChars.test(input)) {
    errors.push('Input contains invalid characters')
  }

  // Check disallowed patterns
  let sanitized = input
  
  if (!allowHTML) {
    // Remove HTML tags and potential XSS
    sanitized = sanitized
      .replace(SECURITY_PATTERNS.HTML_TAG, '')
      .replace(SECURITY_PATTERNS.XSS_EVENT, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
  }

  // Apply additional security patterns
  for (const pattern of disallowedPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Input contains potentially malicious content')
      sanitized = sanitized.replace(pattern, '')
    }
  }

  // Strict mode additional validation
  if (strictMode) {
    // Additional patterns for strict mode
    const strictPatterns = [
      SECURITY_PATTERNS.PATH_TRAVERSAL,
      /\beval\s*\(/gi,
      /\bsetTimeout\s*\(/gi,
      /\bsetInterval\s*\(/gi,
    ]

    for (const pattern of strictPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('Input contains forbidden content for strict mode')
        sanitized = sanitized.replace(pattern, '')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitized.trim()
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const result = sanitizeInput(email, {
    maxLength: VALIDATION.MAX_EMAIL_LENGTH, // RFC 5321 limit
    allowedChars: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  })

  if (!result.isValid) {
    return result
  }

  if (!SECURITY_PATTERNS.EMAIL.test(email)) {
    return {
      isValid: false,
      errors: ['Invalid email format']
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: email.toLowerCase().trim()
  }
}

/**
 * Validate URL for security
 */
export function validateUrl(url: string): ValidationResult {
  const result = sanitizeInput(url, {
    maxLength: VALIDATION.MAX_URL_LENGTH,
    strictMode: true
  })

  if (!result.isValid) {
    return result
  }

  // Only allow HTTP and HTTPS
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      isValid: false,
      errors: ['Only HTTP and HTTPS URLs are allowed']
    }
  }

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'ftp:']
  for (const protocol of dangerousProtocols) {
    if (url.toLowerCase().startsWith(protocol)) {
      return {
        isValid: false,
        errors: [`Dangerous protocol not allowed: ${protocol}`]
      }
    }
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    return {
      isValid: false,
      errors: ['Invalid URL format']
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: url.trim()
  }
}

/**
 * Validate Ethereum address
 */
export function validateEthereumAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      errors: ['Address is required']
    }
  }

  // Remove whitespace
  const cleanAddress = address.trim()

  if (!SECURITY_PATTERNS.ETHEREUM_ADDRESS.test(cleanAddress)) {
    return {
      isValid: false,
      errors: ['Invalid Ethereum address format']
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: cleanAddress.toLowerCase()
  }
}

/**
 * Validate ETH amount
 */
export function validateEthAmount(amount: string, maxAmount?: number): ValidationResult {
  if (!amount || typeof amount !== 'string') {
    return {
      isValid: false,
      errors: ['Amount is required']
    }
  }

  // Remove whitespace
  const cleanAmount = amount.trim()

  // Check if it's a valid number
  const numAmount = Number(cleanAmount)
  if (isNaN(numAmount) || numAmount < 0) {
    return {
      isValid: false,
      errors: ['Amount must be a valid positive number']
    }
  }

  // Check decimal places (max 18 for ETH)
  if (cleanAmount.includes('.') && cleanAmount.split('.')[1].length > 18) {
    return {
      isValid: false,
      errors: ['Amount cannot have more than 18 decimal places']
    }
  }

  // Check max amount if provided
  if (maxAmount && numAmount > maxAmount) {
    return {
      isValid: false,
      errors: [`Amount cannot exceed ${maxAmount}`]
    }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: cleanAmount
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return ''
  }

  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Safely render content that might contain HTML
 */
export function safeHtml(html: string): string {
  // First sanitize the input
  const result = sanitizeInput(html, { allowHTML: false })
  
  if (!result.isValid) {
    throw new Error('HTML content contains unsafe elements')
  }

  // Basic HTML tag whitelist
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'span', 'div']
  const allowedAttributes = ['class', 'style']
  
  // Simple HTML parser - in production, use a proper library like DOMPurify
  let safeHtml = result.sanitized || ''
  
  // Remove all HTML tags first
  safeHtml = safeHtml.replace(SECURITY_PATTERNS.HTML_TAG, '')
  
  // Only allow specific safe tags
  allowedTags.forEach(tag => {
    const tagRegex = new RegExp(`<${tag}[^>]*>`, 'gi')
    safeHtml = safeHtml.replace(tagRegex, '')
    const closeTagRegex = new RegExp(`</${tag}>`, 'gi')
    safeHtml = safeHtml.replace(closeTagRegex, '')
  })

  return safeHtml
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(VALIDATION.CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}

/**
 * Check if content is likely malicious
 */
export function detectMaliciousContent(content: string): {
  isSuspicious: boolean
  reasons: string[]
  riskLevel: 'low' | 'medium' | 'high'
} {
  const reasons: string[] = []
  let score = 0

  // Check for common XSS patterns
  if (SECURITY_PATTERNS.XSS_SCRIPT.test(content)) {
    reasons.push('Contains script tags')
    score += 10
  }

  if (SECURITY_PATTERNS.XSS_EVENT.test(content)) {
    reasons.push('Contains event handlers')
    score += 8
  }

  if (SECURITY_PATTERNS.HTML_TAG.test(content)) {
    reasons.push('Contains HTML tags')
    score += 5
  }

  // Check for SQL injection patterns
  if (SECURITY_PATTERNS.SQL_INJECTION.test(content)) {
    reasons.push('Contains SQL injection patterns')
    score += 10
  }

  // Check for suspicious URLs
  const urlRegex = /https?:\/\/[^\s]+/g
  const urls = content.match(urlRegex)
  if (urls) {
    urls.forEach(url => {
      if (!SECURITY_PATTERNS.URL.test(url)) {
        reasons.push('Contains invalid URL')
        score += 3
      }
    })
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (score >= VALIDATION.CRITICAL_ALERT_THRESHOLD) {
    riskLevel = 'high'
  } else if (score >= VALIDATION.MEDIUM_ALERT_THRESHOLD) {
    riskLevel = 'medium'
  }

  return {
    isSuspicious: score > 0,
    reasons,
    riskLevel
  }
}

/**
 * Secure random string generation
 */
export function generateSecureId(length: number = VALIDATION.SECURE_ID_DEFAULT_LENGTH): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => (byte % 36).toString(36)).join('')
}

/**
 * Rate limiting check (simple implementation)
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()
  
  isAllowed(key: string, maxAttempts: number = VALIDATION.RATE_LIMIT_DEFAULT_ATTEMPTS, windowMs: number = VALIDATION.RATE_LIMIT_DEFAULT_WINDOW): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= maxAttempts) {
      return false
    }
    
    record.count++
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// ============================================================================
// Local Storage Encryption Utilities
// ============================================================================

/**
 * Generate an encryption key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Encrypt data for local storage
 */
export async function encryptForStorage(data: string, password: string): Promise<string> {
  const salt = generateSalt()
  const key = await deriveKey(password, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )
  
  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt data from local storage
 */
export async function decryptFromStorage(encryptedData: string, password: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encrypted = combined.slice(28)
    
    const key = await deriveKey(password, salt)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch {
    console.error('Failed to decrypt data from storage')
    return null
  }
}

/**
 * Securely store data in local storage with encryption
 */
export async function secureStorageSet<T>(
  key: string, 
  value: T, 
  password: string,
  storage: Storage = localStorage
): Promise<void> {
  const data = JSON.stringify(value)
  const encrypted = await encryptForStorage(data, password)
  storage.setItem(key, encrypted)
}

/**
 * Securely retrieve data from local storage with decryption
 */
export async function secureStorageGet<T>(
  key: string, 
  password: string,
  storage: Storage = localStorage
): Promise<T | null> {
  const encrypted = storage.getItem(key)
  if (!encrypted) return null
  
  const decrypted = await decryptFromStorage(encrypted, password)
  if (!decrypted) return null
  
  try {
    return JSON.parse(decrypted) as T
  } catch {
    console.error('Failed to parse decrypted data')
    return null
  }
}

/**
 * Remove data from secure local storage
 */
export function secureStorageRemove(
  key: string,
  storage: Storage = localStorage
): void {
  storage.removeItem(key)
}

/**
 * Check if encrypted data exists in local storage
 */
export function secureStorageHas(
  key: string,
  storage: Storage = localStorage
): boolean {
  return storage.getItem(key) !== null
}

/**
 * Hash data for secure storage comparison (one-way)
 */
export async function hashForComparison(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}