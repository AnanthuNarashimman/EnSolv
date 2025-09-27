/**
 * Debug utilities for the Ensolv portfolio system
 */

export class DebugUtils {
  private static isDebugEnabled = import.meta.env.VITE_DEBUG === 'true';

  /**
   * Log debug information if debug mode is enabled
   */
  static log(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.log('🔍 [Ensolv Debug]', ...args);
    }
  }

  /**
   * Log error information
   */
  static error(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.error('❌ [Ensolv Error]', ...args);
    }
  }

  /**
   * Log warning information
   */
  static warn(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.warn('⚠️ [Ensolv Warning]', ...args);
    }
  }

  /**
   * Log performance timing
   */
  static time(label: string): void {
    if (this.isDebugEnabled) {
      console.time(`⏱️ [Ensolv] ${label}`);
    }
  }

  /**
   * End performance timing
   */
  static timeEnd(label: string): void {
    if (this.isDebugEnabled) {
      console.timeEnd(`⏱️ [Ensolv] ${label}`);
    }
  }

  /**
   * Log API call information
   */
  static logAPICall(method: string, url: string, params?: any): void {
    if (this.isDebugEnabled) {
      console.log('🌐 [Ensolv API]', { method, url, params });
    }
  }

  /**
   * Log cache hit/miss information
   */
  static logCache(type: 'hit' | 'miss', key: string, data?: any): void {
    if (this.isDebugEnabled) {
      const icon = type === 'hit' ? '✅' : '❌';
      console.log(`${icon} [Ensolv Cache] ${type.toUpperCase()}:`, key, data ? '(with data)' : '');
    }
  }

  /**
   * Create a performance monitor wrapper
   */
  static monitor<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    label: string
  ): T {
    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      this.time(label);
      try {
        const result = await fn(...args);
        this.log(`${label} completed successfully`);
        return result;
      } catch (error) {
        this.error(`${label} failed:`, error);
        throw error;
      } finally {
        this.timeEnd(label);
      }
    }) as T;
  }

  /**
   * Enable/disable debug mode at runtime
   */
  static setDebugMode(enabled: boolean): void {
    this.isDebugEnabled = enabled;
    this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current debug status
   */
  static isDebugModeEnabled(): boolean {
    return this.isDebugEnabled;
  }

  /**
   * Create a detailed portfolio analysis for debugging
   */
  static analyzePortfolio(portfolioData: any): void {
    if (!this.isDebugEnabled) return;

    console.group('📊 [Ensolv] Portfolio Analysis');
    
    console.log('Address:', portfolioData.address);
    console.log('Total USD Value:', `$${portfolioData.summary?.totalUsdValue?.toLocaleString() || 0}`);
    console.log('Token Count:', portfolioData.tokenHoldings?.length || 0);
    console.log('Networks:', Object.keys(portfolioData.summary?.networkTotals || {}));
    
    if (portfolioData.tokenHoldings?.length > 0) {
      console.log('Top 5 tokens by value:');
      portfolioData.tokenHoldings
        .slice(0, 5)
        .forEach((token: any, i: number) => {
          console.log(`  ${i + 1}. ${token.symbol}: $${token.usdValue?.toLocaleString()}`);
        });
    }
    
    if (portfolioData.metadata) {
      console.log('Metadata:', portfolioData.metadata);
    }
    
    console.groupEnd();
  }

  /**
   * Log network performance
   */
  static logNetworkPerformance(network: string, responseTime: number, success: boolean): void {
    if (this.isDebugEnabled) {
      const status = success ? '✅' : '❌';
      console.log(`${status} [Ensolv Network] ${network}: ${responseTime}ms`);
    }
  }

  /**
   * Create a summary of API usage statistics
   */
  static logAPIStats(stats: {
    totalCalls: number;
    successfulCalls: number;
    averageResponseTime: number;
    cacheHitRate: number;
  }): void {
    if (this.isDebugEnabled) {
      console.group('📈 [Ensolv] API Statistics');
      console.log('Total API calls:', stats.totalCalls);
      console.log('Successful calls:', stats.successfulCalls);
      console.log('Success rate:', `${((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1)}%`);
      console.log('Average response time:', `${stats.averageResponseTime}ms`);
      console.log('Cache hit rate:', `${(stats.cacheHitRate * 100).toFixed(1)}%`);
      console.groupEnd();
    }
  }
}

export default DebugUtils;