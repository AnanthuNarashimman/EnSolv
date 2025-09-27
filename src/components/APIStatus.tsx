import React, { useState, useEffect } from 'react';
import { UnifiedPortfolioService } from '../services/unifiedPortfolioService';
import DebugUtils from '../utils/debug';

/**
 * API Status component for monitoring and controlling portfolio API
 */
const APIStatus: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [apiInfo, setApiInfo] = useState(UnifiedPortfolioService.getAPIInfo());
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    // Only auto-show in development and when debug is enabled
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
      setIsVisible(true);
    }
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const healthy = await UnifiedPortfolioService.healthCheck();
      setIsHealthy(healthy);
      DebugUtils.log('API health check:', healthy ? 'healthy' : 'unhealthy');
    } catch (error) {
      setIsHealthy(false);
      DebugUtils.error('Health check failed:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const switchAPI = (useReal: boolean) => {
    UnifiedPortfolioService.setUseRealAPI(useReal);
    setApiInfo(UnifiedPortfolioService.getAPIInfo());
    setIsHealthy(null); // Reset health status
    checkHealth(); // Check health of new API
  };

  const clearCache = () => {
    UnifiedPortfolioService.clearCache();
    DebugUtils.log('Cache cleared');
    // Update cache stats
    setApiInfo(UnifiedPortfolioService.getAPIInfo());
  };

  const getHealthStatusColor = (): string => {
    if (isHealthy === null) return '#6b7280';
    return isHealthy ? '#10b981' : '#ef4444';
  };

  const getHealthStatusText = (): string => {
    if (isCheckingHealth) return 'Checking...';
    if (isHealthy === null) return 'Unknown';
    return isHealthy ? 'Healthy' : 'Unhealthy';
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => {
          setIsVisible(true);
          checkHealth();
        }}
        style={styles.toggleButton}
        title="Show API Status (Dev Mode)"
      >
        🔧
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{...styles.card, ...(isMinimized ? styles.cardMinimized : {})}}>
        <div style={styles.header}>
          <h3 style={styles.title}>API Status</h3>
          <div style={styles.headerActions}>
            <div style={styles.statusIndicator}>
              <div 
                style={{
                  ...styles.statusDot,
                  backgroundColor: getHealthStatusColor(),
                }}
              />
              <span style={styles.statusText}>{getHealthStatusText()}</span>
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              style={styles.minimizeButton}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '▼' : '▲'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              style={styles.closeButton}
              title="Hide API Status"
            >
              ✕
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div style={styles.content}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Current API:</span>
                <span style={{
                  ...styles.value,
                  color: apiInfo.type === 'real' ? '#8247e5' : '#ff6b35'
                }}>
                  {apiInfo.type === 'real' ? 'Blockchain (Real)' : 'Backend (Mock)'}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}>Networks:</span>
                <span style={styles.value}>{apiInfo.networks.join(', ')}</span>
              </div>

              {apiInfo.cacheStats && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>Cache:</span>
                  <span style={styles.value}>
                    {apiInfo.cacheStats.portfolio} portfolios, {apiInfo.cacheStats.prices} prices
                  </span>
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <div style={styles.switchContainer}>
                <label style={styles.switchLabel}>API Type:</label>
                <div style={styles.switchButtons}>
                  <button
                    onClick={() => switchAPI(true)}
                    style={{
                      ...styles.switchButton,
                      ...(apiInfo.type === 'real' ? styles.switchButtonActive : {})
                    }}
                  >
                    Real
                  </button>
                  <button
                    onClick={() => switchAPI(false)}
                    style={{
                      ...styles.switchButton,
                      ...(apiInfo.type === 'mock' ? styles.switchButtonActive : {})
                    }}
                  >
                    Mock
                  </button>
                </div>
              </div>

              <button onClick={checkHealth} style={styles.actionButton} disabled={isCheckingHealth}>
                {isCheckingHealth ? 'Checking...' : 'Check Health'}
              </button>

              {apiInfo.cacheStats && (
                <button onClick={clearCache} style={styles.actionButton}>
                  Clear Cache
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
  },
  toggleButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(130, 71, 229, 0.9)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(130, 71, 229, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '280px',
    maxWidth: '320px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  },
  cardMinimized: {
    minWidth: '200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
  },
  minimizeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#6b7280',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#ef4444',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    fontWeight: 'bold',
  },
  content: {
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: '12px',
    color: '#1f2937',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  switchLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  switchButtons: {
    display: 'flex',
    background: '#f3f4f6',
    borderRadius: '6px',
    padding: '2px',
  },
  switchButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'transparent',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  },
  switchButtonActive: {
    background: '#fff',
    color: '#1f2937',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '600',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#fff',
    color: '#374151',
    transition: 'all 0.2s ease',
  },
};

export default APIStatus;