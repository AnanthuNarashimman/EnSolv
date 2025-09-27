import { KatanaSwapService } from '../katanaSwap';

describe('KatanaSwapService', () => {
  describe('getAvailableTokens', () => {
    it('should return available tokens for Polygon', () => {
      const tokens = KatanaSwapService.getAvailableTokens('polygon');
      expect(tokens).toHaveLength(4);
      expect(tokens.find(t => t.symbol === 'USDC')).toBeDefined();
      expect(tokens.find(t => t.symbol === 'WMATIC')).toBeDefined();
    });

    it('should return available tokens for Rootstock', () => {
      const tokens = KatanaSwapService.getAvailableTokens('rootstock');
      expect(tokens).toHaveLength(3);
      expect(tokens.find(t => t.symbol === 'RBTC')).toBeDefined();
      expect(tokens.find(t => t.symbol === 'USDT')).toBeDefined();
    });

    it('should return empty array for unsupported network', () => {
      const tokens = KatanaSwapService.getAvailableTokens('ethereum' as any);
      expect(tokens).toHaveLength(0);
    });
  });

  describe('getSwapQuote', () => {
    it('should return a valid quote for supported networks', async () => {
      const params = {
        fromToken: 'USDC',
        toToken: 'USDT',
        fromAmount: '100',
        fromNetwork: 'polygon' as const,
        toNetwork: 'rootstock' as const,
        userAddress: '0x123...',
      };

      const quote = await KatanaSwapService.getSwapQuote(params);

      expect(quote.fromToken).toBe('USDC');
      expect(quote.toToken).toBe('USDT');
      expect(quote.fromAmount).toBe('100');
      expect(parseFloat(quote.toAmount)).toBeGreaterThan(0);
      expect(quote.priceImpact).toBeGreaterThanOrEqual(0);
      expect(quote.route).toContain('Katana Bridge');
    });

    it('should throw error for unsupported networks', async () => {
      const params = {
        fromToken: 'ETH',
        toToken: 'BTC',
        fromAmount: '1',
        fromNetwork: 'ethereum' as any,
        toNetwork: 'bitcoin' as any,
        userAddress: '0x123...',
      };

      await expect(KatanaSwapService.getSwapQuote(params)).rejects.toThrow();
    });
  });

  describe('getSwappableTokens', () => {
    it('should filter tokens by supported networks and minimum value', () => {
      const mockTokens = [
        { symbol: 'USDC', network: 'polygon', usdValue: 100, balance: '100' },
        { symbol: 'USDT', network: 'rootstock', usdValue: 50, balance: '50' },
        { symbol: 'ETH', network: 'ethereum', usdValue: 1000, balance: '0.5' },
        { symbol: 'DUST', network: 'polygon', usdValue: 0.5, balance: '1000' },
      ] as any[];

      const swappable = KatanaSwapService.getSwappableTokens(mockTokens);

      expect(swappable).toHaveLength(2);
      expect(swappable.find(t => t.symbol === 'USDC')).toBeDefined();
      expect(swappable.find(t => t.symbol === 'USDT')).toBeDefined();
      expect(swappable.find(t => t.symbol === 'ETH')).toBeUndefined(); // Unsupported network
      expect(swappable.find(t => t.symbol === 'DUST')).toBeUndefined(); // Too low value
    });
  });

  describe('isCrossChainSupported', () => {
    it('should return true for supported cross-chain pairs', () => {
      expect(KatanaSwapService.isCrossChainSupported('polygon', 'rootstock')).toBe(true);
      expect(KatanaSwapService.isCrossChainSupported('rootstock', 'polygon')).toBe(true);
    });

    it('should return false for same network', () => {
      expect(KatanaSwapService.isCrossChainSupported('polygon', 'polygon')).toBe(false);
    });

    it('should return false for unsupported networks', () => {
      expect(KatanaSwapService.isCrossChainSupported('ethereum', 'polygon')).toBe(false);
    });
  });
});