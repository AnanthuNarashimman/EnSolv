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

    it("should handle empty string input", () => {

    it("should handle null input", () => {

    it("should handle undefined input", () => {

    it("should handle non-string input types", () => {

    it("should handle addresses with incorrect length", () => {

    it("should handle addresses without 0x prefix", () => {

    it("should handle addresses with invalid characters", () => {

    it("should handle mixed case variations consistently", () => {
      const mixedCaseVariations = [
        "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        "0x2791BCA1F2DE4661ED88A30C99A7A9449AA84174",
        "0x2791bCa1f2De4661eD88a30c99A7a9449aA84174"
      ];
      const expectedFeedId = "crypto.USDC/USD";
      
      mixedCaseVariations.forEach(address => {
        expect(getPriceFeedId(address)).toBe(expectedFeedId);
      });
    });
      const invalidCharsAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa8417G";
      const priceFeedId = getPriceFeedId(invalidCharsAddress);
      expect(priceFeedId).toBeNull();
    });
      const addressWithoutPrefix = "2791bca1f2de4661ed88a30c99a7a9449aa84174";
      const priceFeedId = getPriceFeedId(addressWithoutPrefix);
      expect(priceFeedId).toBeNull();
    });
      const shortAddress = "0x1234";
      const longAddress = "0x" + "1".repeat(50);
      expect(getPriceFeedId(shortAddress)).toBeNull();
      expect(getPriceFeedId(longAddress)).toBeNull();
    });
      expect(getPriceFeedId(123)).toBeNull();
      expect(getPriceFeedId({})).toBeNull();
      expect(getPriceFeedId([])).toBeNull();
      expect(getPriceFeedId(true)).toBeNull();
    });
      const priceFeedId = getPriceFeedId(undefined);
      expect(priceFeedId).toBeNull();
    });
      const priceFeedId = getPriceFeedId(null);
      expect(priceFeedId).toBeNull();
    });
      const emptyAddress = "";
      const priceFeedId = getPriceFeedId(emptyAddress);
      expect(priceFeedId).toBeNull();
    });
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

    it("should handle null chain parameter", () => {

    it("should handle undefined chain parameter", () => {

    it("should handle empty string chain parameter", () => {

    it("should handle non-string chain parameter types", () => {

    it("should handle chain names with extra whitespace", () => {

    it("should handle various case combinations", () => {
      const polygonTokens = getSupportedTokens("polygon");
      expect(getSupportedTokens("Polygon")).toEqual(polygonTokens);
      expect(getSupportedTokens("PoLyGoN")).toEqual(polygonTokens);
      expect(getSupportedTokens("POLYGON")).toEqual(polygonTokens);
    });
      const polygonTokensNormal = getSupportedTokens("polygon");
      expect(getSupportedTokens(" polygon ")).toEqual(polygonTokensNormal);
      expect(getSupportedTokens("\tpolygon\n")).toEqual(polygonTokensNormal);
    });
      expect(getSupportedTokens(123)).toEqual([]);
      expect(getSupportedTokens({})).toEqual([]);
      expect(getSupportedTokens([])).toEqual([]);
      expect(getSupportedTokens(true)).toEqual([]);
    });
      const tokens = getSupportedTokens("");
      expect(tokens).toEqual([]);
    });
      const tokens = getSupportedTokens(undefined);
      expect(tokens).toEqual([]);
    });
      const tokens = getSupportedTokens(null);
      expect(tokens).toEqual([]);
    });
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

    it("should have consistent address formatting across all mappings", () => {

    it("should have valid price feed ID formats for all mappings", () => {

    it("should not have null or undefined values in mappings", () => {

    it("should have reasonable number of token mappings", () => {

    it("should handle rapid successive calls efficiently", () => {

    it("should handle concurrent access patterns", () => {
      const addresses = Object.keys(ALL_TOKEN_MAPPINGS).slice(0, 10);
      const chains = ["polygon", "rootstock"];
      
      // Test concurrent access to both functions
      const promises = [];
      
      addresses.forEach(address => {
        promises.push(Promise.resolve(getPriceFeedId(address)));
      });
      
      chains.forEach(chain => {
        promises.push(Promise.resolve(getSupportedTokens(chain)));
      });
      
      return Promise.all(promises).then(results => {
        expect(results).toHaveLength(addresses.length + chains.length);
        results.forEach(result => {
          expect(result).toBeDefined();
        });
      });
    });
      const testAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
      const iterations = 1000;
      
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        getPriceFeedId(testAddress);
      }
      const endTime = Date.now();
      
      // Should complete 1000 calls in reasonable time (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
      // Ensure we have a reasonable number of tokens per chain
      expect(Object.keys(POLYGON_TOKEN_MAPPINGS).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(ROOTSTOCK_TOKEN_MAPPINGS).length).toBeGreaterThanOrEqual(1);
      
      // Combined should equal sum of individual chains (no overlap expected)
      const expectedTotal = Object.keys(POLYGON_TOKEN_MAPPINGS).length + 
                           Object.keys(ROOTSTOCK_TOKEN_MAPPINGS).length;
      expect(Object.keys(ALL_TOKEN_MAPPINGS).length).toBe(expectedTotal);
    });
      Object.entries(ALL_TOKEN_MAPPINGS).forEach(([address, feedId]) => {
        expect(address).toBeDefined();
        expect(address).not.toBeNull();
        expect(feedId).toBeDefined();
        expect(feedId).not.toBeNull();
        expect(typeof address).toBe("string");
        expect(typeof feedId).toBe("string");
      });
    });
      const allFeedIds = Object.values(ALL_TOKEN_MAPPINGS);
      
      allFeedIds.forEach(feedId => {
        // Should follow crypto.SYMBOL/USD pattern
        expect(feedId).toMatch(/^crypto\.[A-Z]+\/USD$/);
        // Symbol should be reasonable length (2-10 characters)
        const symbol = feedId.split(".")[1].split("/")[0];
        expect(symbol.length).toBeGreaterThanOrEqual(2);
        expect(symbol.length).toBeLessThanOrEqual(10);
        // Should not contain numbers or special characters
        expect(symbol).toMatch(/^[A-Z]+$/);
      });
    });
      const allAddresses = Object.keys(ALL_TOKEN_MAPPINGS);
      
      allAddresses.forEach(address => {
        // Should be exactly 42 characters
        expect(address.length).toBe(42);
        // Should start with 0x
        expect(address.startsWith("0x")).toBe(true);
        // Should contain only valid hex characters
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        // Should be lowercase for consistency
        expect(address).toBe(address.toLowerCase());
      });
    });
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

    it("should handle token address lookup workflows", () => {

    it("should maintain data consistency across functions", () => {

    it("should handle edge cases in real-world scenarios", () => {

    it("should reject potentially malicious inputs", () => {

    it("should handle very long inputs gracefully", () => {

  });

  describe("Chain-specific validation", () => {
    it("should have expected tokens for Polygon mainnet", () => {

    it("should have expected tokens for Rootstock", () => {

    it("should return consistent results for chain lookups", () => {

  });

  describe("Error handling and robustness", () => {
    it("should not throw errors on any input type", () => {

    it("should handle Unicode and special characters", () => {

    it("should maintain immutability of returned data", () => {
      const polygonTokens1 = getSupportedTokens("polygon");
      const polygonTokens2 = getSupportedTokens("polygon");
      
      // Modify the first result
      polygonTokens1.push("0x1234567890123456789012345678901234567890");
      
      // Second call should return unmodified original data
      expect(polygonTokens2).not.toContain("0x1234567890123456789012345678901234567890");
      expect(polygonTokens2.length).toBeLessThan(polygonTokens1.length);
    });
      const unicodeInputs = [
        "0x2791bca1f2de4661ed88a30c99a7a9449aa8417™",
        "0x2791bca1f2de4661ed88a30c99a7a9449aa8417€",
        "0x2791bca1f2de4661ed88a30c99a7a9449aa8417🚀",
        "polygon™",
        "rootstock€",
      ];
      
      unicodeInputs.forEach(input => {
        if (input.startsWith("0x")) {
          expect(getPriceFeedId(input)).toBeNull();
        } else {
          expect(getSupportedTokens(input)).toEqual([]);
        }
      });
    });
      const testInputs = [null, undefined, 0, "", [], {}, NaN, Infinity, -1, true, false];
      
      testInputs.forEach(input => {
        expect(() => getPriceFeedId(input)).not.toThrow();
        expect(() => getSupportedTokens(input)).not.toThrow();
      });
    });
      // Multiple calls should return identical results
      const polygonTokens1 = getSupportedTokens("polygon");
      const polygonTokens2 = getSupportedTokens("polygon");
      const rootstockTokens1 = getSupportedTokens("rootstock");
      const rootstockTokens2 = getSupportedTokens("rootstock");
      
      expect(polygonTokens1).toEqual(polygonTokens2);
      expect(rootstockTokens1).toEqual(rootstockTokens2);
    });
      const rootstockTokens = getSupportedTokens("rootstock");
      
      expect(rootstockTokens.length).toBeGreaterThan(0);
      
      // All addresses should be valid format
      rootstockTokens.forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
      const polygonTokens = getSupportedTokens("polygon");
      
      // Should include common Polygon tokens (addresses may vary based on actual mappings)
      expect(polygonTokens.length).toBeGreaterThan(0);
      
      // All addresses should be valid Ethereum format
      polygonTokens.forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
      const veryLongInput = "0x" + "a".repeat(1000);
      expect(getPriceFeedId(veryLongInput)).toBeNull();
      
      const veryLongChain = "a".repeat(1000);
      expect(getSupportedTokens(veryLongChain)).toEqual([]);
    });
      const maliciousInputs = [
        "javascript:alert(1)",
        "<script>alert(1)</script>",
        "../../etc/passwd",
        "0x" + "0".repeat(40) + "\x00",
        "0x" + "f".repeat(40) + "\n",
      ];
      
      maliciousInputs.forEach(input => {
        expect(getPriceFeedId(input)).toBeNull();
      });
    });
      // Test common user mistakes and edge cases
      const commonMistakes = [
        "0X2791BCA1F2DE4661ED88A30C99A7A9449AA84174", // Wrong case prefix
        "2791bca1f2de4661ed88a30c99a7a9449aa84174",   // Missing prefix
        "0x2791bca1f2de4661ed88a30c99a7a9449aa84174 ", // Trailing space
        " 0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // Leading space
      ];
      
      // These should either work (if normalized) or return null gracefully
      commonMistakes.forEach(address => {
        const result = getPriceFeedId(address);
        // Should not throw an error, should return null or valid result
        expect(typeof result === "string" || result === null).toBe(true);
      });
    });
      // Verify that all tokens returned by getSupportedTokens have valid price feeds
      const allChains = ["polygon", "rootstock"];
      
      allChains.forEach(chain => {
        const supportedTokens = getSupportedTokens(chain);
        
        supportedTokens.forEach(address => {
          const feedId = getPriceFeedId(address);
          expect(feedId).not.toBeNull();
          expect(feedId).toBeTruthy();
        });
      });
    });
      // Simulate a complete workflow: get supported tokens, then get price feed IDs
      const polygonTokens = getSupportedTokens("polygon");
      const rootstockTokens = getSupportedTokens("rootstock");
      
      expect(polygonTokens.length).toBeGreaterThan(0);
      expect(rootstockTokens.length).toBeGreaterThan(0);
      
      // Test first few tokens from each chain
      const testTokens = polygonTokens.slice(0, 3).concat(rootstockTokens.slice(0, 3));
      
      testTokens.forEach(address => {
        const feedId = getPriceFeedId(address);
        expect(feedId).not.toBeNull();
        expect(feedId).toMatch(/^crypto\.[A-Z]+\/USD$/);
      });
    });
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