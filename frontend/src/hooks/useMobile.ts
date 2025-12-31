import { useState, useEffect, useRef } from 'react'
import { VALIDATION } from '../constants/appConstants'

/**
 * Custom hook for mobile device detection and responsive behavior
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setIsMobile(width <= VALIDATION.MOBILE_BREAKPOINT)
      setIsTablet(width > VALIDATION.MOBILE_BREAKPOINT && width <= VALIDATION.TABLET_BREAKPOINT)
      setScreenSize({ width, height })
    }

    // Initial check
    checkScreenSize()

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    isLandscape: screenSize.width > screenSize.height,
    isPortrait: screenSize.width <= screenSize.height,
  }
}

/**
 * Hook for touch device detection
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy support
        navigator.msMaxTouchPoints > 0
      )
    }

    checkTouchDevice()
  }, [])

  return isTouchDevice
}

/**
 * Hook for managing mobile orientation changes
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return orientation
}

/**
 * Hook for mobile viewport management
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    vh: typeof window !== 'undefined' ? window.innerHeight * 0.01 : 0,
  })

  useEffect(() => {
    let isActive = true

    const updateViewport = () => {
      if (!isActive) return
      
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        vh: window.innerHeight * 0.01,
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)

    return () => {
      isActive = false
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  // Set CSS custom property for 100vh fix on mobile
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--vh', `${viewport.vh}px`)
    }
  }, [viewport.vh])

  return viewport
}

/**
 * Hook for mobile keyboard detection
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    let isActive = true

    const handleResize = () => {
      if (!isActive) return
      
      // This is a simple heuristic for detecting mobile keyboard
      const isMobile = window.innerWidth <= VALIDATION.MOBILE_BREAKPOINT
      if (isMobile) {
        const viewportHeight = window.visualViewport?.height || window.innerHeight
        const windowHeight = window.innerHeight
        const heightDiff = windowHeight - viewportHeight
        
        setKeyboardHeight(heightDiff > VALIDATION.KEYBOARD_HEIGHT_THRESHOLD ? heightDiff : 0)
      }
    }

    // Use visualViewport API if available (better support)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => {
        isActive = false
        window.visualViewport?.removeEventListener('resize', handleResize)
      }
    } else {
      window.addEventListener('resize', handleResize)
      return () => {
        isActive = false
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return keyboardHeight
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => void) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canPull, setCanPull] = useState(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let startY = 0
    let currentY = 0
    let pullStartY = 0
    let isActive = true

    const handleTouchStart = (e: TouchEvent) => {
      if (!isActive) return
      startY = e.touches[0].clientY
      pullStartY = startY
      
      // Only allow pull-to-refresh when at the top
      if (window.scrollY === 0) {
        setCanPull(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive || !canPull || isRefreshing) return

      currentY = e.touches[0].clientY
      const pullDelta = currentY - pullStartY

      if (pullDelta > 0 && window.scrollY === 0) {
        // Limit pull distance to 80px
        const distance = Math.min(pullDelta, VALIDATION.PULL_TO_REFRESH_THRESHOLD)
        setPullDistance(distance)
        
        // Prevent default scrolling behavior
        if (distance > VALIDATION.PULL_TO_REFRESH_PREVENT_SCROLL) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (!isActive || !canPull || isRefreshing) return

      if (pullDistance >= VALIDATION.PULL_TO_REFRESH_THRESHOLD) {
        setIsRefreshing(true)
        onRefresh()
        
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }
        
        // Reset after refresh completes
        refreshTimeoutRef.current = setTimeout(() => {
          if (isActive) {
            setIsRefreshing(false)
            setPullDistance(0)
          }
        }, 1000)
      }

      setPullDistance(0)
      setCanPull(false)
    }

    const cleanup = () => {
      isActive = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      cleanup()
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh])

  return {
    pullDistance,
    isRefreshing,
    canPull,
  }
}