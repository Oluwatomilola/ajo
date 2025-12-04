/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'render' | 'api' | 'interaction' | 'network'
}

// Performance monitoring cache
const performanceMetrics: PerformanceMetric[] = []

/**
 * Marks the start of a performance measurement
 */
export function markPerformanceStart(name: string): () => void {
  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category: 'interaction'
    })
    
    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * Records a performance metric
 */
function recordMetric(metric: PerformanceMetric) {
  performanceMetrics.push(metric)
  
  // Keep only last 100 metrics to prevent memory issues
  if (performanceMetrics.length > 100) {
    performanceMetrics.shift()
  }
}

/**
 * Gets performance metrics for a specific category
 */
export function getPerformanceMetrics(category?: string): PerformanceMetric[] {
  return category 
    ? performanceMetrics.filter(m => m.category === category)
    : [...performanceMetrics]
}

/**
 * Calculates average performance for a specific metric
 */
export function getAverageMetric(name: string, category?: string): number {
  const metrics = getPerformanceMetrics(category)
    .filter(m => m.name === name)
  
  if (metrics.length === 0) return 0
  
  const sum = metrics.reduce((acc, m) => acc + m.value, 0)
  return sum / metrics.length
}

/**
 * React hook for performance monitoring in components
 */
export function usePerformanceMonitor(componentName: string) {
  const startRender = performance.now()
  
  // Use cleanup function to measure render time
  const endRender = () => {
    const renderTime = performance.now() - startRender
    recordMetric({
      name: `${componentName}_render`,
      value: renderTime,
      timestamp: Date.now(),
      category: 'render'
    })
  }
  
  return { endRender }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(null, args)
    }
  }
}

/**
 * Lazy load function with performance tracking
 */
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000 // 5 minutes
) {
  let cache: { data: T; timestamp: number } | null = null
  
  return async (): Promise<T> => {
    const now = Date.now()
    
    // Return cached data if still valid
    if (cache && now - cache.timestamp < cacheTime) {
      return cache.data
    }
    
    const loadEnd = markPerformanceStart('lazy_load')
    
    try {
      const data = await loader()
      cache = { data, timestamp: now }
      return data
    } finally {
      loadEnd()
    }
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    return {
      usedJSHeapSize: memInfo.usedJSHeapSize,
      totalJSHeapSize: memInfo.totalJSHeapSize,
      jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
      usagePercentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
    }
  }
  return null
}

/**
 * Performance optimization suggestions
 */
export function getPerformanceSuggestions(): string[] {
  const suggestions: string[] = []
  
  // Check render performance
  const renderMetrics = getPerformanceMetrics('render')
  const avgRenderTime = getAverageMetric('_render', 'render')
  
  if (avgRenderTime > 16) { // 60fps = 16.67ms per frame
    suggestions.push('Component render times are slow. Consider using React.memo or useMemo.')
  }
  
  // Check memory usage
  const memoryInfo = getMemoryUsage()
  if (memoryInfo && memoryInfo.usagePercentage > 80) {
    suggestions.push('High memory usage detected. Consider cleaning up unused data.')
  }
  
  // Check slow interactions
  const interactionMetrics = getPerformanceMetrics('interaction')
  const slowInteractions = interactionMetrics.filter(m => m.value > 100)
  
  if (slowInteractions.length > 5) {
    suggestions.push('Multiple slow interactions detected. Consider debouncing or optimizing event handlers.')
  }
  
  return suggestions
}

/**
 * Performance report generator
 */
export function generatePerformanceReport(): string {
  const memoryInfo = getMemoryUsage()
  const suggestions = getPerformanceSuggestions()
  
  const report = [
    '=== PERFORMANCE REPORT ===',
    '',
    'Memory Usage:',
    memoryInfo ? 
      `  Used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` :
      '  Not available',
    '',
    'Average Render Times:',
    ...getPerformanceMetrics('render').reduce((acc, metric) => {
      const existing = acc.find(item => item.name === metric.name)
      if (!existing) {
        acc.push({
          name: metric.name,
          total: metric.value,
          count: 1,
          avg: metric.value
        })
      } else {
        existing.total += metric.value
        existing.count += 1
        existing.avg = existing.total / existing.count
      }
      return acc
    }, [] as { name: string; total: number; count: number; avg: number }[]).map(item => 
      `  ${item.name}: ${item.avg.toFixed(2)}ms (${item.count} renders)`
    ),
    '',
    'Performance Suggestions:',
    ...(suggestions.length > 0 ? suggestions : ['  No major performance issues detected'])
  ]
  
  return report.join('\n')
}