import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';
import { ethers } from 'ethers';
import { getPriceFeedId } from './tokenMappings.js';

// Environment variables (set in .env file)
const {
  POLYGON_SUBGRAPH_URL,
  ROOTSTOCK_SUBGRAPH_URL,
  PYTH_PRICE_API,
  ETHEREUM_RPC_URL,
  CACHE_TTL_SECONDS = 60
} = process.env;

// Simple in-memory cache
const cache = new Map();

function setCache(key, value) {
  cache.set(key, { value, expiry: Date.now() + CACHE_TTL_SECONDS * 1000 });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

// Enhanced GraphQL queries with liquidity pool positions
const polygonQuery = gql`
  query PolygonPortfolio($user: String!) {
    tokenBalances(where: { user: $user, balance_gt: "0" }) {
      token {
        id
        symbol
        decimals
        name
      }
      balance
    }
    liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: "0" }) {
      pair {
        id
        token0 {
          id
          symbol
          decimals
          name
        }
        token1 {
          id
          symbol
          decimals
          name
        }
        reserve0
        reserve1
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`;

const rootstockQuery = gql`
  query RootstockPortfolio($user: String!) {
    tokenPositions(where: { user: $user, balance_gt: "0" }) {
      token {
        id
        symbol
        decimals
        name
      }
      balance
    }
    liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: "0" }) {
      pair {
        id
        token0 {
          id
          symbol
          decimals
          name
        }
        token1 {
          id
          symbol
          decimals
          name
        }
        reserve0
        reserve1
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`;

async function fetchPolygonData(address) {
  try {
    // Check if we have a valid subgraph URL
    if (!POLYGON_SUBGRAPH_URL || POLYGON_SUBGRAPH_URL.includes('[api-key]') || POLYGON_SUBGRAPH_URL.includes('demo')) {
      console.log('Using mock Polygon data - no valid subgraph URL configured');
      return {
        tokenBalances: [
          {
            token: {
              id: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
              symbol: 'USDC',
              decimals: 6,
              name: 'USD Coin'
            },
            balance: '1000500000' // 1000.5 USDC
          },
          {
            token: {
              id: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
              symbol: 'WMATIC',
              decimals: 18,
              name: 'Wrapped Matic'
            },
            balance: '312750000000000000000' // 312.75 WMATIC
          }
        ],
        liquidityPositions: []
      };
    }

    const client = new GraphQLClient(POLYGON_SUBGRAPH_URL);
    const data = await client.request(polygonQuery, { user: address.toLowerCase() });
    return {
      tokenBalances: data.tokenBalances || [],
      liquidityPositions: data.liquidityPositions || []
    };
  } catch (error) {
    console.error('Error fetching Polygon data:', error.message);
    return { tokenBalances: [], liquidityPositions: [] };
  }
}

async function fetchRootstockData(address) {
  try {
    // Check if we have a valid subgraph URL
    if (!ROOTSTOCK_SUBGRAPH_URL || ROOTSTOCK_SUBGRAPH_URL.includes('[api-key]') || ROOTSTOCK_SUBGRAPH_URL.includes('demo')) {
      console.log('Using mock Rootstock data - no valid subgraph URL configured');
      return {
        tokenPositions: [
          {
            token: {
              id: '0x542fda317318ebf1d3deaf76e0b632741a7e677d',
              symbol: 'RBTC',
              decimals: 18,
              name: 'Rootstock BTC'
            },
            balance: '1000000000000000000' // 1.0 RBTC
          }
        ],
        liquidityPositions: []
      };
    }

    const client = new GraphQLClient(ROOTSTOCK_SUBGRAPH_URL);
    const data = await client.request(rootstockQuery, { user: address.toLowerCase() });
    return {
      tokenPositions: data.tokenPositions || [],
      liquidityPositions: data.liquidityPositions || []
    };
  } catch (error) {
    console.error('Error fetching Rootstock data:', error.message);
    return { tokenPositions: [], liquidityPositions: [] };
  }
}

// Enhanced Pyth price fetching with proper price feed IDs
async function fetchPythPrices(tokenAddresses) {
  try {
    // Get price feed IDs for the token addresses
    const priceFeedIds = tokenAddresses
      .map(address => getPriceFeedId(address))
      .filter(id => id !== null);

    if (priceFeedIds.length === 0) {
      console.log('No price feed IDs found for tokens, using mock prices');
      // Return mock prices for demonstration
      const mockPrices = {};
      tokenAddresses.forEach(address => {
        const addr = address.toLowerCase();
        if (addr === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174') { // USDC
          mockPrices[addr] = 1.0;
        } else if (addr === '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270') { // WMATIC
          mockPrices[addr] = 0.85;
        } else if (addr === '0x542fda317318ebf1d3deaf76e0b632741a7e677d') { // RBTC
          mockPrices[addr] = 65000.0;
        } else {
          mockPrices[addr] = 1.0; // Default price
        }
      });
      return mockPrices;
    }

    // Construct the correct Pyth API URL
    const idsParam = priceFeedIds.map(id => `ids[]=${id}`).join('&');
    const pythUrl = `${PYTH_PRICE_API}/v2/updates/price/latest?${idsParam}`;
    
    console.log(`Fetching prices from Pyth: ${pythUrl}`);

    // Fetch prices from Pyth API
    const response = await axios.get(pythUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });

    const prices = {};
    
    // Map price feed responses back to token addresses
    if (response.data && response.data.parsed) {
      tokenAddresses.forEach(address => {
        const priceFeedId = getPriceFeedId(address);
        if (priceFeedId) {
          const priceData = response.data.parsed.find(feed => feed.id === priceFeedId);
          if (priceData && priceData.price) {
            // Pyth prices come with an exponent, calculate actual price
            const price = parseFloat(priceData.price.price) * Math.pow(10, priceData.price.expo);
            prices[address.toLowerCase()] = price;
          }
        }
      });
    }

    return prices;
  } catch (error) {
    console.error('Error fetching Pyth prices:', error.message);
    // Return mock prices as fallback
    const mockPrices = {};
    tokenAddresses.forEach(address => {
      const addr = address.toLowerCase();
      if (addr === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174') { // USDC
        mockPrices[addr] = 1.0;
      } else if (addr === '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270') { // WMATIC
        mockPrices[addr] = 0.85;
      } else if (addr === '0x542fda317318ebf1d3deaf76e0b632741a7e677d') { // RBTC
        mockPrices[addr] = 65000.0;
      } else {
        mockPrices[addr] = 1.0; // Default price
      }
    });
    return mockPrices;
  }
}

