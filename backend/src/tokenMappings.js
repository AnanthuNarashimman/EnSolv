// Token address to Pyth price feed ID mappings
// These mappings connect token addresses to their corresponding Pyth price feed IDs

export const POLYGON_TOKEN_MAPPINGS = {
  // WETH on Polygon
  '0x7ceb23fd6c0c6b4e2b8b2d9c5b5c5b5c5b5c5b5c': 'crypto.ETH/USD',
  // USDC on Polygon
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'crypto.USDC/USD',
  // USDT on Polygon
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'crypto.USDT/USD',
  // WMATIC on Polygon
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 'crypto.MATIC/USD',
  // WBTC on Polygon
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': 'crypto.BTC/USD',
  // DAI on Polygon
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 'crypto.DAI/USD',
  // LINK on Polygon
  '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39': 'crypto.LINK/USD',
  // UNI on Polygon
  '0xb33eaad8d922b1083446dc23f610c2567fb5180f': 'crypto.UNI/USD'
};

export const ROOTSTOCK_TOKEN_MAPPINGS = {
  // RBTC (native token wrapped)
  '0x542fda317318ebf1d3deaf76e0b632741a7e677d': 'crypto.BTC/USD',
  // RIF Token
  '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5': 'crypto.RIF/USD',
  // USDT on Rootstock
  '0xef213441a85df4d7acbdae0cf78004e1e486bb96': 'crypto.USDT/USD',
  // DOC (Dollar on Chain)
  '0xe700691da7b9851f2f35f8b8182c69c53ccad9db': 'crypto.DOC/USD',
  // BPRO (BitPro)
  '0x440cd83c160de5c96ddb20246815ea44c7abbca8': 'crypto.BPRO/USD'
};

// Combined mapping for easy lookup
export const ALL_TOKEN_MAPPINGS = {
  ...POLYGON_TOKEN_MAPPINGS,
  ...ROOTSTOCK_TOKEN_MAPPINGS
};

// Helper function to get price feed ID by token address
export function getPriceFeedId(tokenAddress) {
  return ALL_TOKEN_MAPPINGS[tokenAddress.toLowerCase()] || null;
}

// Helper function to get all supported tokens for a chain
export function getSupportedTokens(chain) {
  switch (chain.toLowerCase()) {
    case 'polygon':
      return Object.keys(POLYGON_TOKEN_MAPPINGS);
    case 'rootstock':
      return Object.keys(ROOTSTOCK_TOKEN_MAPPINGS);
    default:
      return [];
  }
}