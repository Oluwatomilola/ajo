import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/Button'
import '../styles/errorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: '',
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught an Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Error ID:', this.state.errorId)
      console.groupEnd()
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      const { 
        fallback, 
        level = 'component', 
        showDetails = process.env.NODE_ENV === 'development' 
      } = this.props

      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Component-level error boundary (minimal UI)
      if (level === 'component') {
        return (
          <div className="error-boundary error-boundary--component">
            <p className="error-boundary__message">
              Something went wrong with this component.
            </p>
            <Button onClick={this.handleRetry} variant="secondary" size="sm">
              Try Again
            </Button>
          </div>
        )
      }

      // Page-level error boundary (full page)
      if (level === 'page') {
        return (
          <div className="error-boundary error-boundary--page">
            <div className="error-boundary__content">
              <h1 className="error-boundary__title">Oops! Something went wrong</h1>
              <p className="error-boundary__message">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
              <div className="error-boundary__actions">
                <Button onClick={this.handleRetry} variant="primary">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="secondary">
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        )
      }

      // Critical error boundary (full app)
      return (
        <div className="error-boundary error-boundary--critical">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h1 className="error-boundary__title">Critical Error</h1>
            <p className="error-boundary__message">
              A critical error has occurred and the application cannot continue. 
              Please refresh the page or contact technical support.
            </p>
            <div className="error-boundary__actions">
              <Button onClick={this.handleReload} variant="primary">
                Reload Application
              </Button>
            </div>
            {showDetails && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-boundary__error-details">
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  <p><strong>Message:</strong> {this.state.error.message}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="error-boundary__stack">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p><strong>Component Stack:</strong></p>
                      <pre className="error-boundary__stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for manual error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = React.useState<ErrorInfo | null>(null)

  const captureError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    setError(error)
    if (errorInfo) {
      setErrorInfo(errorInfo)
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Manual error capture:', error, errorInfo)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
    setErrorInfo(null)
  }, [])

  return { error, errorInfo, captureError, clearError }
}

export default ErrorBoundary