// Helper function to calculate liquidity position value
function calculateLiquidityPositionValue(position, prices) {
  const { pair, liquidityTokenBalance } = position;
  const { token0, token1, reserve0, reserve1, totalSupply } = pair;

  if (!totalSupply || totalSupply === '0') return null;

  // Calculate share of the pool
  const poolShare = parseFloat(liquidityTokenBalance) / parseFloat(totalSupply);
  
  // Calculate token amounts owned
  const token0Amount = poolShare * parseFloat(ethers.formatUnits(reserve0, token0.decimals));
  const token1Amount = poolShare * parseFloat(ethers.formatUnits(reserve1, token1.decimals));

  // Calculate USD values
  const token0Price = prices[token0.id.toLowerCase()] || 0;
  const token1Price = prices[token1.id.toLowerCase()] || 0;
  
  const token0Value = token0Amount * token0Price;
  const token1Value = token1Amount * token1Price;
  const totalValue = token0Value + token1Value;

  return {
    pairAddress: pair.id,
    token0: {
      address: token0.id,
      symbol: token0.symbol,
      amount: token0Amount,
      usdValue: token0Value
    },
    token1: {
      address: token1.id,
      symbol: token1.symbol,
      amount: token1Amount,
      usdValue: token1Value
    },
    totalUsdValue: totalValue,
    poolShare: poolShare * 100 // percentage
  };
}

