import { ethers } from "ethers";
import type { PortfolioData, TokenHolding } from "../types/portfolio";

// Free API endpoints (no API key required for basic usage)
const COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY || "demo";
const ETHEREUM_RPC =
  import.meta.env.VITE_ETHEREUM_RPC_URL || "https://eth.llamarpc.com";
const POLYGON_RPC =
  import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PRICE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for prices
const cache = new Map<string, { data: any; timestamp: number }>();
const priceCache = new Map<string, { data: TokenPrice; timestamp: number }>();

// Rate limiting
const RATE_LIMIT_DELAY = 200; // ms between requests
const MAX_RETRIES = 3;
const BATCH_SIZE = 50; // tokens per batch

// Chain IDs
const CHAIN_IDS = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
};

// Token list for common tokens (fallback if API fails)
const COMMON_TOKENS: {
  [network: string]: {
    [address: string]: {
      symbol: string;
      name: string;
      decimals: number;
    };
  };
} = {
  ethereum: {
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": {
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
    },
  },
  polygon: {
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": {
      symbol: "WMATIC",
      name: "Wrapped MATIC",
      decimals: 18,
    },
  },
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

interface TokenPrice {
  usd: number;
  usd_24h_change?: number;
}

interface ApiError extends Error {
  code?: string;
  status?: number;
  retryable?: boolean;
}

export class RealPortfolioAPI {
  private static providers = {
    ethereum: new ethers.JsonRpcProvider(ETHEREUM_RPC),
    polygon: new ethers.JsonRpcProvider(POLYGON_RPC),
  };

