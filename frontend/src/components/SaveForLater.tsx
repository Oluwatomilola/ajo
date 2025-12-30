import { formatDistanceToNow } from 'date-fns'

interface SavedState {
  id: string;
  name: string;
  amount: string;
  unlockTime: number;
  date: string;
}

interface SaveForLaterProps {
  savedStates: SavedState[];
  onLoadState: (state: SavedState) => void;
  onDeleteState: (id: string) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ComponentState {
  loading: boolean;
  errors: ValidationError[];
  expandedCard: string | null;
}

/**
 * Validates saved state data integrity and format
 */
function validateSavedState(state: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate ID
  if (!state.id || typeof state.id !== 'string' || state.id.trim().length === 0) {
    errors.push({ field: 'id', message: 'Invalid or missing state ID' });
  }

  // Validate name
  if (!state.name || typeof state.name !== 'string' || state.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'State name is required' });
  } else if (state.name.length > 100) {
    errors.push({ field: 'name', message: 'State name too long (max 100 characters)' });
  }

  // Validate amount
  if (!state.amount || typeof state.amount !== 'string') {
    errors.push({ field: 'amount', message: 'Invalid amount format' });
  } else {
    const numAmount = parseFloat(state.amount);
    if (isNaN(numAmount) || numAmount < 0) {
      errors.push({ field: 'amount', message: 'Amount must be a valid positive number' });
    } else if (numAmount > 1000000) { // 1M ETH max reasonable limit
      errors.push({ field: 'amount', message: 'Amount exceeds reasonable limit' });
    }
  }

  // Validate unlockTime
  if (typeof state.unlockTime !== 'number' || state.unlockTime <= 0) {
    errors.push({ field: 'unlockTime', message: 'Invalid unlock time' });
  } else if (state.unlockTime > Date.now() / 1000 + 365 * 24 * 60 * 60 * 10) { // Max 10 years from now
    errors.push({ field: 'unlockTime', message: 'Unlock time too far in the future' });
  }

  // Validate date
  if (!state.date || typeof state.date !== 'string') {
    errors.push({ field: 'date', message: 'Invalid save date' });
  } else {
    const parsedDate = new Date(state.date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'date', message: 'Invalid date format' });
    } else if (parsedDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) { // Saved date can't be more than 1 day in future
      errors.push({ field: 'date', message: 'Save date cannot be in the future' });
    }
  }

  return errors;
}

/**
 * Sanitizes saved state data to prevent XSS and data corruption
 */
