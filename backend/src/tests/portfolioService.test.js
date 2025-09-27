import { jest } from '@jest/globals';
import { getPortfolioData } from '../portfolioService.js';

// Mock the dependencies
const mockGetPriceFeedId = jest.fn();
const mockAxiosGet = jest.fn();

jest.unstable_mockModule('../tokenMappings.js', () => ({
  getPriceFeedId: mockGetPriceFeedId
}));

jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet
  }
}));

jest.unstable_mockModule('graphql-request', () => {
  const mockGraphQLClient = {
    request: jest.fn()
  };
  
  return {
    GraphQLClient: jest.fn(() => mockGraphQLClient),
    gql: jest.fn((query) => query)
  };
});

// Get the mocked GraphQLClient instance
const { GraphQLClient } = await import('graphql-request');
const mockGraphQLClient = new GraphQLClient();

// Clear cache function
async function clearPortfolioCache() {
  // Access the cache from the module
  const portfolioModule = await import('../portfolioService.js');
  if (portfolioModule.cache) {
    portfolioModule.cache.clear();
  }
}



// Mock GraphQL responses
const mockPolygonResponse = {
  tokenBalances: [
    {
      token: {
        id: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin'
      },
      balance: '1000000000'
    }
  ],
  liquidityPositions: [
    {
      pair: {
        id: '0xpair123',
        token0: {
          id: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin'
        },
        token1: {
          id: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
          symbol: 'WMATIC',
          decimals: 18,
          name: 'Wrapped Matic'
        },
        reserve0: '1000000000000',
        reserve1: '1000000000000000000000',
        totalSupply: '1000000000000000000'
      },
      liquidityTokenBalance: '100000000000000000'
    }
  ]
};

const mockRootstockResponse = {
  tokenPositions: [
    {
      token: {
        id: '0x542fda317318ebf1d3deaf76e0b632741a7e677d',
        symbol: 'RBTC',
        decimals: 18,
        name: 'Rootstock BTC'
      },
      balance: '1000000000000000000'
    }
  ],
  liquidityPositions: []
};

const mockPythResponse = {
  data: {
    parsed: [
      {
        id: 'crypto.USDC/USD',
        price: {
          price: '100000000',
          expo: -8
        }
      },
      {
        id: 'crypto.MATIC/USD',
        price: {
          price: '80000000',
          expo: -8
        }
      },
      {
        id: 'crypto.BTC/USD',
        price: {
          price: '4500000000000',
          expo: -8
        }
      }
    ]
  }
};

