/**
 * Common performance utilities to eliminate code duplication
 * Centralized performance monitoring functions used across multiple components
 */

import { VALIDATION, TIME } from '../constants/appConstants';

/**
 * Creates a performance measurement wrapper
 */
export function createPerformanceWrapper(
  operationName: string,
  category: 'render' | 'api' | 'interaction' | 'network' | 'memory' | 'custom' = 'custom'
) {
  const startTime = performance.now();

  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log slow operations
      if (duration > VALIDATION.SLOW_OPERATION_THRESHOLD) {
        console.warn(`🐌 Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }

      return duration;
    },
    getDuration: () => {
      return performance.now() - startTime;
    }
  };
}

/**
 * Measures function execution time
 */
export function measureExecutionTime<T>(
  fn: () => T,
  operationName: string,
  category: 'render' | 'api' | 'interaction' | 'network' | 'memory' | 'custom' = 'custom'
): { result: T; duration: number } {
  const wrapper = createPerformanceWrapper(operationName, category);
  const result = fn();
  const duration = wrapper.end();

  return { result, duration };
}

/**
 * Measures async function execution time
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  operationName: string,
  category: 'render' | 'api' | 'interaction' | 'network' | 'memory' | 'custom' = 'custom'
): Promise<{ result: T; duration: number }> {
  const wrapper = createPerformanceWrapper(operationName, category);
  const result = await fn();
  const duration = wrapper.end();

  return { result, duration };
}

/**
 * Creates a debounce function to prevent excessive calls
 */
export function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = TIME.DEBOUNCE_DELAY
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a throttle function to limit call frequency
 */
export function createThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = TIME.REFRESH_INTERVAL
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, limit - (now - lastCall));
    }
  };
}

/**
 * Checks if a component render is slow
 */
export function checkSlowRender(
  renderTime: number,
  componentName: string,
  threshold: number = VALIDATION.RENDER_THRESHOLD
): boolean {
  if (renderTime > threshold) {
    console.warn(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
    return true;
  }
  return false;
}

/**
 * Checks if an operation is slow
 */
export function checkSlowOperation(
  duration: number,
  operationName: string,
  threshold: number = VALIDATION.SLOW_OPERATION_THRESHOLD
): boolean {
  if (duration > threshold) {
    console.warn(`🐌 Slow operation: ${operationName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    return true;
  }
  return false;
}

/**
 * Creates a performance benchmark
 */
export function createPerformanceBenchmark() {
  const benchmarks: Record<string, { count: number; totalTime: number; minTime: number; maxTime: number }> = {};

  return {
    start: (name: string) => {
      const startTime = performance.now();
      if (!benchmarks[name]) {
        benchmarks[name] = { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0 };
      }
      return startTime;
    },
    end: (name: string, startTime: number) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const benchmark = benchmarks[name];
      benchmark.count++;
      benchmark.totalTime += duration;
      benchmark.minTime = Math.min(benchmark.minTime, duration);
      benchmark.maxTime = Math.max(benchmark.maxTime, duration);

      return duration;
    },
    getStats: (name: string) => {
      const benchmark = benchmarks[name];
      if (!benchmark || benchmark.count === 0) return null;

      return {
        count: benchmark.count,
        average: benchmark.totalTime / benchmark.count,
        min: benchmark.minTime,
        max: benchmark.maxTime,
        total: benchmark.totalTime
      };
    },
    getAllStats: () => {
      const stats: Record<string, any> = {};
      for (const [name, benchmark] of Object.entries(benchmarks)) {
        if (benchmark.count > 0) {
          stats[name] = {
            count: benchmark.count,
            average: benchmark.totalTime / benchmark.count,
            min: benchmark.minTime,
            max: benchmark.maxTime,
            total: benchmark.totalTime
          };
        }
      }
      return stats;
    },
    reset: (name?: string) => {
      if (name) {
        benchmarks[name] = { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0 };
      } else {
        for (const key of Object.keys(benchmarks)) {
          benchmarks[key] = { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0 };
        }
      }
    }
  };
}

/**
 * Creates a memory usage monitor
 */
export function createMemoryMonitor() {
  let lastMemoryUsage: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null = null;

  return {
    checkMemoryUsage: () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedJSHeapSize = memory.usedJSHeapSize;
        const totalJSHeapSize = memory.totalJSHeapSize;
        const jsHeapSizeLimit = memory.jsHeapSizeLimit;
        const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;

        if (usagePercentage > VALIDATION.MEMORY_LEAK_THRESHOLD) {
          console.warn(`💾 High memory usage: ${usagePercentage.toFixed(1)}% (threshold: ${VALIDATION.MEMORY_LEAK_THRESHOLD}%)`);
        }

        lastMemoryUsage = { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit };
        return { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit, usagePercentage };
      }
      return null;
    },
    getLastMemoryUsage: () => lastMemoryUsage,
    getMemoryStats: () => {
      if (lastMemoryUsage) {
        return {
          usedMB: lastMemoryUsage.usedJSHeapSize / (1024 * 1024),
          totalMB: lastMemoryUsage.totalJSHeapSize / (1024 * 1024),
          limitMB: lastMemoryUsage.jsHeapSizeLimit / (1024 * 1024),
          usagePercentage: (lastMemoryUsage.usedJSHeapSize / lastMemoryUsage.jsHeapSizeLimit) * 100
        };
      }
      return null;
    }
  };
}

