import React, { InputHTMLAttributes, useState, useCallback, useEffect } from 'react'
import { sanitizeInput, ValidationResult, validateEmail, validateEthereumAddress, validateEthAmount, detectMaliciousContent } from '../../utils/security'

interface SecureInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  value: string
  onChange: (value: string, isValid: boolean) => void
  validationType?: 'text' | 'email' | 'address' | 'amount' | 'url' | 'password'
  maxLength?: number
  showValidation?: boolean
  securityMode?: 'normal' | 'strict'
  placeholder?: string
  error?: string
  helperText?: string
}

export function SecureInput({
  label,
  value,
  onChange,
  validationType = 'text',
  maxLength = 1000,
  showValidation = true,
  securityMode = 'normal',
  placeholder,
  error: externalError,
  helperText,
  className = '',
  ...props
}: SecureInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] })
  const [isFocused, setIsFocused] = useState(false)
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null)

  // Debounced validation
  const debouncedValidation = useCallback((input: string) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }

    const timeout = setTimeout(() => {
      let result: ValidationResult

      switch (validationType) {
        case 'email':
          result = validateEmail(input)
          break
        case 'address':
          result = validateEthereumAddress(input)
          break
        case 'amount':
          result = validateEthAmount(input)
          break
        case 'url':
          result = validateUrl(input)
          break
        case 'password':
          result = sanitizeInput(input, { maxLength, strictMode: securityMode === 'strict' })
          break
        default:
          result = sanitizeInput(input, { 
            maxLength, 
            strictMode: securityMode === 'strict',
            allowedChars: validationType === 'text' ? undefined : /^[a-zA-Z0-9\s\.\-_@]+$/
          })
      }

      setValidation(result)
      
      // Check for malicious content
      const maliciousDetection = detectMaliciousContent(input)
      if (maliciousDetection.isSuspicious && maliciousDetection.riskLevel === 'high') {
        setValidation({
          isValid: false,
          errors: [...result.errors, 'Content flagged as potentially malicious'],
          sanitized: result.sanitized
        })
      }

      onChange(result.sanitized || input, result.isValid && !maliciousDetection.isSuspicious)
    }, 300)

    setValidationTimeout(timeout)
  }, [validationType, maxLength, securityMode, onChange, validationTimeout])

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    debouncedValidation(newValue)
  }, [debouncedValidation])

  // Handle focus
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }, [props.onFocus])

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    props.onBlur?.(e)
  }, [props.onBlur])

  // Update internal value when prop value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout)
      }
    }
  }, [validationTimeout])

  // Get validation styles
  const getValidationStyles = () => {
    if (!showValidation) return ''
    
    if (externalError || (!isFocused && !validation.isValid)) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500'
    }
    
    if (!isFocused && validation.isValid && internalValue) {
      return 'border-green-500 focus:border-green-500 focus:ring-green-500'
    }
    
    return ''
  }

  // Get validation message
  const getValidationMessage = () => {
    if (externalError) {
      return externalError
    }
    
    if (!isFocused && !validation.isValid && validation.errors.length > 0) {
      return validation.errors[0]
    }
    
    return helperText
  }

  const baseClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1
    ${getValidationStyles()}
    ${className}
  `.trim()

  const labelId = `secure-input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${labelId}-error`
  const helperId = `${labelId}-helper`

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={labelId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <input
        {...props}
        id={labelId}
        type={props.type || (validationType === 'password' ? 'password' : 'text')}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={validationType === 'password' ? undefined : maxLength}
        className={baseClasses}
        aria-describedby={
          externalError || (!isFocused && !validation.isValid && validation.errors.length > 0)
            ? errorId
            : helperText
            ? helperId
            : undefined
        }
        aria-invalid={
          externalError || (!isFocused && !validation.isValid && validation.errors.length > 0)
            ? true
            : false
        }
      />
      
      {getValidationMessage() && (
        <p 
          id={externalError || (!isFocused && !validation.isValid) ? errorId : helperId}
          className={`text-sm ${
            externalError || (!isFocused && !validation.isValid)
              ? 'text-red-600'
              : 'text-gray-500'
          }`}
        >
          {getValidationMessage()}
        </p>
      )}
      
      {/* Security indicators */}
      {showValidation && validationType !== 'password' && (
        <div className="flex items-center space-x-2 text-xs">
          {validation.isValid && internalValue && (
            <span className="flex items-center text-green-600">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Valid
            </span>
          )}
          
          {validationType === 'amount' && validation.isValid && internalValue && (
            <span className="text-blue-600">
              {Number(internalValue).toFixed(4)} ETH
            </span>
          )}
          
          {securityMode === 'strict' && (
            <span className="flex items-center text-orange-600">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Strict Mode
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Utility function for URL validation (needed by SecureInput)
function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      errors: ['URL is required']
    }
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