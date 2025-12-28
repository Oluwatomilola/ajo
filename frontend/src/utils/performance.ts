/**
 * Advanced Performance monitoring and optimization utilities
 * Enhanced with comprehensive performance tracking, analysis, and optimization features
 */

import { VALIDATION, PERFORMANCE_CONFIG } from '../constants/appConstants';

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'render' | 'api' | 'interaction' | 'network' | 'memory' | 'custom'
  metadata?: Record<string, any>
}

interface PerformanceAlert {
  id: string
  type: 'slow_operation' | 'memory_leak' | 'high_cpu' | 'network_timeout'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  component?: string
  value: number
  threshold: number
  timestamp: number
  resolved: boolean
}

interface PerformanceBenchmark {
  name: string
  averageTime: number
  minTime: number
  maxTime: number
  sampleCount: number
  percentile95: number
  percentile99: number
}

// Performance monitoring cache with enhanced features
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceMemory extends Performance {
  memory: MemoryInfo
}

// Performance monitoring cache
const performanceMetrics: PerformanceMetric[] = []
const performanceAlerts: PerformanceAlert[] = []
const benchmarks = new Map<string, PerformanceBenchmark>()
const slowOperations = new Set<string>()
const operationHistory = new Map<string, number[]>()

/**
 * Enhanced performance measurement with automatic categorization and benchmarking
 */
export function markPerformanceStart(name: string, category: PerformanceMetric['category'] = 'interaction'): () => void {
  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    recordAdvancedMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category
    })
    
    updateBenchmark(name, duration)
    checkPerformanceAlerts(name, duration, category)
    
    // Log slow operations
    if (duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD) {
      console.warn(`🐌 Slow operation detected: ${name} took ${duration.toFixed(2)}ms (threshold: ${PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD}ms)`)
      slowOperations.add(name)
    }
  }
}

/**
 * Records a performance metric with enhanced metadata
 */
export function recordAdvancedMetric(metric: PerformanceMetric) {
  performanceMetrics.push(metric)
  
  // Keep only the most recent metrics to prevent memory issues
  if (performanceMetrics.length > PERFORMANCE_CONFIG.MAX_METRICS) {
    performanceMetrics.shift()
  }
}

/**
 * Updates performance benchmarks with statistical analysis
 */
function updateBenchmark(name: string, duration: number) {
  if (!benchmarks.has(name)) {
    benchmarks.set(name, {
      name,
      averageTime: duration,
      minTime: duration,
      maxTime: duration,
      sampleCount: 1,
      percentile95: duration,
      percentile99: duration
    })
    operationHistory.set(name, [duration])
    return
  }

  const benchmark = benchmarks.get(name)!
  const history = operationHistory.get(name)!
  
  // Add new measurement
  history.push(duration)
  
  // Keep only the most recent samples for statistical analysis
  if (history.length > PERFORMANCE_CONFIG.BENCHMARK_SAMPLE_SIZE) {
    history.shift()
  }
  
  // Update statistics
  benchmark.sampleCount = history.length
  benchmark.minTime = Math.min(...history)
  benchmark.maxTime = Math.max(...history)
  benchmark.averageTime = history.reduce((sum, val) => sum + val, 0) / history.length
  
  // Calculate percentiles
  const sorted = [...history].sort((a, b) => a - b)
  benchmark.percentile95 = sorted[Math.floor(sorted.length * 0.95)] || duration
  benchmark.percentile99 = sorted[Math.floor(sorted.length * 0.99)] || duration
  
  operationHistory.set(name, history)
}

/**
 * Checks for performance issues and creates alerts
 */
