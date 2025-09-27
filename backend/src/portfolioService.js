import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';
import { ethers } from 'ethers';

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

// GraphQL queries
const polygonQuery = gql`
  query ERC20Balances($user: String!) {
    tokenBalances(where: { user: $user }) {
      token {
        id
        symbol
        decimals
      }
      balance
    }
  }
`;

const rootstockQuery = gql`
  query RskPositions($user: String!) {
    tokenPositions(where: { user: $user }) {
      token {
        id
        symbol
        decimals
      }
      balance
    }
  }
`;

async function fetchPolygonData(address) {
  const client = new GraphQLClient(POLYGON_SUBGRAPH_URL);
  const data = await client.request(polygonQuery, { user: address });
  return data.tokenBalances || [];
}

async function fetchRootstockData(address) {
  const client = new GraphQLClient(ROOTSTOCK_SUBGRAPH_URL);
  const data = await client.request(rootstockQuery, { user: address });
  return data.tokenPositions || [];
}

async function fetchPrices(symbols) {
  // Example: assume PYTH_PRICE_API expects comma-separated symbol list
  try {
    const resp = await axios.get(`${PYTH_PRICE_API}?symbols=${symbols.join(',')}`);
    return resp.data; // { symbol: price }
  } catch (err) {
    console.error('Price fetch error', err.message);
    return {};
  }
}

export async function getPortfolioData(address) {
  // Check cache first
  const cached = getCache(address);
  if (cached) return cached;

  const [polygonBalances, rootstockPositions] = await Promise.all([
    fetchPolygonData(address),
    fetchRootstockData(address)
  ]);

  // Collect unique symbols
  const symbols = [
    ...polygonBalances.map(b => b.token.symbol),
    ...rootstockPositions.map(p => p.token.symbol)
  ];

  const prices = await fetchPrices([...new Set(symbols)]);

  const holdings = [];

  polygonBalances.forEach(b => {
    const amount = ethers.utils.formatUnits(b.balance, b.token.decimals);
    holdings.push({
      network: 'polygon',
      token: b.token.symbol,
      amount,
      usdValue: prices[b.token.symbol] ? parseFloat(amount) * prices[b.token.symbol] : null
    });
  });

  rootstockPositions.forEach(p => {
    const amount = ethers.utils.formatUnits(p.balance, p.token.decimals);
    holdings.push({
      network: 'rootstock',
      token: p.token.symbol,
      amount,
      usdValue: prices[p.token.symbol] ? parseFloat(amount) * prices[p.token.symbol] : null
    });
  });

  const portfolio = {
    address,
    updatedAt: new Date().toISOString(),
    holdings
  };

  setCache(address, portfolio);
  return portfolio;
}