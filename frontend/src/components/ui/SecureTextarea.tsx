import React, { TextareaHTMLAttributes, useState, useCallback, useEffect } from 'react'
import { sanitizeInput, ValidationResult, detectMaliciousContent } from '../../utils/security'

interface SecureTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: string
  value: string
  onChange: (value: string, isValid: boolean) => void
  maxLength?: number
  showValidation?: boolean
  securityMode?: 'normal' | 'strict'
  placeholder?: string
  error?: string
  helperText?: string
  rows?: number
}

export function SecureTextarea({
  label,
  value,
  onChange,
  maxLength = 5000,
  showValidation = true,
  securityMode = 'normal',
  placeholder,
  error: externalError,
  helperText,
  rows = 4,
  className = '',
  ...props
}: SecureTextareaProps) {
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
      const result = sanitizeInput(input, { 
        maxLength, 
        strictMode: securityMode === 'strict'
      })

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
  }, [maxLength, securityMode, onChange, validationTimeout])

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    debouncedValidation(newValue)
  }, [debouncedValidation])

  // Handle focus
  const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }, [props.onFocus])

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
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
    w-full px-3 py-2 border rounded-lg transition-colors duration-200 resize-vertical
    focus:outline-none focus:ring-2 focus:ring-offset-1
    ${getValidationStyles()}
    ${className}
  `.trim()

  const labelId = `secure-textarea-${Math.random().toString(36).substr(2, 9)}`
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
      
      <textarea
        {...props}
        id={labelId}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
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
      
      {/* Character count */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {getValidationMessage() && (
            <span className={externalError || (!isFocused && !validation.isValid) ? 'text-red-600' : ''}>
              {getValidationMessage()}
            </span>
          )}
        </span>
        <span>
          {internalValue.length} / {maxLength}
        </span>
      </div>
      
      {/* Security indicators */}
      {showValidation && (
        <div className="flex items-center space-x-2 text-xs">
          {validation.isValid && internalValue && (
            <span className="flex items-center text-green-600">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Valid
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