/**
 * Creates a network performance monitor
 */
export function createNetworkMonitor() {
  const networkRequests: Array<{ url: string; startTime: number; duration?: number }> = [];
  let activeRequests = 0;

  return {
    startRequest: (url: string) => {
      const request = {
        url,
        startTime: performance.now()
      };
      networkRequests.push(request);
      activeRequests++;
      return request;
    },
    endRequest: (request: { url: string; startTime: number }) => {
      const endTime = performance.now();
      const duration = endTime - request.startTime;
      (request as any).duration = duration;
      activeRequests--;

      if (duration > VALIDATION.NETWORK_TIMEOUT_THRESHOLD) {
        console.warn(`🌐 Slow network request: ${request.url} took ${duration.toFixed(2)}ms`);
      }

      return duration;
    },
    getActiveRequests: () => activeRequests,
    getRequestStats: () => {
      const completedRequests = networkRequests.filter(r => r.duration !== undefined);
      if (completedRequests.length === 0) return null;

      const totalDuration = completedRequests.reduce((sum, req) => sum + (req.duration || 0), 0);
      const slowRequests = completedRequests.filter(req => (req.duration || 0) > VALIDATION.NETWORK_TIMEOUT_THRESHOLD).length;

      return {
        totalRequests: completedRequests.length,
        averageDuration: totalDuration / completedRequests.length,
        slowRequests,
        slowPercentage: (slowRequests / completedRequests.length) * 100,
        activeRequests
      };
    },
    clearRequests: () => {
      networkRequests.length = 0;
    }
  };
}

/**
 * Creates a performance budget monitor
 */
export function createPerformanceBudget(
  budget: number = VALIDATION.RENDER_THRESHOLD,
  warningThreshold: number = budget * 0.8
) {
  let violations: Array<{ name: string; duration: number; timestamp: number }> = [];

  return {
    check: (name: string, duration: number) => {
      const timestamp = Date.now();
      const isViolation = duration > budget;
      const isWarning = duration > warningThreshold && duration <= budget;

      if (isViolation) {
        violations.push({ name, duration, timestamp });
        console.warn(`🚨 Performance budget violated: ${name} took ${duration.toFixed(2)}ms (budget: ${budget}ms)`);
      } else if (isWarning) {
        console.warn(`⚠️ Approaching performance budget: ${name} took ${duration.toFixed(2)}ms (budget: ${budget}ms)`);
      }

      return { isViolation, isWarning };
    },
    getViolations: () => [...violations],
    clearViolations: () => {
      violations = [];
    },
    getStats: () => {
      if (violations.length === 0) return null;

      const totalDuration = violations.reduce((sum, v) => sum + v.duration, 0);
      const worstOffender = violations.reduce((worst, v) => v.duration > worst.duration ? v : worst, violations[0]);

      return {
        count: violations.length,
        averageDuration: totalDuration / violations.length,
        worstOffender: {
          name: worstOffender.name,
          duration: worstOffender.duration
        },
        totalDuration
      };
    }
  };
}