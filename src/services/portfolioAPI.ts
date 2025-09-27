import axios from 'axios';
import type { PortfolioData, PortfolioError } from '../types/portfolio';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Portfolio API service for interacting with the backend
 */
export class PortfolioAPI {
  /**
   * Fetch portfolio data for a given wallet address
   * @param address - Ethereum wallet address
   * @returns Promise with portfolio data
   */
  static async getPortfolio(address: string): Promise<PortfolioData> {
    try {
      const response = await axios.get<PortfolioData>(`${API_BASE_URL}/portfolio`, {
        params: { address },
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorData = error.response.data as PortfolioError;
          throw new Error(errorData.message || `Server error: ${error.response.status}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Failed to connect to portfolio service. Please check if the backend is running.');
        }
      }
      
      throw new Error('An unexpected error occurred while fetching portfolio data.');
    }
  }

  /**
   * Check if the backend service is healthy
   * @returns Promise with health status
   */
  static async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
      });
      
      return response.data;
    } catch (error) {
      throw new Error('Backend service is not available');
    }
  }
}