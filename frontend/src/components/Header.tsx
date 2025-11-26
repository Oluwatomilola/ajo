import { useAccount } from 'wagmi';
import { MESSAGES } from '../constants/uxCopy';

export function Header() {
  const { address, isConnected } = useAccount();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>🐷 {MESSAGES.WELCOME}</h1>
          <p className="tagline">{MESSAGES.TAGLINE}</p>
        </div>

        <div className="wallet-section">
          {isConnected && address && (
            <div className="connected-info">
              <span className="address-badge" title="Wallet Address">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
          <appkit-button />
        </div>
      </div>
    </header>
  );
}