describe('Portfolio Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup getPriceFeedId mock
    mockGetPriceFeedId.mockImplementation((address) => {
      const mappings = {
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'crypto.USDC/USD',
        '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 'crypto.MATIC/USD',
        '0x542fda317318ebf1d3deaf76e0b632741a7e677d': 'crypto.BTC/USD'
      };
      return mappings[address.toLowerCase()] || null;
    });

    // Clear any cached data between tests
    if (global.portfolioCache) {
      global.portfolioCache.clear();
    }
    
    // Reset mock implementations to default behavior
    mockGraphQLClient.request.mockReset();
    mockAxiosGet.mockReset();
  });

  describe('getPortfolioData', () => {
    it('should fetch and aggregate portfolio data successfully', async () => {
      // Setup mocks
      mockGraphQLClient.request
        .mockResolvedValueOnce(mockPolygonResponse)
        .mockResolvedValueOnce(mockRootstockResponse);

      mockAxiosGet.mockResolvedValueOnce(mockPythResponse);

      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const result = await getPortfolioData(testAddress);

      // Verify structure
      expect(result).toHaveProperty('address', testAddress);
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('tokenHoldings');
      expect(result).toHaveProperty('liquidityPositions');

      // Verify summary
      expect(result.summary).toHaveProperty('totalUsdValue');
      expect(result.summary).toHaveProperty('networkTotals');
      expect(result.summary.networkTotals).toHaveProperty('polygon');
      expect(result.summary.networkTotals).toHaveProperty('rootstock');

      // Verify token holdings
      expect(result.tokenHoldings).toHaveLength(2);

      const usdcHolding = result.tokenHoldings.find(h => h.symbol === 'USDC');
      expect(usdcHolding).toBeDefined();
      expect(usdcHolding.network).toBe('polygon');
      expect(usdcHolding.amount).toBe('1000');
      expect(usdcHolding.usdValue).toBe(1000); // 1000 USDC * $1

      const rbtcHolding = result.tokenHoldings.find(h => h.symbol === 'RBTC');
      expect(rbtcHolding).toBeDefined();
      expect(rbtcHolding.network).toBe('rootstock');
      expect(rbtcHolding.amount).toBe('1');
      expect(rbtcHolding.usdValue).toBe(45000);

      // Verify liquidity positions
      expect(result.liquidityPositions).toHaveLength(1);
      const lpPosition = result.liquidityPositions[0];
      expect(lpPosition.network).toBe('polygon');
      expect(lpPosition.type).toBe('liquidity_position');
    });

    it('should handle invalid address format', async () => {
      const invalidAddress = 'invalid-address';

      await expect(getPortfolioData(invalidAddress))
        .rejects
        .toThrow('Invalid Ethereum address format');
    });

    it('should handle GraphQL errors gracefully', async () => {
      mockGraphQLClient.request
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockRootstockResponse);

      mockAxiosGet.mockResolvedValueOnce(mockPythResponse);

      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

      const result = await getPortfolioData(testAddress);

      // Should still return data from Rootstock even if Polygon fails
      expect(result.tokenHoldings).toHaveLength(1);
      expect(result.tokenHoldings[0].symbol).toBe('RBTC');
    });

    it('should handle Pyth API errors gracefully', async () => {
      mockGraphQLClient.request
        .mockResolvedValueOnce(mockPolygonResponse)
        .mockResolvedValueOnce(mockRootstockResponse);

      mockAxiosGet.mockRejectedValueOnce(new Error('Pyth API error'));

      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const result = await getPortfolioData(testAddress);

      // Should return data with mock prices as fallback
      expect(result.tokenHoldings).toHaveLength(2);
      
      // Find USDC holding
      const usdcHolding = result.tokenHoldings.find(h => h.symbol === 'USDC');
      expect(usdcHolding.price).toBe(1.0); // Mock price for USDC
      expect(usdcHolding.usdValue).toBe(1000); // 1000 USDC * $1.0
      
      // Find RBTC holding  
      const rbtcHolding = result.tokenHoldings.find(h => h.symbol === 'RBTC');
      expect(rbtcHolding.price).toBe(65000.0); // Mock price for RBTC
      expect(rbtcHolding.usdValue).toBe(65000); // 1 RBTC * $65000
    });

    it('should use cache for subsequent requests', async () => {
      // Setup mocks for both calls (in case cache doesn't work)
      mockGraphQLClient.request
        .mockResolvedValue(mockPolygonResponse)
        .mockResolvedValue(mockRootstockResponse);

      mockAxiosGet.mockResolvedValue(mockPythResponse);

      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

      // First call
      const result1 = await getPortfolioData(testAddress);

      // Second call should use cache
      const result2 = await getPortfolioData(testAddress);

      expect(result1).toEqual(result2);

      // GraphQL should only be called once for each network (2 total)
      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(2);
      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('Price calculation', () => {
    it('should correctly calculate USD values with different decimals', async () => {
      const customPolygonResponse = {
        tokenBalances: [
          {
            token: {
              id: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
              symbol: 'USDC',
              decimals: 6,
              name: 'USD Coin'
            },
            balance: '1500000' // 1.5 USDC
          }
        ],
        liquidityPositions: []
      };

      const emptyRootstockResponse = { 
        tokenPositions: [], 
        liquidityPositions: [] 
      };

      mockGraphQLClient.request
        .mockResolvedValueOnce(customPolygonResponse)
        .mockResolvedValueOnce(emptyRootstockResponse);

      mockAxiosGet.mockResolvedValueOnce(mockPythResponse);

      const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const result = await getPortfolioData(testAddress);

      expect(result.tokenHoldings).toHaveLength(1);
      const usdcHolding = result.tokenHoldings.find(h => h.symbol === 'USDC');
      expect(usdcHolding.amount).toBe('1.5');
      expect(usdcHolding.usdValue).toBe(1.5); // 1.5 USDC * $1
    });
  });
});
