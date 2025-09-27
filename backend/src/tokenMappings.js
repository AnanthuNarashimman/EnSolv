/**
 * @fileoverview Token mappings and price feed configurations for EnSolv Portfolio API
 *
 * This module contains token address mappings for supported blockchain networks
 * and their corresponding Pyth Network price feed IDs. It provides utilities
 * for token identification and price feed lookup across Polygon and Rootstock chains.
 *
 * @author EnSolv Team
 * @version 1.0.0
 */

/**
 * Token mappings for Polygon network
 * Maps token contract addresses to their metadata including symbols, decimals, and price feed IDs
 *
 * @type {Object.<string, Object>}
 * @property {string} symbol - Token symbol (e.g., 'USDC', 'WMATIC')
 * @property {number} decimals - Number of decimal places for the token
 * @property {string} priceFeedId - Pyth Network price feed ID for USD pricing
 */
export const POLYGON_TOKEN_MAPPINGS = {
  // USDC on Polygon
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": {
    symbol: "USDC",
    decimals: 6,
    priceFeedId:
      "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // USD/USD (stable)
  },
  // WMATIC on Polygon
  "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": {
    symbol: "WMATIC",
    decimals: 18,
    priceFeedId:
      "5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52", // MATIC/USD
  },
};

/**
 * Token mappings for Rootstock network
 * Maps token contract addresses to their metadata including symbols, decimals, and price feed IDs
 *
 * @type {Object.<string, Object>}
 * @property {string} symbol - Token symbol (e.g., 'RBTC')
 * @property {number} decimals - Number of decimal places for the token
 * @property {string} priceFeedId - Pyth Network price feed ID for USD pricing
 */
export const ROOTSTOCK_TOKEN_MAPPINGS = {
  // RBTC on Rootstock (native wrapped Bitcoin)
  "0x542fda317318ebf1d3deaf76e0b632741a7e677d": {
    symbol: "RBTC",
    decimals: 18,
    priceFeedId:
      "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD
  },
};

/**
 * Combined token mappings from all supported networks
 * Merges Polygon and Rootstock token mappings into a single lookup object
 *
 * @type {Object.<string, Object>}
 */
export const ALL_TOKEN_MAPPINGS = {
  ...POLYGON_TOKEN_MAPPINGS,
  ...ROOTSTOCK_TOKEN_MAPPINGS,
};

/**
 * Get the Pyth Network price feed ID for a given token address
 *
 * @param {string} tokenAddress - The token contract address (case-insensitive)
 * @returns {string|null} The Pyth price feed ID if found, null otherwise
 *
 * @example
 * // Get price feed ID for USDC on Polygon
 * const feedId = getPriceFeedId('0x2791bca1f2de4661ed88a30c99a7a9449aa84174');
 * console.log(feedId); // 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'
 *
 * @example
 * // Handle unknown token
 * const feedId = getPriceFeedId('0x1234567890abcdef');
 * console.log(feedId); // null
 */
export function getPriceFeedId(tokenAddress) {
  const mapping = ALL_TOKEN_MAPPINGS[tokenAddress.toLowerCase()];
  return mapping ? mapping.priceFeedId : null;
}

/**
 * Get all supported token addresses across all networks
 *
 * @returns {string[]} Array of all supported token contract addresses in lowercase
 *
 * @example
 * // Get all supported tokens
 * const tokens = getSupportedTokens();
 * console.log(tokens);
 * // [
 * //   '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
 * //   '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
 * //   '0x542fda317318ebf1d3deaf76e0b632741a7e677d'  // RBTC
 * // ]
 */
export function getSupportedTokens() {
  return Object.keys(ALL_TOKEN_MAPPINGS);
}
