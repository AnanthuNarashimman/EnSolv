import { 
  getPriceFeedId, 
  getSupportedTokens, 
  POLYGON_TOKEN_MAPPINGS, 
  ROOTSTOCK_TOKEN_MAPPINGS,
  ALL_TOKEN_MAPPINGS 
} from '../tokenMappings.js';

describe('Token Mappings', () => {
  describe('getPriceFeedId', () => {
    it('should return correct price feed ID for Polygon tokens', () => {
      const usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';
      const priceFeedId = getPriceFeedId(usdcAddress);
      expect(priceFeedId).toBe('crypto.USDC/USD');
    });

    it('should return correct price feed ID for Rootstock tokens', () => {
      const rbtcAddress = '0x542fda317318ebf1d3deaf76e0b632741a7e677d';
      const priceFeedId = getPriceFeedId(rbtcAddress);
      expect(priceFeedId).toBe('crypto.BTC/USD');
    });

    it('should handle case insensitive addresses', () => {
      const usdcAddressUpperCase = '0x2791BCA1F2DE4661ED88A30C99A7A9449AA84174';
      const priceFeedId = getPriceFeedId(usdcAddressUpperCase);
      expect(priceFeedId).toBe('crypto.USDC/USD');
    });

    it('should return null for unsupported tokens', () => {
      const unsupportedAddress = '0x1234567890123456789012345678901234567890';
      const priceFeedId = getPriceFeedId(unsupportedAddress);
      expect(priceFeedId).toBeNull();
    });

    it('should return null for invalid addresses', () => {
      const invalidAddress = 'invalid-address';
      const priceFeedId = getPriceFeedId(invalidAddress);
      expect(priceFeedId).toBeNull();
    });
  });

  describe('getSupportedTokens', () => {
    it('should return Polygon token addresses', () => {
      const polygonTokens = getSupportedTokens('polygon');
      expect(polygonTokens).toEqual(Object.keys(POLYGON_TOKEN_MAPPINGS));
      expect(polygonTokens.length).toBeGreaterThan(0);
    });

    it('should return Rootstock token addresses', () => {
      const rootstockTokens = getSupportedTokens('rootstock');
      expect(rootstockTokens).toEqual(Object.keys(ROOTSTOCK_TOKEN_MAPPINGS));
      expect(rootstockTokens.length).toBeGreaterThan(0);
    });

    it('should handle case insensitive chain names', () => {
      const polygonTokensUpper = getSupportedTokens('POLYGON');
      const polygonTokensLower = getSupportedTokens('polygon');
      expect(polygonTokensUpper).toEqual(polygonTokensLower);
    });

    it('should return empty array for unsupported chains', () => {
      const unsupportedTokens = getSupportedTokens('ethereum');
      expect(unsupportedTokens).toEqual([]);
    });
  });

  describe('Token Mapping Constants', () => {
    it('should have valid Polygon token mappings', () => {
      expect(POLYGON_TOKEN_MAPPINGS).toBeDefined();
      expect(typeof POLYGON_TOKEN_MAPPINGS).toBe('object');
      
      // Check that all addresses are valid Ethereum addresses (42 chars, starts with 0x)
      Object.keys(POLYGON_TOKEN_MAPPINGS).forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      // Check that all price feed IDs follow expected format
      Object.values(POLYGON_TOKEN_MAPPINGS).forEach(feedId => {
        expect(feedId).toMatch(/^crypto\.[A-Z]+\/USD$/);
      });
    });

    it('should have valid Rootstock token mappings', () => {
      expect(ROOTSTOCK_TOKEN_MAPPINGS).toBeDefined();
      expect(typeof ROOTSTOCK_TOKEN_MAPPINGS).toBe('object');
      
      // Check that all addresses are valid Ethereum addresses
      Object.keys(ROOTSTOCK_TOKEN_MAPPINGS).forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      // Check that all price feed IDs follow expected format
      Object.values(ROOTSTOCK_TOKEN_MAPPINGS).forEach(feedId => {
        expect(feedId).toMatch(/^crypto\.[A-Z]+\/USD$/);
      });
    });

    it('should have combined mappings that include both chains', () => {
      expect(ALL_TOKEN_MAPPINGS).toBeDefined();
      
      const polygonKeys = Object.keys(POLYGON_TOKEN_MAPPINGS);
      const rootstockKeys = Object.keys(ROOTSTOCK_TOKEN_MAPPINGS);
      const allKeys = Object.keys(ALL_TOKEN_MAPPINGS);
      
      // All polygon tokens should be in combined mapping
      polygonKeys.forEach(key => {
        expect(ALL_TOKEN_MAPPINGS).toHaveProperty(key);
      });
      
      // All rootstock tokens should be in combined mapping
      rootstockKeys.forEach(key => {
        expect(ALL_TOKEN_MAPPINGS).toHaveProperty(key);
      });
      
      // Combined mapping should have at least as many entries as both chains
      expect(allKeys.length).toBeGreaterThanOrEqual(polygonKeys.length);
      expect(allKeys.length).toBeGreaterThanOrEqual(rootstockKeys.length);
    });

    it('should not have duplicate addresses between chains', () => {
      const polygonAddresses = Object.keys(POLYGON_TOKEN_MAPPINGS);
      const rootstockAddresses = Object.keys(ROOTSTOCK_TOKEN_MAPPINGS);
      
      const intersection = polygonAddresses.filter(addr => 
        rootstockAddresses.includes(addr)
      );
      
      // There should be no overlapping addresses (different chains have different addresses)
      expect(intersection).toHaveLength(0);
    });
  });

  describe('Integration with real token addresses', () => {
    it('should support major Polygon tokens', () => {
      const majorTokens = [
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
        '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
        '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'  // WBTC
      ];

      majorTokens.forEach(address => {
        const feedId = getPriceFeedId(address);
        expect(feedId).not.toBeNull();
        expect(feedId).toMatch(/^crypto\.[A-Z]+\/USD$/);
      });
    });

    it('should support major Rootstock tokens', () => {
      const majorTokens = [
        '0x542fda317318ebf1d3deaf76e0b632741a7e677d', // RBTC
        '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5'  // RIF
      ];

      majorTokens.forEach(address => {
        const feedId = getPriceFeedId(address);
        expect(feedId).not.toBeNull();
        expect(feedId).toMatch(/^crypto\.[A-Z]+\/USD$/);
      });
    });
  });
});