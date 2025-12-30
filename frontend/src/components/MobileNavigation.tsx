import { useState, useEffect } from 'react'

interface MobileNavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  isAdmin?: boolean
}

export function MobileNavigation({ currentPage, onPageChange, isAdmin = false }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'wallet', label: 'Wallet', icon: '🔗' },
  ]

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin', icon: '👑' })
  }

  if (process.env.NODE_ENV === 'development') {
    menuItems.push({ id: 'debug', label: 'Debug', icon: '🔧' })
  }

  const handlePageChange = (page: string) => {
    onPageChange(page)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className={`hamburger ${isOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}>
        <nav className="mobile-nav">
          <div className="mobile-nav-header">
            <h3>Navigation</h3>
            <button 
              className="mobile-nav-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
            >
              ×
            </button>
          </div>
          
          <ul className="mobile-nav-list">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => handlePageChange(item.id)}
                >
                  <span className="mobile-nav-icon">{item.icon}</span>
                  <span className="mobile-nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}

// Hook for detecting mobile screens
export function useMobileNav() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  return isMobile
}