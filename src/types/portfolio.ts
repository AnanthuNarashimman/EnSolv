/**
 * Portfolio data types for the Ensolv application
 */

export interface TokenHolding {
  symbol: string;
  name: string;
  address: string;
  network: string;
  balance: string;
  decimals: number;
  usdValue: number;
  price: number;
  change24h: number;
  // Legacy support
  contractAddress?: string;
}

export interface LiquidityPosition {
  protocol: string;
  pair: string;
  usdValue: number;
  network: string;
}

export interface NetworkTotals {
  ethereum?: number;
  polygon: number;
  rootstock: number;
  arbitrum?: number;
  optimism?: number;
  base?: number;
  bsc?: number;
  avalanche?: number;
  solana?: number;
  fantom?: number;
  linea?: number;
  [key: string]: number | undefined;
}

export interface PortfolioSummary {
  totalUsdValue: number;
  networkTotals: NetworkTotals;
  tokenCount: number;
  liquidityPositionCount: number;
}

export interface PortfolioMetadata {
  responseTime: string;
  cached?: boolean;
  apiVersion?: string;
  dataSource?: string;
  networks?: string[];
}

export interface PortfolioData {
  address: string;
  updatedAt: string;
  summary: PortfolioSummary;
  tokenHoldings: TokenHolding[];
  liquidityPositions: LiquidityPosition[];
  metadata?: PortfolioMetadata;
}

export interface PortfolioError {
  error: string;
  message: string;
}

// Additional types for the enhanced API
export interface TokenPrice {
  usd: number;
  usd_24h_change?: number;
}

export interface CacheStats {
  portfolio: number;
  prices: number;
}
