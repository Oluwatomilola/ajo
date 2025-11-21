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

export function SaveForLater({ savedStates, onLoadState, onDeleteState }: SaveForLaterProps) {
  if (savedStates.length === 0) {
    return (
      <div className="saved-states empty">
        <p>No saved states yet. Save your current setup to get started.</p>
      </div>
    )
  }

  return (
    <div className="saved-states">
      <h3>Saved States</h3>
      <div className="saved-states-grid">
        {savedStates.map((state) => (
          <div key={state.id} className="saved-state-card">
            <div className="saved-state-header">
              <h4>{state.name}</h4>
              <div className="saved-state-actions">
                <button 
                  className="load-button"
                  onClick={() => onLoadState(state)}
                >
                  Load
                </button>
                <button 
                  className="delete-button"
                  onClick={() => onDeleteState(state.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="saved-state-details">
              <div>
                <span>Amount:</span>
                <span>{parseFloat(state.amount).toFixed(4)} ETH</span>
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
          </div>
        ))}
      </div>
    </div>
  )
}
