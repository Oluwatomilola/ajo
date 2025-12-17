import React, { useState, useEffect } from 'react';
import { getAllPerformanceStats, getPerformanceSummary, clearAllPerformanceStats } from '../hooks/usePerformanceMonitor';
import { generatePerformanceReport, getMemoryUsage } from '../utils/performance';

interface PerformanceMonitorProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PerformanceMonitor({ isVisible, onClose }: PerformanceMonitorProps) {
  const [stats, setStats] = useState(getAllPerformanceStats());
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [memoryInfo, setMemoryInfo] = useState(getMemoryUsage());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000);

  useEffect(() => {
    if (!autoRefresh || !isVisible) return;

    const interval = setInterval(() => {
      setStats(getAllPerformanceStats());
      setSummary(getPerformanceSummary());
      setMemoryInfo(getMemoryUsage());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isVisible]);

  useEffect(() => {
    if (isVisible) {
      // Refresh stats when component becomes visible
      setStats(getAllPerformanceStats());
      setSummary(getPerformanceSummary());
      setMemoryInfo(getMemoryUsage());
    }
  }, [isVisible]);

  const handleClearStats = () => {
    clearAllPerformanceStats();
    setStats(getAllPerformanceStats());
    setSummary(getPerformanceSummary());
  };

  const exportReport = () => {
    const report = generatePerformanceReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="performance-monitor">
      <div className="performance-monitor-header">
        <h2>🚀 Performance Monitor</h2>
        <div className="performance-monitor-controls">
          <button
            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
          >
            <option value={500}>500ms</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
          </select>
          <button onClick={handleClearStats}>Clear Stats</button>
          <button onClick={exportReport}>Export Report</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="performance-monitor-content">
        {/* Performance Summary */}
        <div className="performance-summary">
          <h3>📊 Performance Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Components:</span>
              <span className="value">{summary.totalComponents}</span>
            </div>
            <div className="summary-item">
              <span className="label">Slow Components:</span>
              <span className="value warning">{summary.slowComponents.length}</span>
            </div>
            <div className="summary-item">
              <span className="label">Average Render Time:</span>
              <span className={`value ${summary.averageRenderTime > 16 ? 'warning' : 'good'}`}>
                {summary.averageRenderTime.toFixed(2)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        {memoryInfo && (
          <div className="memory-usage">
            <h3>💾 Memory Usage</h3>
            <div className="memory-stats">
              <div className="memory-item">
                <span className="label">Used Heap:</span>
                <span className="value">{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="memory-item">
                <span className="label">Total Heap:</span>
                <span className="value">{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="memory-item">
                <span className="label">Usage:</span>
                <span className={`value ${memoryInfo.usagePercentage > 80 ? 'warning' : 'good'}`}>
                  {memoryInfo.usagePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="memory-bar">
              <div
                className="memory-bar-fill"
                style={{ width: `${Math.min(memoryInfo.usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Component Performance */}
        <div className="component-performance">
          <h3>⚡ Component Performance</h3>
          <div className="components-list">
            {Object.entries(stats).map(([componentName, componentStats]) => (
              <div key={componentName} className="component-card">
                <div className="component-header">
                  <h4>{componentName}</h4>
                  <div className="component-status">
                    {componentStats.averageRenderTime > 16 && (
                      <span className="status-indicator slow">🐌 Slow</span>
                    )}
                    {componentStats.slowRenders > 0 && (
                      <span className="status-indicator warning">⚠️ Issues</span>
                    )}
                  </div>
                </div>
                
                <div className="component-metrics">
                  <div className="metric">
                    <span className="metric-label">Renders:</span>
                    <span className="metric-value">{componentStats.renderCount}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Avg Time:</span>
                    <span className={`metric-value ${componentStats.averageRenderTime > 16 ? 'warning' : 'good'}`}>
                      {componentStats.averageRenderTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Last Render:</span>
                    <span className="metric-value">{componentStats.lastRenderTime.toFixed(2)}ms</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Slow Renders:</span>
                    <span className={`metric-value ${componentStats.slowRenders > 0 ? 'warning' : 'good'}`}>
                      {componentStats.slowRenders}
                    </span>
                  </div>
                  {componentStats.mountTime && (
                    <div className="metric">
                      <span className="metric-label">Mount Time:</span>
                      <span className={`metric-value ${componentStats.mountTime > 100 ? 'warning' : 'good'}`}>
                        {componentStats.mountTime.toFixed(2)}ms
                      </span>
                    </div>
                  )}
                </div>

                {componentStats.propChanges > 0 && (
                  <div className="component-extras">
                    <span className="extra-metric">Prop Changes: {componentStats.propChanges}</span>
                  </div>
                )}

                {componentStats.stateChanges > 0 && (
                  <div className="component-extras">
                    <span className="extra-metric">State Changes: {componentStats.stateChanges}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {summary.recommendations.length > 0 && (
          <div className="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
              {summary.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}