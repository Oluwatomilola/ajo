import { useEffect, useRef, useCallback } from 'react';
import { markPerformanceStart, getPerformanceMetrics, recordAdvancedMetric } from '../utils/performance';
import { VALIDATION } from '../constants/appConstants';

interface PerformanceMonitorOptions {
  componentName: string;
  trackRender?: boolean;
  trackMount?: boolean;
  trackUnmount?: boolean;
  track?: boolean;
  trackProps?: boolean;
  trackState?: boolean;
  thresholds?: {
    render?: number;
    mount?: number;
    props?: number;
    state?: number;
  };
}

interface PerformanceStats {
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  mountTime?: number;
  unmountTime?: number;
  lastRenderTime: number;
  slowRenders: number;
  propChanges: number;
  stateChanges: number;
}

const performanceStatsMap = new Map<string, PerformanceStats>();
const MAX_COMPONENTS = 100; // Maximum number of components to track

/**
 * Enhanced React hook for comprehensive performance monitoring
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions) {
  const {
    componentName,
    trackRender = true,
    trackMount = true,
    trackUnmount = true,
    trackProps = false,
    trackState = false,
    thresholds = {}
  } = options;

  const startTimeRef = useRef<number>(0);
  const prevPropsRef = useRef<any>(null);
  const prevStateRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Initialize performance stats for this component
  useEffect(() => {
    if (!performanceStatsMap.has(componentName)) {
      // Implement size limit to prevent memory leaks
      if (performanceStatsMap.size >= MAX_COMPONENTS) {
        // Remove oldest entry (first key)
        const firstKey = performanceStatsMap.keys().next().value;
        if (firstKey) {
          performanceStatsMap.delete(firstKey);
        }
      }
      
      performanceStatsMap.set(componentName, {
        renderCount: 0,
        averageRenderTime: 0,
        totalRenderTime: 0,
        lastRenderTime: 0,
        slowRenders: 0,
        propChanges: 0,
        stateChanges: 0
      });
    }
    
    isInitializedRef.current = true;

    // Cleanup when component unmounts
    return () => {
      if (trackUnmount) {
        performanceStatsMap.delete(componentName);
      }
    };
  }, [componentName, trackUnmount]);

  /**
   * Records a performance measurement with automatic categorization
   */
  const recordMeasurement = useCallback((operation: string, duration: number, category: string = 'interaction') => {
    // Record the measurement with the provided duration
    recordAdvancedMetric({
      name: `${componentName}_${operation}`,
      value: duration,
      timestamp: Date.now(),
      category: category as any
    });
  }, [componentName]);

  /**
   * Tracks component render performance
   */
  const trackRenderPerformance = useCallback(() => {
    if (!trackRender) return;

    const renderStart = performance.now();
    
    return () => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      const stats = performanceStatsMap.get(componentName)!;
      stats.renderCount++;
      stats.lastRenderTime = renderTime;
      stats.totalRenderTime += renderTime;
      stats.averageRenderTime = stats.totalRenderTime / stats.renderCount;

      // Track slow renders
      const renderThreshold = thresholds.render || VALIDATION.RENDER_THRESHOLD; // 60fps = 16.67ms
      if (renderTime > renderThreshold) {
        stats.slowRenders++;
        console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${renderThreshold}ms)`);
      }

      // Record the measurement
      recordMeasurement('render', renderTime, 'render');
    };
  }, [componentName, trackRender, thresholds.render, recordMeasurement]);

  /**
   * Tracks component mount performance
   */
  const trackMountPerformance = useCallback(() => {
    if (!trackMount) return;

    const mountStart = performance.now();
    
    return () => {
      const mountEnd = performance.now();
      const mountTime = mountEnd - mountStart;
      
      const stats = performanceStatsMap.get(componentName)!;
      stats.mountTime = mountTime;

      const mountThreshold = thresholds.mount || VALIDATION.MOUNT_THRESHOLD;
      if (mountTime > mountThreshold) {
        console.warn(`🐌 Slow mount detected in ${componentName}: ${mountTime.toFixed(2)}ms (threshold: ${mountThreshold}ms)`);
      }

      recordMeasurement('mount', mountTime, 'interaction');
    };
  }, [componentName, trackMount, thresholds.mount, recordMeasurement]);

  /**
   * Tracks prop changes
   */
  const trackPropChanges = useCallback((currentProps: any) => {
    if (!trackProps || !prevPropsRef.current) return;

    const prevProps = prevPropsRef.current;
    const propKeys = Object.keys(currentProps);
    let changedProps = 0;

    propKeys.forEach(key => {
      if (JSON.stringify(prevProps[key]) !== JSON.stringify(currentProps[key])) {
        changedProps++;
      }
    });

    if (changedProps > 0) {
      const stats = performanceStatsMap.get(componentName)!;
      stats.propChanges += changedProps;

      const propThreshold = thresholds.props || VALIDATION.PROP_CHANGE_THRESHOLD;
      if (changedProps > propThreshold) {
        console.warn(`🔄 Many prop changes in ${componentName}: ${changedProps} props changed (threshold: ${propThreshold})`);
      }
    }

    prevPropsRef.current = currentProps;
  }, [componentName, trackProps, thresholds.props]);

  /**
   * Tracks state changes
   */
  const trackStateChanges = useCallback((currentState: any) => {
    if (!trackState || !prevStateRef.current) return;

    const prevState = prevStateRef.current;
    const stateKeys = Object.keys(currentState);
    let changedState = 0;

    stateKeys.forEach(key => {
      if (JSON.stringify(prevState[key]) !== JSON.stringify(currentState[key])) {
        changedState++;
      }
    });

    if (changedState > 0) {
      const stats = performanceStatsMap.get(componentName)!;
      stats.stateChanges += changedState;

      const stateThreshold = thresholds.state || VALIDATION.STATE_CHANGE_THRESHOLD;
      if (changedState > stateThreshold) {
        console.warn(`🔄 Many state changes in ${componentName}: ${changedState} state values changed (threshold: ${stateThreshold})`);
      }
    }

    prevStateRef.current = currentState;
  }, [componentName, trackState, thresholds.state]);

  /**
   * Gets performance statistics for this component
   */
  const getStats = useCallback((): PerformanceStats | null => {
    return performanceStatsMap.get(componentName) || null;
  }, [componentName]);

  /**
   * Gets performance metrics from the global performance system
   */
  const getGlobalMetrics = useCallback((category?: string) => {
    return getPerformanceMetrics(category);
  }, []);

  /**
   * Clears performance statistics for this component
   */
  const clearStats = useCallback(() => {
    performanceStatsMap.set(componentName, {
      renderCount: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      slowRenders: 0,
      propChanges: 0,
      stateChanges: 0
    });
  }, [componentName]);

  // Track mount performance
  useEffect(() => {
    const endMount = trackMountPerformance();
    
    return () => {
      if (endMount) endMount();
      
      if (trackUnmount) {
        const unmountStart = performance.now();
        // Unmount tracking will be handled in cleanup
        recordMeasurement('unmount', performance.now() - unmountStart, 'interaction');
      }
    };
  }, [trackMountPerformance, trackUnmount, recordMeasurement, componentName, thresholds]);

  return {
    trackRenderPerformance,
    trackPropChanges,
    trackStateChanges,
    getStats,
    getGlobalMetrics,
    clearStats,
    recordMeasurement
  };
}

/**
 * Gets performance statistics for all monitored components
 */
export function getAllPerformanceStats(): Record<string, PerformanceStats> {
  const allStats: Record<string, PerformanceStats> = {};
  performanceStatsMap.forEach((stats, componentName) => {
    allStats[componentName] = { ...stats };
  });
  return allStats;
}

/**
 * Clears performance statistics for all components
 */
export function clearAllPerformanceStats(): void {
  performanceStatsMap.clear();
}

/**
 * Cleanup function to prevent memory leaks
 * Should be called when the application is shutting down
 */
export function cleanupPerformanceMonitoring(): void {
  performanceStatsMap.clear();
  // Clear any other global references if needed
}

/**
 * Gets performance summary with recommendations
 */
export function getPerformanceSummary(): {
  totalComponents: number;
  slowComponents: string[];
  averageRenderTime: number;
  recommendations: string[];
} {
  const allStats = getAllPerformanceStats();
  const components = Object.entries(allStats);
  
  let totalRenderTime = 0;
  let totalRenders = 0;
  const slowComponents: string[] = [];
  const recommendations: string[] = [];

  components.forEach(([componentName, stats]) => {
    if (stats.renderCount > 0) {
      totalRenderTime += stats.averageRenderTime;
      totalRenders += stats.renderCount;

      if (stats.averageRenderTime > VALIDATION.RENDER_THRESHOLD || stats.slowRenders > 0) {
        slowComponents.push(componentName);
      }
    
      if (stats.slowRenders > stats.renderCount * VALIDATION.HIGH_RENDER_RATIO) {
        recommendations.push(`${componentName}: High number of slow renders (${stats.slowRenders}/${stats.renderCount}). Consider React.memo or useMemo.`);
      }
    
      if (stats.propChanges > VALIDATION.PROP_CHANGE_THRESHOLD) {
        recommendations.push(`${componentName}: Many prop changes (${stats.propChanges}). Consider useMemo or React.memo.`);
      }
    
      if (stats.stateChanges > VALIDATION.STATE_CHANGE_THRESHOLD) {
        recommendations.push(`${componentName}: Many state changes (${stats.stateChanges}). Consider useReducer or split components.`);
      }
    }
  });

  const averageRenderTime = totalRenders > 0 ? totalRenderTime / components.length : 0;

  if (slowComponents.length > 0) {
    recommendations.push('Consider implementing performance optimizations for slow-rendering components.');
  }

  if (averageRenderTime > VALIDATION.RENDER_THRESHOLD) {
    recommendations.push('Overall render performance is slow. Consider implementing React.memo, useMemo, or useCallback where appropriate.');
  }

  return {
    totalComponents: components.length,
    slowComponents,
    averageRenderTime,
    recommendations
  };
}