  private static nativeTokens = {
    ethereum: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      coingeckoId: "ethereum",
    },
    polygon: {
      symbol: "MATIC",
      name: "Polygon",
      decimals: 18,
      coingeckoId: "matic-network",
    },
  };

  /**
   * Cache management
   */
  private static getFromCache(key: string): any | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  private static setCache(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  private static getPriceFromCache(key: string): TokenPrice | null {
    const cached = priceCache.get(key);
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
      return cached.data;
    }
    priceCache.delete(key);
    return null;
  }

  private static setPriceCache(key: string, data: TokenPrice): void {
    priceCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Sleep utility for rate limiting
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's not retryable
        if (error instanceof Error && (error as ApiError).retryable === false) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  /**
   * Fetch real portfolio data for a wallet address
   */
  static async getPortfolio(address: string): Promise<PortfolioData> {
    const startTime = Date.now();

    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        throw new Error("Invalid Ethereum address");
      }

      // Check cache first
      const cacheKey = `portfolio:${address}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log("Returning cached portfolio for:", address);
        return cached;
      }

      console.log("Fetching real portfolio for:", address);

      // Fetch data from multiple chains in parallel
      const [ethereumData, polygonData] = await Promise.allSettled([
        this.fetchChainData(address, "ethereum"),
        this.fetchChainData(address, "polygon"),
      ]);

      // Process results
      const allTokens: TokenHolding[] = [];
      const networkTotals = { ethereum: 0, polygon: 0, rootstock: 0 };

      if (ethereumData.status === "fulfilled" && ethereumData.value) {
        allTokens.push(...ethereumData.value);
        networkTotals.ethereum = ethereumData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
      }

      if (polygonData.status === "fulfilled" && polygonData.value) {
        allTokens.push(...polygonData.value);
        networkTotals.polygon = polygonData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
      }

      // Sort by USD value
      allTokens.sort((a, b) => b.usdValue - a.usdValue);

      // Calculate totals
      const totalUsdValue = allTokens.reduce(
        (sum, token) => sum + token.usdValue,
        0,
      );

      // Build portfolio data
      const portfolioData: PortfolioData = {
        address,
        summary: {
          totalUsdValue,
          tokenCount: allTokens.length,
          liquidityPositionCount: 0,
          networkTotals,
        },
        tokenHoldings: allTokens,
        liquidityPositions: [],
        updatedAt: new Date().toISOString(),
        metadata: {
          responseTime: `${Date.now() - startTime}ms`,
          dataSource: "blockchain",
          networks: Object.keys(networkTotals).filter(
            (k) => networkTotals[k as keyof typeof networkTotals] > 0,
          ),
        },
      };

      // Cache the result
      this.setCache(cacheKey, portfolioData);

      return portfolioData;
    } catch (error) {
      console.error("Portfolio fetch error:", error);
      throw error;
    }
  }

  /**
   * Fetch token data for a specific chain
   */
  private static async fetchChainData(
    address: string,
    network: "ethereum" | "polygon",
  ): Promise<TokenHolding[]> {
    try {
      const tokens: TokenHolding[] = [];

      // Get native token balance
      const nativeBalance = await this.getNativeBalance(address, network);
      if (nativeBalance > 0) {
        const nativeInfo = this.nativeTokens[network];
        const price = await this.getTokenPrice(nativeInfo.coingeckoId);

        tokens.push({
          symbol: nativeInfo.symbol,
          name: nativeInfo.name,
          address: "native",
          network,
          balance: nativeBalance.toString(),
          decimals: nativeInfo.decimals,
          usdValue: nativeBalance * (price?.usd || 0),
          price: price?.usd || 0,
          change24h: price?.usd_24h_change || 0,
        });
      }

      // Try multiple discovery methods
      const discoveryMethods = [
        () => this.fetchTokenBalancesCovalent(address, network),
        () => this.discoverTokensAdvanced(address, network),
        () => this.fetchCommonTokenBalances(address, network),
      ];

      let tokenBalances: TokenHolding[] = [];
      let lastError: Error | null = null;

      for (const method of discoveryMethods) {
        try {
          tokenBalances = await this.withRetry(method);
          tokens.push(...tokenBalances);
          break; // Success, no need to try other methods
        } catch (error) {
          lastError = error as Error;
          console.log(`Token discovery method failed for ${network}:`, error);
          await this.sleep(RATE_LIMIT_DELAY);
        }
      }

      // If all methods failed but we have some tokens, continue
      if (tokens.length === 0 && lastError) {
        console.warn(
          `All token discovery methods failed for ${network}:`,
          lastError,
        );
      }

      return tokens.filter((token) => token.usdValue > 0.01); // Filter dust
    } catch (error) {
      console.error(`Error fetching ${network} data:`, error);
      return [];
    }
  }

  /**
   * Get native token balance for an address on any chain
   */
  private static async getNativeBalance(
    address: string,
    network: "ethereum" | "polygon",
  ): Promise<number> {
    try {
      const provider = this.providers[network];
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error(`Error fetching ${network} balance:`, error);
      return 0;
    }
  }

  /**
   * Fetch token balances using Covalent API
   */
  private static async fetchTokenBalancesCovalent(
    address: string,
    network: "ethereum" | "polygon" = "ethereum",
  ): Promise<TokenHolding[]> {
    try {
      const chainId = CHAIN_IDS[network];
      const response = await fetch(
        `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?key=${COVALENT_API_KEY}&nft=false&no-nft-fetch=true`,
      );

      if (!response.ok) {
        throw new Error("Covalent API request failed");
      }

      const data = await response.json();

      if (!data.data || !data.data.items) {
        throw new Error("Invalid Covalent response");
      }

      const tokens: TokenHolding[] = [];

      for (const item of data.data.items) {
        // Skip if balance is 0 or it's dust
        if (!item.balance || item.balance === "0") continue;

        // Skip NFTs
        if (item.type === "nft") continue;

        const usdValue = item.quote || 0;

        // Skip dust (less than $0.01)
        if (usdValue < 0.01) continue;

        tokens.push({
          symbol: item.contract_ticker_symbol || "Unknown",
          name: item.contract_name || "Unknown Token",
          address: item.contract_address,
          network,
          balance: item.balance,
          decimals: item.contract_decimals,
          usdValue: usdValue,
          price: item.quote_rate || 0,
          change24h: item.quote_24h || 0,
        });
      }

      return tokens.sort((a, b) => b.usdValue - a.usdValue);
    } catch (error) {
      console.error("Covalent API error:", error);
      throw error;
    }
  }

  /**
   * Advanced token discovery using multiple sources
   */
  private static async discoverTokensAdvanced(
    address: string,
    network: "ethereum" | "polygon",
  ): Promise<TokenHolding[]> {
    const tokens: TokenHolding[] = [];

    try {
      // Try popular token lists
      const tokenListUrls = {
        ethereum: [
          "https://tokens.uniswap.org",
          "https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json",
        ],
        polygon: [
          "https://unpkg.com/quickswap-default-token-list@1.2.20/build/quickswap-default.tokenlist.json",
        ],
      };

      const urls = tokenListUrls[network] || [];

      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;

          const tokenList = await response.json();
          const networkTokens =
            tokenList.tokens?.filter(
              (token: any) => token.chainId === CHAIN_IDS[network],
            ) || [];

          // Check balance for popular tokens (top 20)
          const popularTokens = networkTokens.slice(0, 20);
          const balanceChecks = await this.batchCheckBalances(
            address,
            popularTokens,
            network,
          );

          tokens.push(...balanceChecks);

          if (tokens.length > 0) break; // Found tokens, no need to check other lists
        } catch (error) {
          console.log(`Failed to fetch token list from ${url}:`, error);
        }
      }
    } catch (error) {
      console.error("Advanced token discovery failed:", error);
    }

    return tokens.sort((a, b) => b.usdValue - a.usdValue);
  }

  /**
   * Batch check balances for multiple tokens
   */
  private static async batchCheckBalances(
    address: string,
    tokenList: any[],
    network: "ethereum" | "polygon",
  ): Promise<TokenHolding[]> {
    const tokens: TokenHolding[] = [];
    const provider = this.providers[network];

    // Process in batches to avoid overwhelming the RPC
    for (let i = 0; i < tokenList.length; i += BATCH_SIZE) {
      const batch = tokenList.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (tokenInfo) => {
        try {
          const contract = new ethers.Contract(
            tokenInfo.address,
            ERC20_ABI,
            provider,
          );
          const balance = await contract.balanceOf(address);

          if (balance > 0n) {
            const formattedBalance = parseFloat(
              ethers.formatUnits(balance, tokenInfo.decimals),
            );

            // Get price (with caching)
            const price = await this.getTokenPriceByAddress(
              tokenInfo.address,
              network,
            );
            const usdValue = formattedBalance * (price?.usd || 0);

            if (usdValue > 0.01) {
              return {
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                address: tokenInfo.address,
                network,
                balance: balance.toString(),
                decimals: tokenInfo.decimals,
                usdValue,
                price: price?.usd || 0,
                change24h: price?.usd_24h_change || 0,
              };
            }
          }
        } catch (error) {
          // Silently skip failed tokens to avoid noise
          return null;
        }
        return null;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const validTokens: TokenHolding[] = [];
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value !== null) {
          validTokens.push(result.value);
        }
      });

      tokens.push(...validTokens);

      // Rate limiting between batches
      if (i + BATCH_SIZE < tokenList.length) {
        await this.sleep(RATE_LIMIT_DELAY);
      }
    }

    return tokens;
  }

  /**
   * Fetch balances for common tokens using direct RPC calls
   */
  private static async fetchCommonTokenBalances(
    address: string,
    network: "ethereum" | "polygon" = "ethereum",
  ): Promise<TokenHolding[]> {
    const tokens: TokenHolding[] = [];
    const networkTokens = COMMON_TOKENS[network] || {};
    const provider = this.providers[network];

    const tokenAddresses = Object.keys(networkTokens);

    // Process common tokens in batches
    for (let i = 0; i < tokenAddresses.length; i += 10) {
      const batch = tokenAddresses.slice(i, i + 10);

      const batchPromises = batch.map(async (tokenAddress) => {
        const tokenInfo = networkTokens[tokenAddress];
        try {
          const contract = new ethers.Contract(
            tokenAddress,
            ERC20_ABI,
            provider,
          );
          const balance = await contract.balanceOf(address);

          if (balance > 0n) {
            const formattedBalance = parseFloat(
              ethers.formatUnits(balance, tokenInfo.decimals),
            );

            // Get price from cache first
            const cacheKey = `price:${network}:${tokenAddress}`;
            let price = this.getPriceFromCache(cacheKey);

            if (!price) {
              price = await this.getTokenPriceByAddress(tokenAddress, network);
              if (price) {
                this.setPriceCache(cacheKey, price);
              }
            }

            const usdValue = formattedBalance * (price?.usd || 0);

            // Skip dust
            if (usdValue < 0.01) return null;

            return {
              symbol: tokenInfo.symbol,
              name: tokenInfo.name,
              address: tokenAddress,
              network,
              balance: balance.toString(),
              decimals: tokenInfo.decimals,
              usdValue: usdValue,
              price: price?.usd || 0,
              change24h: price?.usd_24h_change || 0,
            };
          }
        } catch (error) {
          console.error(
            `Error fetching balance for ${tokenInfo.symbol}:`,
            error,
          );
        }
        return null;
      });

      const results = await Promise.allSettled(batchPromises);
      const validTokens: TokenHolding[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value !== null) {
          validTokens.push(result.value);
        }
      });

      tokens.push(...validTokens);

      // Rate limiting
      if (i + 10 < tokenAddresses.length) {
        await this.sleep(RATE_LIMIT_DELAY);
      }
    }

    return tokens.sort((a, b) => b.usdValue - a.usdValue);
  }

  /**
   * Get token price from CoinGecko by coin ID
   */
  private static async getTokenPrice(
    coinId: string,
  ): Promise<TokenPrice | null> {
    // Check cache first
    const cacheKey = `coinprice:${coinId}`;
    const cached = this.getPriceFromCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      );

      if (!response.ok) {
        const error = new Error(
          `CoinGecko API request failed: ${response.status}`,
        ) as ApiError;
        error.status = response.status;
        error.retryable = response.status >= 500 || response.status === 429;
        throw error;
      }

      const data = await response.json();

      if (data[coinId]) {
        const price = {
          usd: data[coinId].usd,
          usd_24h_change: data[coinId].usd_24h_change,
        };

        // Cache the result
        this.setPriceCache(cacheKey, price);
        return price;
      }

      return null;
    }).catch((error) => {
      console.error(`Error fetching price for ${coinId}:`, error);
      return null;
    });
  }

  /**
   * Get token price by contract address
   */
  private static async getTokenPriceByAddress(
    address: string,
    network: "ethereum" | "polygon" = "ethereum",
  ): Promise<TokenPrice | null> {
    // Check cache first
    const cacheKey = `tokenprice:${network}:${address.toLowerCase()}`;
    const cached = this.getPriceFromCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const platformId = network === "polygon" ? "polygon-pos" : "ethereum";
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${address}&vs_currencies=usd&include_24hr_change=true`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Token not found, don't retry
          return null;
        }

        const error = new Error(
          `CoinGecko token price request failed: ${response.status}`,
        ) as ApiError;
        error.status = response.status;
        error.retryable = response.status >= 500 || response.status === 429;
        throw error;
      }

      const data = await response.json();
      const lowercaseAddress = address.toLowerCase();

      if (data[lowercaseAddress]) {
        const price = {
          usd: data[lowercaseAddress].usd,
          usd_24h_change: data[lowercaseAddress].usd_24h_change,
        };

        // Cache the result
        this.setPriceCache(cacheKey, price);
        return price;
      }

      return null;
    }).catch((error) => {
      // Only log if it's not a 404 (token not found)
      if (!(error as ApiError).status || (error as ApiError).status !== 404) {
        console.error(
          `Error fetching price for ${address} on ${network}:`,
          error,
        );
      }
      return null;
    });
  }

  /**
   * Fetch multi-chain portfolio - now implemented!
   */
  static async getMultiChainPortfolio(address: string): Promise<PortfolioData> {
    return this.getPortfolio(address);
  }

  /**
   * Clear cache for testing or manual refresh
   */
  static clearCache(): void {
    cache.clear();
    priceCache.clear();
  }

  /**
   * Get supported networks
   */
  static getSupportedNetworks(): string[] {
    return Object.keys(this.providers);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { portfolio: number; prices: number } {
    return {
      portfolio: cache.size,
      prices: priceCache.size,
    };
  }

  /**
   * Validate portfolio data integrity
   */
  static validatePortfolioData(data: PortfolioData): boolean {
    try {
      // Basic validation
      if (!data.address || !ethers.isAddress(data.address)) {
        return false;
      }

      if (!Array.isArray(data.tokenHoldings)) {
        return false;
      }

      // Validate token holdings
      for (const token of data.tokenHoldings) {
        if (
          !token.symbol ||
          !token.address ||
          typeof token.usdValue !== "number"
        ) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed error information with context
   */
  static getLastError(): string | null {
    // This could be expanded to track last errors per address
    return null;
  }

  /**
   * Validate and sanitize wallet address
   */
  static validateAddress(address: string): { valid: boolean; error?: string; sanitized?: string } {
    try {
      if (!address || typeof address !== 'string') {
        return { valid: false, error: 'Address is required' };
      }

      const trimmed = address.trim();
      
      if (trimmed.length === 0) {
        return { valid: false, error: 'Address cannot be empty' };
      }

      if (!ethers.isAddress(trimmed)) {
        return { valid: false, error: 'Invalid Ethereum address format' };
      }

      return { valid: true, sanitized: ethers.getAddress(trimmed) };
    } catch (error) {
      return { valid: false, error: `Address validation failed: ${(error as Error).message}` };
    }
  }

  /**
   * Get comprehensive portfolio summary with additional metrics
   */
  static async getPortfolioSummary(address: string): Promise<{
    totalValue: number;
    topTokens: TokenHolding[];
    networkDistribution: Record<string, number>;
    riskMetrics: {
      concentration: number; // How concentrated the portfolio is (0-1)
      volatility: number; // Average 24h change weighted by value
    };
  }> {
    const portfolio = await this.getPortfolio(address);
    
    const topTokens = [...portfolio.tokenHoldings]
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 5);

    const networkDistribution: Record<string, number> = {};
    portfolio.tokenHoldings.forEach(token => {
      networkDistribution[token.network] = (networkDistribution[token.network] || 0) + token.usdValue;
    });

    // Calculate concentration (Herfindahl index)
    const totalValue = portfolio.summary.totalUsdValue;
    const concentration = totalValue > 0 
      ? portfolio.tokenHoldings.reduce((sum, token) => {
          const share = token.usdValue / totalValue;
          return sum + (share * share);
        }, 0)
      : 0;

    // Calculate weighted volatility
    const volatility = totalValue > 0
      ? portfolio.tokenHoldings.reduce((sum, token) => {
          const weight = token.usdValue / totalValue;
          return sum + (weight * Math.abs(token.change24h || 0));
        }, 0)
      : 0;

    return {
      totalValue,
      topTokens,
      networkDistribution,
      riskMetrics: {
        concentration,
        volatility,
      },
    };
  }

  /**
   * Compare two portfolios
   */
  static comparePortfolios(portfolio1: PortfolioData, portfolio2: PortfolioData): {
    valueDifference: number;
    tokenChanges: {
      added: TokenHolding[];
      removed: TokenHolding[];
      changed: Array<{ token: TokenHolding; oldValue: number; newValue: number }>;
    };
  } {
    const valueDifference = portfolio2.summary.totalUsdValue - portfolio1.summary.totalUsdValue;
    
    const tokens1Map = new Map(portfolio1.tokenHoldings.map(t => [`${t.address}-${t.network}`, t]));
    const tokens2Map = new Map(portfolio2.tokenHoldings.map(t => [`${t.address}-${t.network}`, t]));
    
    const added: TokenHolding[] = [];
    const removed: TokenHolding[] = [];
    const changed: Array<{ token: TokenHolding; oldValue: number; newValue: number }> = [];

    // Find added and changed tokens
    for (const [key, token] of tokens2Map) {
      const oldToken = tokens1Map.get(key);
      if (!oldToken) {
        added.push(token);
      } else if (Math.abs(oldToken.usdValue - token.usdValue) > 0.01) {
        changed.push({ token, oldValue: oldToken.usdValue, newValue: token.usdValue });
      }
    }

    // Find removed tokens
    for (const [key, token] of tokens1Map) {
      if (!tokens2Map.has(key)) {
        removed.push(token);
      }
    }

    return {
      valueDifference,
      tokenChanges: { added, removed, changed },
    };
  }

  /**
   * Export portfolio data to CSV
   */
  static exportToCSV(portfolioData: PortfolioData): string {
    const headers = ['Symbol', 'Name', 'Network', 'Balance', 'USD Value', 'Price', '24h Change', 'Address'];
    const rows = portfolioData.tokenHoldings.map(token => [
      token.symbol,
      token.name,
      token.network,
      parseFloat(ethers.formatUnits(token.balance, token.decimals)).toString(),
      token.usdValue.toString(),
      token.price.toString(),
      `${token.change24h}%`,
      token.address,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get portfolio performance metrics
   */
  static getPerformanceMetrics(portfolioData: PortfolioData): {
    total24hChange: number;
    bestPerformer: TokenHolding | null;
    worstPerformer: TokenHolding | null;
    averageChange: number;
  } {
    const tokens = portfolioData.tokenHoldings.filter(t => t.usdValue > 1); // Filter out dust
    
    if (tokens.length === 0) {
      return { total24hChange: 0, bestPerformer: null, worstPerformer: null, averageChange: 0 };
    }

    const totalValue = tokens.reduce((sum, token) => sum + token.usdValue, 0);
    const total24hChange = tokens.reduce((sum, token) => {
      const weight = token.usdValue / totalValue;
      return sum + (weight * (token.change24h || 0));
    }, 0);

    const bestPerformer = tokens.reduce((best, token) => 
      (token.change24h || 0) > (best?.change24h || -Infinity) ? token : best
    );

    const worstPerformer = tokens.reduce((worst, token) => 
      (token.change24h || 0) < (worst?.change24h || Infinity) ? token : worst
    );

    const averageChange = tokens.reduce((sum, token) => sum + (token.change24h || 0), 0) / tokens.length;

    return {
      total24hChange,
      bestPerformer,
      worstPerformer,
      averageChange,
    };
  }
}

// Export as default for easy migration
export default RealPortfolioAPI;
