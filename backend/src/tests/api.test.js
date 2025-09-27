import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';

// Mock the portfolio service
jest.unstable_mockModule('../portfolioService.js', () => ({
  getPortfolioData: jest.fn()
}));

// Import the mocked module
const { getPortfolioData } = await import('../portfolioService.js');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Enhanced logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
      originalSend.call(this, data);
    };
    
    next();
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Ensolv Portfolio API',
      version: '1.0.0'
    });
  });

  // Main portfolio endpoint
  app.get('/portfolio', async (req, res) => {
    const startTime = Date.now();
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid address parameter',
        message: 'Please provide a valid Ethereum wallet address as a query parameter'
      });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Invalid Ethereum address format',
        message: 'The provided address is not a valid Ethereum address'
      });
    }

    try {
      const portfolioData = await getPortfolioData(address.toLowerCase());
      
      const responseTime = Date.now() - startTime;
      
      const response = {
        ...portfolioData,
        metadata: {
          responseTime: `${responseTime}ms`,
          cached: portfolioData.cached || false,
          apiVersion: '1.0.0'
        }
      };
      
      res.json(response);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.message.includes('Invalid Ethereum address')) {
        return res.status(400).json({ 
          error: 'Invalid address format',
          message: error.message
        });
      }
      
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return res.status(503).json({ 
          error: 'Service temporarily unavailable',
          message: 'Unable to fetch data from blockchain networks. Please try again later.'
        });
      }
      
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch portfolio data. Please try again later.'
      });
    }
  });

  // API documentation endpoint
  app.get('/api-docs', (_req, res) => {
    res.json({
      title: 'Ensolv Portfolio API',
      version: '1.0.0',
      description: 'API for aggregating wallet portfolio data across Polygon and Rootstock chains',
      endpoints: {
        '/health': {
          method: 'GET',
          description: 'Health check endpoint',
          response: 'Service status and metadata'
        },
        '/portfolio': {
          method: 'GET',
          description: 'Get wallet portfolio data across supported chains',
          parameters: {
            address: {
              type: 'string',
              required: true,
              description: 'Ethereum wallet address to fetch portfolio for'
            }
          },
          example: '/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          response: {
            address: 'string',
            updatedAt: 'ISO timestamp',
            summary: {
              totalUsdValue: 'number',
              networkTotals: {
                polygon: 'number',
                rootstock: 'number'
              },
              tokenCount: 'number',
              liquidityPositionCount: 'number'
            },
            tokenHoldings: 'array of token holdings',
            liquidityPositions: 'array of liquidity positions'
          }
        }
      },
      supportedNetworks: ['polygon', 'rootstock'],
      priceProvider: 'Pyth Network'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
    });
  });

  // Global error handler
  app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  // Mock data used across tests
  const mockPortfolioData = {
    address: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
    updatedAt: '2024-01-01T00:00:00.000Z',
    summary: {
      totalUsdValue: 46000,
      networkTotals: {
        polygon: 1000,
        rootstock: 45000
      },
      tokenCount: 2,
      liquidityPositionCount: 0
    },
    tokenHoldings: [
      {
        network: 'polygon',
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        amount: '1000',
        price: 1,
        usdValue: 1000,
        type: 'token'
      },
      {
        network: 'rootstock',
        address: '0x542fda317318ebf1d3deaf76e0b632741a7e677d',
        symbol: 'RBTC',
        name: 'Rootstock BTC',
        decimals: 18,
        amount: '1',
        price: 45000,
        usdValue: 45000,
        type: 'token'
      }
    ],
    liquidityPositions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'Ensolv Portfolio API',
        version: '1.0.0'
      });
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /portfolio', () => {

    it('should return portfolio data for valid address', async () => {
      getPortfolioData.mockResolvedValueOnce(mockPortfolioData);

      const response = await request(app)
        .get('/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        .expect(200);

      expect(response.body).toMatchObject(mockPortfolioData);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('responseTime');
      expect(response.body.metadata).toHaveProperty('apiVersion', '1.0.0');
    });

    it('should return 400 for missing address parameter', async () => {
      const response = await request(app)
        .get('/portfolio')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Missing or invalid address parameter',
        message: 'Please provide a valid Ethereum wallet address as a query parameter'
      });
    });

    it('should return 400 for invalid address format', async () => {
      const response = await request(app)
        .get('/portfolio?address=invalid-address')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid Ethereum address format',
        message: 'The provided address is not a valid Ethereum address'
      });
    });

    it('should return 500 for service errors', async () => {
      getPortfolioData.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Internal server error',
        message: 'Failed to fetch portfolio data. Please try again later.'
      });
    });

    it('should return 503 for network errors', async () => {
      getPortfolioData.mockRejectedValueOnce(new Error('Network timeout occurred'));

      const response = await request(app)
        .get('/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        .expect(503);

      expect(response.body).toMatchObject({
        error: 'Service temporarily unavailable',
        message: 'Unable to fetch data from blockchain networks. Please try again later.'
      });
    });

    it('should handle address case insensitivity', async () => {
      getPortfolioData.mockResolvedValueOnce(mockPortfolioData);

      const response = await request(app)
        .get('/portfolio?address=0x742D35CC6634C0532925A3B8D4C9DB96C4B4D8B6')
        .expect(200);

      expect(getPortfolioData).toHaveBeenCalledWith('0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6');
      expect(response.body).toMatchObject(mockPortfolioData);
    });
  });

  describe('GET /api-docs', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Ensolv Portfolio API',
        version: '1.0.0',
        description: 'API for aggregating wallet portfolio data across Polygon and Rootstock chains'
      });
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('supportedNetworks');
      expect(response.body.supportedNetworks).toEqual(['polygon', 'rootstock']);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found',
        message: 'The endpoint GET /non-existent-route does not exist'
      });
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      getPortfolioData.mockResolvedValueOnce(mockPortfolioData);

      const startTime = Date.now();
      await request(app)
        .get('/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});