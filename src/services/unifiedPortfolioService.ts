import { RealPortfolioAPI } from './realPortfolioAPI';
import { PortfolioAPI } from './portfolioAPI';
import type { PortfolioData } from '../types/portfolio';

/**
 * Unified Portfolio Service that can switch between real blockchain data
 * and mock backend API based on environment configuration
 */
export class UnifiedPortfolioService {
  private static useRealAPI: boolean = import.meta.env.VITE_USE_REAL_API === 'true' || true; // Default to real API
  
  /**
   * Fetch portfolio data using the configured API
   * @param address - Ethereum wallet address
   * @returns Promise with portfolio data
   */
  static async getPortfolio(address: string): Promise<PortfolioData> {
    try {
      if (this.useRealAPI) {
        console.log('🔗 Fetching real blockchain data...');
        return await RealPortfolioAPI.getPortfolio(address);
      } else {
        console.log('🔄 Using mock backend API...');
        return await PortfolioAPI.getPortfolio(address);
      }
    } catch (error) {
      // If real API fails, fallback to mock API (if available)
      if (this.useRealAPI && import.meta.env.VITE_FORCE_REAL_API !== 'true') {
        console.warn('Real API failed, falling back to mock API:', error);
        try {
          return await PortfolioAPI.getPortfolio(address);
        } catch (fallbackError) {
          console.error('Both APIs failed:', fallbackError);
          throw new Error(`Portfolio fetch failed: ${(error as Error).message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get multiple portfolios (for batch operations)
   * @param addresses - Array of Ethereum wallet addresses
   * @returns Promise with array of portfolio data
   */
  static async getMultiplePortfolios(addresses: string[]): Promise<PortfolioData[]> {
    const results = await Promise.allSettled(
      addresses.map(address => this.getPortfolio(address))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<PortfolioData> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Clear cache (if using real API)
   */
  static clearCache(): void {
    if (this.useRealAPI) {
      RealPortfolioAPI.clearCache();
    }
  }

  /**
   * Get cache statistics (if using real API)
   */
  static getCacheStats(): { portfolio: number; prices: number } | null {
    if (this.useRealAPI) {
      return RealPortfolioAPI.getCacheStats();
    }
    return null;
  }

  /**
   * Get supported networks
   */
  static getSupportedNetworks(): string[] {
    if (this.useRealAPI) {
      return RealPortfolioAPI.getSupportedNetworks();
    }
    return ['polygon', 'rootstock']; // Mock API supported networks
  }

  /**
   * Switch between real and mock API
   * @param useReal - Whether to use real API
   */
  static setUseRealAPI(useReal: boolean): void {
    this.useRealAPI = useReal;
    console.log(`📡 Switched to ${useReal ? 'real' : 'mock'} API`);
  }

  /**
   * Get current API mode
   */
  static isUsingRealAPI(): boolean {
    return this.useRealAPI;
  }

  /**
   * Health check for the configured API
   */
  static async healthCheck(): Promise<boolean> {
    try {
      if (this.useRealAPI) {
        // Use the public health check method
        return await RealPortfolioAPI.healthCheck();
      } else {
        // For mock API, check the health endpoint
        await PortfolioAPI.checkHealth();
        return true;
      }
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get API configuration info
   */
  static getAPIInfo(): {
    type: 'real' | 'mock';
    networks: string[];
    cacheStats?: { portfolio: number; prices: number };
  } {
    return {
      type: this.useRealAPI ? 'real' : 'mock',
      networks: this.getSupportedNetworks(),
      cacheStats: this.getCacheStats() || undefined,
    };
  }
}

// Export as default for easy migration
export default UnifiedPortfolioService;