function checkPerformanceAlerts(name: string, duration: number, category: PerformanceMetric['category']) {
  const alerts: Omit<PerformanceAlert, 'id' | 'timestamp'>[] = []
  
  // Check for slow operations
  if (duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD) {
    alerts.push({
      type: 'slow_operation',
      severity: duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD * 2 ? 'critical' : 'high',
      message: `Operation "${name}" is slow: ${duration.toFixed(2)}ms`,
      component: name.split('_')[0],
      value: duration,
      threshold: PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD,
      resolved: false
    })
  }
  
  // Check for memory usage
  const memoryInfo = getMemoryUsage()
  if (memoryInfo && memoryInfo.usagePercentage > PERFORMANCE_CONFIG.MEMORY_LEAK_THRESHOLD) {
    alerts.push({
      type: 'memory_leak',
      severity: memoryInfo.usagePercentage > 90 ? 'critical' : 'high',
      message: `High memory usage detected: ${memoryInfo.usagePercentage.toFixed(1)}%`,
      value: memoryInfo.usagePercentage,
      threshold: PERFORMANCE_CONFIG.MEMORY_LEAK_THRESHOLD,
      resolved: false
    })
  }
  
  // Create alerts
  alerts.forEach(alertData => {
    const alert: PerformanceAlert = {
      ...alertData,
      id: `${alertData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    performanceAlerts.unshift(alert)
    
    // Keep only recent alerts
    if (performanceAlerts.length > PERFORMANCE_CONFIG.MAX_ALERTS) {
      performanceAlerts.pop()
    }
  })
}

/**
 * Gets performance metrics for a specific category with filtering
 */
export function getPerformanceMetrics(category?: string, timeRange?: number): PerformanceMetric[] {
  let metrics = category 
    ? performanceMetrics.filter(m => m.category === category)
    : [...performanceMetrics]
  
  if (timeRange) {
    const cutoff = Date.now() - timeRange
    metrics = metrics.filter(m => m.timestamp >= cutoff)
  }
  
  return metrics
}

/**
 * Gets performance benchmarks with statistical data
 */
export function getPerformanceBenchmarks(): PerformanceBenchmark[] {
  return Array.from(benchmarks.values())
}

/**
 * Gets performance alerts with filtering
 */
export function getPerformanceAlerts(severity?: PerformanceAlert['severity'], resolved?: boolean): PerformanceAlert[] {
  let alerts = [...performanceAlerts]
  
  if (severity) {
    alerts = alerts.filter(a => a.severity === severity)
  }
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  if (resolved !== undefined) {
    alerts = alerts.filter(a => a.resolved === resolved)
  }
  
  return alerts
}

/**
 * Resolves a performance alert
 */
export function resolveAlert(alertId: string): boolean {
  const alert = performanceAlerts.find(a => a.id === alertId)
  if (alert) {
    alert.resolved = true
    return true
  }
  return false
}

/**
 * Calculates average performance for a specific metric with confidence intervals
 */
export function getAverageMetric(name: string, category?: string, timeRange?: number): {
  average: number
  median: number
  percentile95: number
  percentile99: number
  sampleCount: number
  confidence: number
} {
  const metrics = getPerformanceMetrics(category, timeRange)
    .filter(m => m.name === name)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  if (metrics.length === 0) {
    return { average: 0, median: 0, percentile95: 0, percentile99: 0, sampleCount: 0, confidence: 0 }
  }
  
  const values = metrics.map(m => m.value).sort((a, b) => a - b)
  const average = values.reduce((sum, val) => sum + val, 0) / values.length
  const median = values[Math.floor(values.length / 2)]
  const percentile95 = values[Math.floor(values.length * 0.95)] || 0
  const percentile99 = values[Math.floor(values.length * 0.99)] || 0
  
  // Simple confidence calculation based on sample size
  const confidence = Math.min(values.length / 30, 1) // 95% confidence with 30+ samples
  
  return { average, median, percentile95, percentile99, sampleCount: values.length, confidence }
}

/**
 * Enhanced React hook for performance monitoring with advanced features
 */
export function usePerformanceMonitor(componentName: string) {
  const startRender = performance.now()
  
  // Use cleanup function to measure render time
  const endRender = () => {
    const renderTime = performance.now() - startRender
    recordAdvancedMetric({
      name: `${componentName}_render`,
      value: renderTime,
      timestamp: Date.now(),
      category: 'render'
    })
    
    // Auto-alert for very slow renders
    if (renderTime > VALIDATION.VERY_SLOW_RENDER_THRESHOLD) {
      console.warn(`🐌 Very slow render in ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  }
  
  return { endRender }
}

/**
 * Network performance monitoring
 */
export function measureNetworkRequest(url: string, startTime: number): () => void {
  return () => {
    const duration = performance.now() - startTime
    recordAdvancedMetric({
      name: `network_${url}`,
      value: duration,
      timestamp: Date.now(),
      category: 'network'
    })
    
    if (duration > PERFORMANCE_CONFIG.NETWORK_TIMEOUT_THRESHOLD) {
      console.warn(`🌐 Slow network request: ${url} took ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * Memory usage monitoring with trend analysis
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const perfWithMemory = performance as PerformanceMemory
    const memInfo = perfWithMemory.memory
    return {
      usedJSHeapSize: memInfo.usedJSHeapSize,
      totalJSHeapSize: memInfo.totalJSHeapSize,
      jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
      usagePercentage,
      trend: usagePercentage > 80 ? 'increasing' : 'stable'
    }
  }
  return null
}

/**
 * Performance profiling for async operations
 */
export async function profileAsync<T>(
  name: string,
  operation: () => Promise<T>,
  category: PerformanceMetric['category'] = 'custom'
): Promise<T> {
  const endMeasurement = markPerformanceStart(name, category)
  
  try {
    const result = await operation()
    return result
  } finally {
    endMeasurement()
  }
}

/**
 * Batch performance measurement for multiple operations
 */
export function measureBatch<T>(operations: [string, () => T][]): T[] {
  const results: T[] = []
  
  operations.forEach(([name, operation]) => {
    const endMeasurement = markPerformanceStart(name, 'custom')
    try {
      results.push(operation())
    } finally {
      endMeasurement()
    }
  })
  
  return results
}

/**
 * Enhanced performance optimization suggestions with AI-like analysis
 */
export function getPerformanceSuggestions(): string[] {
  const suggestions: string[] = []
  
  // Check render performance
  const renderMetrics = getPerformanceMetrics('render')
  const avgRenderTime = renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
  
  if (avgRenderTime > VALIDATION.RENDER_THRESHOLD) {
    suggestions.push(`🐌 Average render time is ${avgRenderTime.toFixed(2)}ms (target: <${VALIDATION.RENDER_THRESHOLD}ms for 60fps). Consider React.memo, useMemo, or useCallback optimizations.`)
  }

  // Check for components with consistently slow renders
  const slowComponents = new Set<string>()
  renderMetrics.forEach(metric => {
    if (metric.value > VALIDATION.SLOW_RENDER_THRESHOLD) { // 2x frame budget
      const componentName = metric.name.split('_')[0]
      slowComponents.add(componentName)
    }
  })
  
  if (slowComponents.size > 0) {
    suggestions.push(`⚠️ Found ${slowComponents.size} components with slow renders: ${Array.from(slowComponents).join(', ')}. Investigate and optimize these components.`)
  }
  
  // Check memory usage
  const memoryInfo = getMemoryUsage()
  if (memoryInfo && memoryInfo.usagePercentage > VALIDATION.HIGH_MEMORY_THRESHOLD) {
    suggestions.push(`💾 High memory usage detected (${memoryInfo.usagePercentage.toFixed(1)}%). Consider implementing memory cleanup and reducing memory allocations.`)
  }
  
  // Check network performance
  const networkMetrics = getPerformanceMetrics('network')
  const slowNetworkRequests = networkMetrics.filter(m => m.value > PERFORMANCE_CONFIG.NETWORK_TIMEOUT_THRESHOLD)
  
  if (slowNetworkRequests.length > 0) {
    suggestions.push(`🌐 Found ${slowNetworkRequests.length} slow network requests. Consider implementing request caching, compression, or CDN optimization.`)
  }
  
  // Check for alert patterns
  const unresolvedAlerts = getPerformanceAlerts(undefined, false)
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'critical')
  
  if (criticalAlerts.length > 0) {
    suggestions.push(`🚨 ${criticalAlerts.length} critical performance issues detected. Immediate attention required.`)
  }
  
  // Performance regression detection
  const recentMetrics = getPerformanceMetrics(undefined, 5 * 60 * 1000) // Last 5 minutes
  const olderMetrics = getPerformanceMetrics(undefined, 15 * 60 * 1000) // Previous 10 minutes
  
  if (recentMetrics.length > 0 && olderMetrics.length > 0) {
    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
    const olderAvg = olderMetrics.reduce((sum, m) => sum + m.value, 0) / olderMetrics.length
    
    if (recentAvg > olderAvg * 1.2) {
      suggestions.push(`📈 Performance regression detected. Recent average (${recentAvg.toFixed(2)}ms) is 20% higher than baseline (${olderAvg.toFixed(2)}ms).`)
    }
  }
  
  return suggestions
}

/**
 * Advanced performance report generator with detailed analysis
 */
export function generatePerformanceReport(): string {
  const memoryInfo = getMemoryUsage()
  const suggestions = getPerformanceSuggestions()
  const benchmarks = getPerformanceBenchmarks()
  const alerts = getPerformanceAlerts()
  const unresolvedAlerts = alerts.filter(a => !a.resolved)
  
  // Calculate overall performance score
  const renderMetrics = getPerformanceMetrics('render')
  const avgRenderTime = renderMetrics.length > 0 
    ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
    : 0
  
  const memoryScore = memoryInfo ? Math.max(0, 100 - memoryInfo.usagePercentage) : 100
  const renderScore = Math.max(0, 100 - (avgRenderTime - VALIDATION.RENDER_THRESHOLD) * VALIDATION.PERFORMANCE_SCORE_PENALTY) // Penalty for slow renders
  const networkScore = Math.max(0, 100 - (unresolvedAlerts.filter(a => a.type === 'slow_operation').length * VALIDATION.NETWORK_ALERT_PENALTY))
  const overallScore = (memoryScore + renderScore + networkScore) / 3
  
  const report = [
    '=== ADVANCED PERFORMANCE REPORT ===',
    `Generated: ${new Date().toISOString()}`,
    '',
    `📊 OVERALL PERFORMANCE SCORE: ${overallScore.toFixed(1)}/100`,
    '',
    '🎯 KEY METRICS:',
    `  Memory Usage: ${memoryInfo ? `${memoryInfo.usagePercentage.toFixed(1)}%` : 'Not available'}`,
    `  Average Render Time: ${avgRenderTime.toFixed(2)}ms (target: <16ms)`,
    `  Total Components Monitored: ${renderMetrics.length}`,
    `  Active Performance Alerts: ${unresolvedAlerts.length}`,
    '',
    '💾 MEMORY ANALYSIS:',
    memoryInfo ? 
      `  Used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` :
      '  Not available',
    memoryInfo ?
      `  Total: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB` :
      '',
    memoryInfo ?
      `  Limit: ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB` :
      '',
    '',
    '⚡ COMPONENT PERFORMANCE BENCHMARKS:',
    ...benchmarks.slice(0, 10).map(benchmark => 
      `  ${benchmark.name}:` +
      `  avg: ${benchmark.averageTime.toFixed(2)}ms, ` +
      `  p95: ${benchmark.percentile95.toFixed(2)}ms, ` +
      `  p99: ${benchmark.percentile99.toFixed(2)}ms, ` +
      `  samples: ${benchmark.sampleCount}`
    ),
    '',
    '🚨 ACTIVE ALERTS:',
    ...(unresolvedAlerts.length > 0 ? unresolvedAlerts.slice(0, 10).map(alert => 
      `  [${alert.severity.toUpperCase()}] ${alert.message} (${alert.timestamp})`
    ) : ['  No active alerts']),
    '',
    '🔍 PERFORMANCE ANALYSIS:',
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
    }, [] as { name: string; total: number; count: number; avg: number }[]).slice(0, 10).map(item => 
      `  ${item.name}: ${item.avg.toFixed(2)}ms avg (${item.count} renders)`
    ),
    '',
    '💡 OPTIMIZATION RECOMMENDATIONS:',
    ...(suggestions.length > 0 ? suggestions : ['  No major performance issues detected']),
    '',
    '📈 PERFORMANCE TRENDS:',
    ...analyzePerformanceTrends(),
    '',
    `Report generated with ${performanceMetrics.length} performance measurements`
  ]
  
  return report.join('\n')
}

/**
 * Analyzes performance trends over time
 */
function analyzePerformanceTrends(): string[] {
  const now = Date.now()
  const timeRanges = VALIDATION.PERFORMANCE_TIME_RANGES
  
  return timeRanges.map(range => {
    const metrics = getPerformanceMetrics(undefined, range.duration)
    if (metrics.length === 0) {
      return `  ${range.label}: No data`
    }
    
    const avgTime = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
    const slowOperations = metrics.filter(m => m.value > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD).length
    const slowPercentage = (slowOperations / metrics.length) * 100
    
    return `  ${range.label}: ${metrics.length} operations, ${avgTime.toFixed(2)}ms avg, ${slowPercentage.toFixed(1)}% slow`
  })
}

/**
 * Performance monitoring context manager
 */
export class PerformanceContext {
  private startTime: number
  private operationName: string
  private category: PerformanceMetric['category']
  
  constructor(operationName: string, category: PerformanceMetric['category'] = 'custom') {
    this.operationName = operationName
    this.category = category
    this.startTime = performance.now()
  }
  
  end(): number {
    const duration = performance.now() - this.startTime
    
    recordAdvancedMetric({
      name: this.operationName,
      value: duration,
      timestamp: Date.now(),
      category: this.category
    })
    
    updateBenchmark(this.operationName, duration)
    checkPerformanceAlerts(this.operationName, duration, this.category)
    
    return duration
  }
  
  static start(operationName: string, category: PerformanceMetric['category'] = 'custom'): PerformanceContext {
    return new PerformanceContext(operationName, category)
  }
}