export async function getPortfolioData(address) {
  try {
    // Validate address format
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address format');
  }

    // Check cache first
    const cached = getCache(address);
    if (cached) {
      console.log(`Cache hit for address: ${address}`);
      return cached;
    }

    console.log(`Fetching portfolio data for address: ${address}`);

    // Fetch data from both chains
    const [polygonData, rootstockData] = await Promise.all([
      fetchPolygonData(address),
      fetchRootstockData(address)
    ]);

    // Collect all unique token addresses for price fetching
    const tokenAddresses = new Set();
    
    // Add token addresses from balances
    polygonData.tokenBalances.forEach(balance => tokenAddresses.add(balance.token.id));
    rootstockData.tokenPositions.forEach(position => tokenAddresses.add(position.token.id));
    
    // Add token addresses from liquidity positions
    polygonData.liquidityPositions.forEach(position => {
      tokenAddresses.add(position.pair.token0.id);
      tokenAddresses.add(position.pair.token1.id);
    });
    rootstockData.liquidityPositions.forEach(position => {
      tokenAddresses.add(position.pair.token0.id);
      tokenAddresses.add(position.pair.token1.id);
    });

    // Fetch prices for all tokens
    const prices = await fetchPythPrices(Array.from(tokenAddresses));

    // Process token balances
    const tokenHoldings = [];
    let totalPortfolioValue = 0;

    // Process Polygon token balances
    polygonData.tokenBalances.forEach(balance => {
      const amount = parseFloat(ethers.formatUnits(balance.balance, balance.token.decimals));
      const price = prices[balance.token.id.toLowerCase()] || 0;
      const usdValue = amount * price;
      
      tokenHoldings.push({
        network: 'polygon',
        address: balance.token.id,
        symbol: balance.token.symbol,
        name: balance.token.name,
        decimals: balance.token.decimals,
        amount: amount.toString(),
        price: price,
        usdValue: usdValue,
        type: 'token'
      });
      
      totalPortfolioValue += usdValue;
    });

    // Process Rootstock token positions
    rootstockData.tokenPositions.forEach(position => {
      const amount = parseFloat(ethers.formatUnits(position.balance, position.token.decimals));
      const price = prices[position.token.id.toLowerCase()] || 0;
      const usdValue = amount * price;
      
      tokenHoldings.push({
        network: 'rootstock',
        address: position.token.id,
        symbol: position.token.symbol,
        name: position.token.name,
        decimals: position.token.decimals,
        amount: amount.toString(),
        price: price,
        usdValue: usdValue,
        type: 'token'
      });
      
      totalPortfolioValue += usdValue;
    });

    // Process liquidity positions
    const liquidityPositions = [];

    // Process Polygon liquidity positions
    polygonData.liquidityPositions.forEach(position => {
      const lpValue = calculateLiquidityPositionValue(position, prices);
      if (lpValue) {
        liquidityPositions.push({
          network: 'polygon',
          type: 'liquidity_position',
          ...lpValue
        });
        totalPortfolioValue += lpValue.totalUsdValue;
      }
    });

    // Process Rootstock liquidity positions
    rootstockData.liquidityPositions.forEach(position => {
      const lpValue = calculateLiquidityPositionValue(position, prices);
      if (lpValue) {
        liquidityPositions.push({
          network: 'rootstock',
          type: 'liquidity_position',
          ...lpValue
        });
        totalPortfolioValue += lpValue.totalUsdValue;
      }
    });

    // Calculate totals by network
    const polygonTotal = tokenHoldings
      .filter(h => h.network === 'polygon')
      .reduce((sum, h) => sum + h.usdValue, 0) +
      liquidityPositions
        .filter(lp => lp.network === 'polygon')
        .reduce((sum, lp) => sum + lp.totalUsdValue, 0);

    const rootstockTotal = tokenHoldings
      .filter(h => h.network === 'rootstock')
      .reduce((sum, h) => sum + h.usdValue, 0) +
      liquidityPositions
        .filter(lp => lp.network === 'rootstock')
        .reduce((sum, lp) => sum + lp.totalUsdValue, 0);

    const portfolio = {
      address: address,
      updatedAt: new Date().toISOString(),
      summary: {
        totalUsdValue: totalPortfolioValue,
        networkTotals: {
          polygon: polygonTotal,
          rootstock: rootstockTotal
        },
        tokenCount: tokenHoldings.length,
        liquidityPositionCount: liquidityPositions.length
      },
      tokenHoldings: tokenHoldings,
      liquidityPositions: liquidityPositions
    };

    // Cache the result
    setCache(address, portfolio);
    console.log(`Portfolio data cached for address: ${address}`);
    
    return portfolio;

  } catch (error) {
    console.error('Error in getPortfolioData:', error.message);
    throw error;
  }
}