function sanitizeSavedState(state: any): SavedState | null {
  try {
    // Create a clean copy with proper typing
    const sanitized: SavedState = {
      id: String(state.id || '').trim(),
      name: String(state.name || '').trim(),
      amount: String(state.amount || '0').trim(),
      unlockTime: Number(state.unlockTime) || 0,
      date: String(state.date || new Date().toISOString())
    };

    // Additional sanitization for potentially dangerous content
    sanitized.name = sanitized.name.replace(/[<>\"'&]/g, ''); // Remove potential XSS characters
    
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing saved state:', error);
    return null;
  }
}

export function SaveForLater({ savedStates, onLoadState, onDeleteState }: SaveForLaterProps) {
  const [componentState, setComponentState] = React.useState<ComponentState>({
    loading: false,
    errors: [],
    expandedCard: null
  });

  /**
   * Validates all saved states and filters out invalid ones
   */
  const validatedStates = React.useMemo(() => {
    const validStates: SavedState[] = [];
    const validationErrors: ValidationError[] = [];

    savedStates.forEach((state, index) => {
      const sanitized = sanitizeSavedState(state);
      if (!sanitized) {
        validationErrors.push({
          field: `state_${index}`,
          message: `Failed to sanitize state data`
        });
        return;
      }

      const errors = validateSavedState(sanitized);
      if (errors.length > 0) {
        validationErrors.push(...errors.map(error => ({
          ...error,
          field: `${error.field}_${index}`
        })));
      } else {
        validStates.push(sanitized);
      }
    });

    setComponentState(prev => ({ ...prev, errors: validationErrors }));
    return validStates;
  }, [savedStates]);

  /**
   * Handles loading a saved state with error handling
   */
  const handleLoadState = async (state: SavedState) => {
    setComponentState(prev => ({ ...prev, loading: true, errors: [] }));

    try {
      // Validate the state one more time before loading
      const errors = validateSavedState(state);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
      }

      await onLoadState(state);
    } catch (error) {
      console.error('Error loading saved state:', error);
      setComponentState(prev => ({
        ...prev,
        loading: false,
        errors: [{
          field: 'load',
          message: error instanceof Error ? error.message : 'Failed to load state'
        }]
      }));
    } finally {
      setComponentState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Handles deleting a saved state with error handling
   */
  const handleDeleteState = async (id: string) => {
    setComponentState(prev => ({ ...prev, loading: true, errors: [] }));

    try {
      if (!id || id.trim().length === 0) {
        throw new Error('Invalid state ID');
      }
      await onDeleteState(id.trim());
    } catch (error) {
      console.error('Error deleting saved state:', error);
      setComponentState(prev => ({
        ...prev,
        loading: false,
        errors: [{
          field: 'delete',
          message: error instanceof Error ? error.message : 'Failed to delete state'
        }]
      }));
    } finally {
      setComponentState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Toggles expanded state for a card
   */
  const toggleCardExpansion = (id: string) => {
    setComponentState(prev => ({
      ...prev,
      expandedCard: prev.expandedCard === id ? null : id
    }));
  };

  if (validatedStates.length === 0 && savedStates.length === 0) {
    return (
      <div className="saved-states empty">
        <p>No saved states yet. Save your current setup to get started.</p>
      </div>
    );
  }

  // Show validation errors if any
  const hasValidationErrors = componentState.errors.length > 0;

  return (
    <div className="saved-states">
      <div className="saved-states-header">
        <h3>Saved States</h3>
        {componentState.loading && (
          <div className="loading-indicator">
            <span>Processing...</span>
          </div>
        )}
      </div>

      {hasValidationErrors && (
        <div className="validation-errors">
          <h4>⚠️ Data Issues Detected</h4>
          <ul>
            {componentState.errors.slice(0, 5).map((error, index) => (
              <li key={index}>
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
            {componentState.errors.length > 5 && (
              <li>... and {componentState.errors.length - 5} more errors</li>
            )}
          </ul>
        </div>
      )}

      <div className="saved-states-grid">
        {validatedStates.map((state) => (
          <div key={state.id} className="saved-state-card">
            <div className="saved-state-header">
              <h4>{state.name}</h4>
              <div className="saved-state-actions">
                <button 
                  className="load-button"
                  onClick={() => handleLoadState(state)}
                  disabled={componentState.loading}
                >
                  {componentState.loading ? 'Loading...' : 'Load'}
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteState(state.id)}
                  disabled={componentState.loading}
                >
                  Delete
                </button>
                <button
                  className="expand-button"
                  onClick={() => toggleCardExpansion(state.id)}
                >
                  {componentState.expandedCard === state.id ? '−' : '+'}
                </button>
              </div>
            </div>
            
            <div className="saved-state-details">
              <div>
                <span>Amount:</span>
                <span>
                  {(() => {
                    const numAmount = parseFloat(state.amount);
                    return isNaN(numAmount) ? 'Invalid amount' : `${numAmount.toFixed(4)} ETH`;
                  })()}
                </span>
              </div>
              <div>
                <span>Unlocks in:</span>
                <span>
                  {formatDistanceToNow(new Date(state.unlockTime * 1000), { addSuffix: true })}
                </span>
              </div>
              <div>
                <span>Saved:</span>
                <span>{formatDistanceToNow(new Date(state.date), { addSuffix: true })}</span>
              </div>
            </div>

            {componentState.expandedCard === state.id && (
              <div className="saved-state-expanded">
                <div className="expanded-details">
                  <div>
                    <strong>State ID:</strong>
                    <code>{state.id}</code>
                  </div>
                  <div>
                    <strong>Unlock Time (Unix):</strong>
                    <code>{state.unlockTime}</code>
                  </div>
                  <div>
                    <strong>Save Date:</strong>
                    <code>{state.date}</code>
                  </div>
                  <div>
                    <strong>Amount (Raw):</strong>
                    <code>{state.amount}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {validatedStates.length === 0 && savedStates.length > 0 && (
        <div className="no-valid-states">
          <p>⚠️ All saved states have validation errors and were filtered out.</p>
          <p>Try clearing your browser storage and saving fresh states.</p>
        </div>
      )}
    </div>
  )
}

// Import React for useState and useMemo
import React from 'react';
