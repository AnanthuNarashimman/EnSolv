import { ethers } from "ethers";
import type { PortfolioData, TokenHolding } from "../types/portfolio";

// Free API endpoints (no API key required for basic usage)
const COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY || "demo";
const ETHEREUM_RPC =
  import.meta.env.VITE_ETHEREUM_RPC_URL || "https://eth.llamarpc.com";
const POLYGON_RPC =
  import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com";
const BASE_RPC =
  import.meta.env.VITE_BASE_RPC_URL || "https://mainnet.base.org";
const ARBITRUM_RPC =
  import.meta.env.VITE_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";
const OPTIMISM_RPC =
  import.meta.env.VITE_OPTIMISM_RPC_URL || "https://mainnet.optimism.io";
const BSC_RPC =
  import.meta.env.VITE_BSC_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const AVALANCHE_RPC =
  import.meta.env.VITE_AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";
const FANTOM_RPC =
  import.meta.env.VITE_FANTOM_RPC_URL || "https://rpc.ftm.tools";
const LINEA_RPC =
  import.meta.env.VITE_LINEA_RPC_URL || "https://rpc.linea.build";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PRICE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for prices
const cache = new Map<string, { data: unknown; timestamp: number }>();
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
  bsc: 56,
  avalanche: 43114,
  solana: 101, // Solana mainnet
  fantom: 250,
  linea: 59144,
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
  bsc: {
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c": {
      symbol: "WBNB",
      name: "Wrapped BNB",
      decimals: 18,
    },
    "0x55d398326f99059fF775485246999027B3197955": {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 18,
    },
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 18,
    },
    "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3": {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c": {
      symbol: "BTCB",
      name: "Bitcoin BEP2",
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
    base: new ethers.JsonRpcProvider(BASE_RPC),
    arbitrum: new ethers.JsonRpcProvider(ARBITRUM_RPC),
    optimism: new ethers.JsonRpcProvider(OPTIMISM_RPC),
    bsc: new ethers.JsonRpcProvider(BSC_RPC),
    avalanche: new ethers.JsonRpcProvider(AVALANCHE_RPC),
    fantom: new ethers.JsonRpcProvider(FANTOM_RPC),
    linea: new ethers.JsonRpcProvider(LINEA_RPC),
    // Note: Solana uses different RPC format, will handle separately
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
    base: {
      symbol: "ETH",
      name: "Base ETH",
      decimals: 18,
      coingeckoId: "ethereum",
    },
    arbitrum: {
      symbol: "ETH",
      name: "Arbitrum ETH",
      decimals: 18,
      coingeckoId: "ethereum",
    },
    optimism: {
      symbol: "ETH",
      name: "Optimism ETH",
      decimals: 18,
      coingeckoId: "ethereum",
    },
    bsc: {
      symbol: "BNB",
      name: "BNB",
      decimals: 18,
      coingeckoId: "binancecoin",
    },
    avalanche: {
      symbol: "AVAX",
      name: "Avalanche",
      decimals: 18,
      coingeckoId: "avalanche-2",
    },
    solana: {
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      coingeckoId: "solana",
    },
    fantom: {
      symbol: "FTM",
      name: "Fantom",
      decimals: 18,
      coingeckoId: "fantom",
    },
    linea: {
      symbol: "ETH",
      name: "Linea ETH",
      decimals: 18,
      coingeckoId: "ethereum",
    },
  };

  /**
   * Cache management
   */
  private static getFromCache(key: string): unknown | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  private static setCache(key: string, data: unknown): void {
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
        return cached as PortfolioData;
      }

      console.log("🔍 Fetching real portfolio for:", address);

      // Fetch data from multiple chains in parallel
      const [ethereumData, polygonData, baseData, arbitrumData, optimismData, bscData, avalancheData, fantomData, lineaData, solanaData] = await Promise.allSettled([
        this.fetchChainData(address, "ethereum"),
        this.fetchChainData(address, "polygon"),
        this.fetchChainData(address, "base"),
        this.fetchChainData(address, "arbitrum"),
        this.fetchChainData(address, "optimism"),
        this.fetchChainData(address, "bsc"),
        this.fetchChainData(address, "avalanche"),
        this.fetchChainData(address, "fantom"),
        this.fetchChainData(address, "linea"),
        this.fetchSolanaData(address),
      ]);

      // Process results
      const allTokens: TokenHolding[] = [];
      const networkTotals = { 
        ethereum: 0, 
        polygon: 0, 
        rootstock: 0, 
        base: 0, 
        arbitrum: 0, 
        optimism: 0, 
        bsc: 0, 
        avalanche: 0,
        solana: 0,
        fantom: 0,
        linea: 0
      };

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

      if (baseData.status === "fulfilled" && baseData.value) {
        console.log("✅ Base data received:", baseData.value);
        allTokens.push(...baseData.value);
        networkTotals.base = baseData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
        console.log("💰 Base network total:", networkTotals.base);
      } else {
        console.log("❌ Base data failed:", baseData.status === "rejected" ? baseData.reason : "No data");
      }

      if (arbitrumData.status === "fulfilled" && arbitrumData.value) {
        allTokens.push(...arbitrumData.value);
        networkTotals.arbitrum = arbitrumData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
      }

      if (optimismData.status === "fulfilled" && optimismData.value) {
        allTokens.push(...optimismData.value);
        networkTotals.optimism = optimismData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
      }

      if (bscData.status === "fulfilled" && bscData.value) {
        console.log("✅ BSC data received:", bscData.value);
        allTokens.push(...bscData.value);
        networkTotals.bsc = bscData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
        console.log("💰 BSC network total:", networkTotals.bsc);
      } else {
        console.log("❌ BSC data failed:", bscData.status === "rejected" ? bscData.reason : "No data");
      }

      if (avalancheData.status === "fulfilled" && avalancheData.value) {
        allTokens.push(...avalancheData.value);
        networkTotals.avalanche = avalancheData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
      }

      if (fantomData.status === "fulfilled" && fantomData.value) {
        console.log("✅ Fantom data received:", fantomData.value);
        allTokens.push(...fantomData.value);
        networkTotals.fantom = fantomData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
        console.log("💰 Fantom network total:", networkTotals.fantom);
      } else {
        console.log("❌ Fantom data failed:", fantomData.status === "rejected" ? fantomData.reason : "No data");
      }

      if (lineaData.status === "fulfilled" && lineaData.value) {
        console.log("✅ Linea data received:", lineaData.value);
        allTokens.push(...lineaData.value);
        networkTotals.linea = lineaData.value.reduce(
          (sum, token) => sum + token.usdValue,
          0,
        );
        console.log("💰 Linea network total:", networkTotals.linea);
      } else {
        console.log("❌ Linea data failed:", lineaData.status === "rejected" ? lineaData.reason : "No data");
      }

      if (solanaData.status === "fulfilled" && solanaData.value) {
        console.log("✅ Solana data received:", solanaData.value);
        allTokens.push(...solanaData.value);
        networkTotals.solana = solanaData.value.reduce(
          (sum: number, token: TokenHolding) => sum + token.usdValue,
          0,
        );
        console.log("💰 Solana network total:", networkTotals.solana);
      } else {
        console.log("❌ Solana data failed:", solanaData.status === "rejected" ? solanaData.reason : "No data");
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
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea",
  ): Promise<TokenHolding[]> {
    console.log(`🔗 Fetching ${network} data for:`, address);
    try {
      const tokens: TokenHolding[] = [];

      // Get native token balance
      const nativeBalance = await this.getNativeBalance(address, network);
      console.log(`💰 ${network} native balance:`, nativeBalance);
      if (nativeBalance > 0) {
        const nativeInfo = this.nativeTokens[network];
        const price = await this.getTokenPrice(nativeInfo.coingeckoId);
        console.log(`💲 ${network} price:`, price);

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
          console.log(`🔍 Trying discovery method for ${network}...`);
          tokenBalances = await this.withRetry(method);
          console.log(`✅ Discovery method worked for ${network}, found ${tokenBalances.length} tokens`);
          tokens.push(...tokenBalances);
          break; // Success, no need to try other methods
        } catch (error) {
          lastError = error as Error;
          console.log(`❌ Token discovery method failed for ${network}:`, error);
          await this.sleep(RATE_LIMIT_DELAY);
        }
      }

      // If all methods failed but we have some tokens, continue
      if (tokens.length === 0 && lastError) {
        console.warn(
          `⚠️ All token discovery methods failed for ${network}:`,
          lastError,
        );
      }

      const filteredTokens = tokens.filter((token) => token.usdValue > 0.01); // Filter dust
      console.log(`📊 ${network} final result: ${filteredTokens.length} tokens, total value: $${filteredTokens.reduce((sum, t) => sum + t.usdValue, 0).toFixed(2)}`);
      return filteredTokens;
    } catch (error) {
      console.error(`❌ Critical error fetching ${network} data:`, error);
      return [];
    }
  }

  /**
   * Fetch Solana data for a wallet address
   * Note: This is a placeholder implementation since Solana uses different address format and APIs
   */
  private static async fetchSolanaData(address: string): Promise<TokenHolding[]> {
    console.log(`🔗 Fetching Solana data for:`, address);
    
    try {
      // For now, return empty array since Solana requires different address format (base58 vs hex)
      // In a full implementation, we would:
      // 1. Check if the address is a valid Solana address (base58)
      // 2. Use Solana Web3.js or similar library
      // 3. Fetch SOL balance and SPL token balances
      // 4. Get token prices from CoinGecko or similar
      
      console.log("ℹ️ Solana integration requires base58 addresses - skipping for Ethereum addresses");
      return [];
    } catch (error) {
      console.error("Error fetching Solana data:", error);
      return [];
    }
  }

  /**
   * Get native token balance for an address on any chain
   */
  private static async getNativeBalance(
    address: string,
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea",
  ): Promise<number> {
    try {
      console.log(`🔍 Checking ${network} native balance for:`, address);
      const provider = this.providers[network];
      const balance = await provider.getBalance(address);
      const formatted = parseFloat(ethers.formatEther(balance));
      console.log(`💰 ${network} native balance:`, formatted);
      return formatted;
    } catch (error) {
      console.error(`❌ Error fetching ${network} balance:`, error);
      return 0;
    }
  }

  /**
   * Fetch token balances using Covalent API
   */
  private static async fetchTokenBalancesCovalent(
    address: string,
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea" = "ethereum",
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
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea",
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
        base: [
          "https://tokens.uniswap.org", // Uniswap supports Base
        ],
        arbitrum: [
          "https://tokens.uniswap.org", // Uniswap supports Arbitrum
        ],
        optimism: [
          "https://tokens.uniswap.org", // Uniswap supports Optimism
        ],
        bsc: [
          "https://tokens.pancakeswap.finance/pancakeswap-extended.json",
        ],
        avalanche: [
          "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/joe.tokenlist.json",
        ],
        fantom: [
          "https://raw.githubusercontent.com/SpookySwap/spooky-info/master/src/constants/token/spookyswap.json",
        ],
        linea: [
          "https://tokens.uniswap.org", // Uniswap supports Linea
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
              (token: { chainId: number }) => token.chainId === CHAIN_IDS[network],
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
    tokenList: { address: string; symbol: string; name: string; decimals: number }[],
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea",
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
        } catch {
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
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea" = "ethereum",
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
    network: "ethereum" | "polygon" | "base" | "arbitrum" | "optimism" | "bsc" | "avalanche" | "fantom" | "linea" = "ethereum",
  ): Promise<TokenPrice | null> {
    // Check cache first
    const cacheKey = `tokenprice:${network}:${address.toLowerCase()}`;
    const cached = this.getPriceFromCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      let platformId;
      switch (network) {
        case "polygon":
          platformId = "polygon-pos";
          break;
        case "base":
          platformId = "base";
          break;
        case "arbitrum":
          platformId = "arbitrum-one";
          break;
        case "optimism":
          platformId = "optimistic-ethereum";
          break;
        case "bsc":
          platformId = "binance-smart-chain";
          break;
        case "avalanche":
          platformId = "avalanche";
          break;
        default:
          platformId = "ethereum";
      }
      
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
   * Health check for the Real Portfolio API
   * Tests basic connectivity and functionality
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Test basic price fetching capability
      const price = await this.getTokenPrice('ethereum');
      return price !== null && price.usd > 0;
    } catch (error) {
      console.error('Real API health check failed:', error);
      return false;
    }
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
