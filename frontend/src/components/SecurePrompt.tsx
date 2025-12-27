import { useState, useEffect } from 'react';

interface SecurePromptProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  maxLength?: number;
}

export function SecurePrompt({
  isOpen,
  title,
  message,
  placeholder = 'Enter value...',
  initialValue = '',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  maxLength = 100,
}: SecurePromptProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  // Escape HTML to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/[<>'"&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          '&': '&amp;',
        };
        return entities[match];
        const entities: Record<string, string> = {
          '<': '<',
          '>': '>',
          '"': '"',
          "'": ''',
          '&': '&',
        };
        return entities[match];
      })
      .trim()
      .substring(0, maxLength);
  };

  const handleConfirm = () => {
    const sanitized = sanitizeInput(inputValue);
    if (sanitized.length > 0) {
      onConfirm(sanitized);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="secure-prompt-overlay">
      <div className="secure-prompt-modal">
        <div className="secure-prompt-header">
          <h3>{title}</h3>
        </div>
        
        <div className="secure-prompt-body">
          <p>{message}</p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus
            className="secure-prompt-input"
          />
        </div>
        
        <div className="secure-prompt-footer">
          <button onClick={onCancel} className="secure-prompt-btn secondary">
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            className="secure-prompt-btn primary"
            disabled={!sanitizeInput(inputValue)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for using secure prompts
export function useSecurePrompt() {
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    initialValue?: string;
    maxLength?: number;
    resolve?: (value: string) => void;
    reject?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showPrompt = (options: {
    title: string;
    message: string;
    placeholder?: string;
    initialValue?: string;
    maxLength?: number;
  }): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPromptState({
        isOpen: true,
        title: options.title,
        message: options.message,
        placeholder: options.placeholder,
        initialValue: options.initialValue,
        maxLength: options.maxLength || 100,
        resolve,
        reject,
      });
    });
  };

  const handleConfirm = (value: string) => {
    if (promptState.resolve) {
      promptState.resolve(value);
    }
    setPromptState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (promptState.reject) {
      promptState.reject(new Error('User cancelled'));
    }
    setPromptState(prev => ({ ...prev, isOpen: false }));
  };

  const PromptComponent = (
    <SecurePrompt
      isOpen={promptState.isOpen}
      title={promptState.title}
      message={promptState.message}
      placeholder={promptState.placeholder}
      initialValue={promptState.initialValue}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      maxLength={promptState.maxLength}
    />
  );

  return {
    showPrompt,
    PromptComponent,
  };
}