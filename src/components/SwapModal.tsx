import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { KatanaSwapService, type SwapQuote, type SwapParams } from '../services/katanaSwap';
import type { TokenHolding } from '../types/portfolio';
import { useWalletContext } from '../contexts/WalletContext';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioTokens: TokenHolding[];
}

/**
 * SwapModal - Powered by Katana Network
 * Cross-chain swaps between Polygon and Rootstock with best rates
 * 
 * Features:
 * - Pre-filled with user's portfolio tokens
 * - Real-time price quotes
 * - Cross-chain bridge support
 * - Slippage protection
 */
const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose, portfolioTokens }) => {
  const { address, isConnected } = useWalletContext();
  const [fromToken, setFromToken] = useState<TokenHolding | null>(null);
  const [toToken, setToToken] = useState<{ symbol: string; network: string } | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get swappable tokens from portfolio
  const swappableTokens = KatanaSwapService.getSwappableTokens(portfolioTokens);

  // Target networks and tokens for cross-chain swaps
  const targetOptions = [
    { symbol: 'USDT', network: 'rootstock', label: 'USDT on Rootstock' },
    { symbol: 'RBTC', network: 'rootstock', label: 'RBTC on Rootstock' },
    { symbol: 'USDC', network: 'polygon', label: 'USDC on Polygon' },
    { symbol: 'WMATIC', network: 'polygon', label: 'WMATIC on Polygon' },
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFromToken(null);
      setToToken(null);
      setFromAmount('');
      setQuote(null);
      setIsLoadingQuote(false);
      setIsSwapping(false);
    }
  }, [isOpen]);

  // Auto-select first swappable token
  useEffect(() => {
    if (isOpen && swappableTokens.length > 0 && !fromToken) {
      setFromToken(swappableTokens[0]);
    }
  }, [isOpen, swappableTokens, fromToken]);

  // Get quote when inputs change
  useEffect(() => {
    const getQuote = async () => {
      if (!fromToken || !toToken || !fromAmount || !address) return;

      const amount = parseFloat(fromAmount);
      if (isNaN(amount) || amount <= 0) return;

      setIsLoadingQuote(true);
      try {
        const params: SwapParams = {
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          fromAmount: fromAmount,
          fromNetwork: fromToken.network as 'polygon' | 'rootstock',
          toNetwork: toToken.network as 'polygon' | 'rootstock',
          slippage,
          userAddress: address,
        };

        const newQuote = await KatanaSwapService.getSwapQuote(params);
        setQuote(newQuote);
      } catch (error) {
        console.error('Quote error:', error);
        toast.error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounceTimer = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [fromToken, toToken, fromAmount, slippage, address]);

  const handleSwap = async () => {
    if (!quote || !isConnected || !window.ethereum) {
      toast.error('Please connect your wallet and get a quote first');
      return;
    }

    setIsSwapping(true);
    const loadingToast = toast.loading('Preparing swap transaction...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      toast.loading('Executing Katana swap...', { id: loadingToast });
      await KatanaSwapService.executeSwap(quote, signer);

      toast.success(
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            🎉 Swap Successful!
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Powered by Katana Network
          </div>
        </div>,
        { id: loadingToast, duration: 5000 }
      );

      // Reset form
      setFromAmount('');
      setQuote(null);
      onClose();

    } catch (error) {
      console.error('Swap error:', error);
      toast.error(
        `Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { id: loadingToast }
      );
    } finally {
      setIsSwapping(false);
    }
  };

  const handleMaxAmount = () => {
    if (fromToken) {
      setFromAmount(fromToken.balance);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>
              <span style={styles.titleIcon}>🔄</span>
              Swap Tokens
            </h2>
            <div style={styles.poweredBy}>
              <span>Powered by</span>
              <strong style={styles.katanaBrand}>Katana Network</strong>
            </div>
            <button style={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div style={styles.content}>
            {/* From Token */}
            <div style={styles.tokenSection}>
              <label style={styles.label}>From</label>
              <div style={styles.tokenInput}>
                <select
                  style={styles.tokenSelect}
                  value={fromToken ? `${fromToken.symbol}-${fromToken.network}` : ''}
                  onChange={(e) => {
                    const [symbol, network] = e.target.value.split('-');
                    const token = swappableTokens.find(t => t.symbol === symbol && t.network === network);
                    setFromToken(token || null);
                  }}
                >
                  <option value="">Select token</option>
                  {swappableTokens.map((token) => (
                    <option
                      key={`${token.symbol}-${token.network}`}
                      value={`${token.symbol}-${token.network}`}
                    >
                      {token.symbol} ({token.network}) - ${token.usdValue.toFixed(2)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  style={styles.amountInput}
                />
                <button style={styles.maxButton} onClick={handleMaxAmount}>
                  MAX
                </button>
              </div>
              {fromToken && (
                <div style={styles.balance}>
                  Balance: {parseFloat(fromToken.balance).toFixed(4)} {fromToken.symbol}
                </div>
              )}
            </div>

            {/* Swap Direction Arrow */}
            <div style={styles.swapArrow}>
              <motion.div
                style={styles.arrowIcon}
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                ↓
              </motion.div>
            </div>

            {/* To Token */}
            <div style={styles.tokenSection}>
              <label style={styles.label}>To</label>
              <div style={styles.tokenInput}>
                <select
                  style={styles.tokenSelect}
                  value={toToken ? `${toToken.symbol}-${toToken.network}` : ''}
                  onChange={(e) => {
                    const [symbol, network] = e.target.value.split('-');
                    setToToken({ symbol, network });
                  }}
                >
                  <option value="">Select token</option>
                  {targetOptions.map((option) => (
                    <option
                      key={`${option.symbol}-${option.network}`}
                      value={`${option.symbol}-${option.network}`}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <div style={styles.estimatedOutput}>
                  {isLoadingQuote ? (
                    <span style={styles.loading}>Loading...</span>
                  ) : quote ? (
                    <span>{parseFloat(quote.toAmount).toFixed(6)}</span>
                  ) : (
                    <span style={styles.placeholder}>0.0</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quote Details */}
            {quote && (
              <motion.div
                style={styles.quoteCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={styles.quoteRow}>
                  <span>Exchange Rate</span>
                  <span>1 {quote.fromToken} = {(parseFloat(quote.toAmount) / parseFloat(quote.fromAmount)).toFixed(6)} {quote.toToken}</span>
                </div>
                <div style={styles.quoteRow}>
                  <span>Price Impact</span>
                  <span style={{ color: quote.priceImpact > 1 ? '#ef4444' : '#22c55e' }}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div style={styles.quoteRow}>
                  <span>Network Fee</span>
                  <span>~{quote.gasEstimate} ETH</span>
                </div>
                <div style={styles.quoteRow}>
                  <span>Route</span>
                  <span style={styles.route}>
                    {quote.route.join(' → ')}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Advanced Settings */}
            <div style={styles.advanced}>
              <button
                style={styles.advancedToggle}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced Settings {showAdvanced ? '▲' : '▼'}
              </button>
              {showAdvanced && (
                <motion.div
                  style={styles.advancedContent}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div style={styles.slippageSection}>
                    <label style={styles.slippageLabel}>Slippage Tolerance</label>
                    <div style={styles.slippageOptions}>
                      {[0.1, 0.5, 1.0].map((value) => (
                        <button
                          key={value}
                          style={{
                            ...styles.slippageOption,
                            ...(slippage === value ? styles.slippageActive : {}),
                          }}
                          onClick={() => setSlippage(value)}
                        >
                          {value}%
                        </button>
                      ))}
                      <input
                        type="number"
                        style={styles.slippageCustom}
                        placeholder="Custom"
                        value={[0.1, 0.5, 1.0].includes(slippage) ? '' : slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Swap Button */}
            <motion.button
              style={{
                ...styles.swapButton,
                ...((!quote || !isConnected || isSwapping) ? styles.swapButtonDisabled : {}),
              }}
              disabled={!quote || !isConnected || isSwapping}
              onClick={handleSwap}
              whileTap={{ scale: 0.98 }}
            >
              {isSwapping ? (
                <span style={styles.loadingSpinner}>⭕ Swapping...</span>
              ) : !isConnected ? (
                'Connect Wallet'
              ) : !quote ? (
                'Enter Amount'
              ) : (
                `Swap ${fromToken?.symbol} → ${toToken?.symbol}`
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '24px',
    maxWidth: '480px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid rgba(130, 71, 229, 0.1)',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '0 0 8px 0',
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1a1b23',
  },
  titleIcon: {
    fontSize: '1.2em',
  },
  poweredBy: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  katanaBrand: {
    color: '#8247e5',
    fontWeight: 700,
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0, 0, 0, 0.05)',
    color: '#6b7280',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  content: {
    padding: '24px',
    maxHeight: 'calc(90vh - 100px)',
    overflowY: 'auto',
  },
  tokenSection: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  tokenInput: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  tokenSelect: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid rgba(130, 71, 229, 0.15)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    background: 'white',
    color: '#1a1b23',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  amountInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid rgba(130, 71, 229, 0.15)',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 500,
    background: 'white',
    color: '#1a1b23',
    outline: 'none',
    textAlign: 'right',
    transition: 'border-color 0.2s ease',
  },
  maxButton: {
    padding: '6px 12px',
    background: 'rgba(130, 71, 229, 0.1)',
    border: '1px solid rgba(130, 71, 229, 0.2)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#8247e5',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  balance: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    textAlign: 'right',
  },
  swapArrow: {
    display: 'flex',
    justifyContent: 'center',
    margin: '16px 0',
  },
  arrowIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(130, 71, 229, 0.1)',
    border: '2px solid rgba(130, 71, 229, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#8247e5',
    cursor: 'pointer',
  },
  estimatedOutput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid rgba(130, 71, 229, 0.15)',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 500,
    background: 'rgba(130, 71, 229, 0.02)',
    color: '#1a1b23',
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  loading: {
    color: '#8247e5',
    animation: 'pulse 1.5s infinite',
  },
  placeholder: {
    color: '#9ca3af',
  },
  quoteCard: {
    background: 'rgba(130, 71, 229, 0.04)',
    border: '1px solid rgba(130, 71, 229, 0.15)',
    borderRadius: '12px',
    padding: '16px',
    margin: '16px 0',
  },
  quoteRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
  },
  route: {
    fontSize: '12px',
    color: '#8247e5',
    fontWeight: 500,
  },
  advanced: {
    margin: '16px 0',
  },
  advancedToggle: {
    background: 'none',
    border: 'none',
    color: '#8247e5',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 0',
    width: '100%',
    textAlign: 'left',
  },
  advancedContent: {
    padding: '16px 0',
  },
  slippageSection: {},
  slippageLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
    display: 'block',
  },
  slippageOptions: {
    display: 'flex',
    gap: '8px',
  },
  slippageOption: {
    padding: '8px 16px',
    border: '1px solid rgba(130, 71, 229, 0.2)',
    borderRadius: '8px',
    background: 'white',
    color: '#8247e5',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  slippageActive: {
    background: '#8247e5',
    color: 'white',
  },
  slippageCustom: {
    padding: '8px 12px',
    border: '1px solid rgba(130, 71, 229, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    width: '80px',
    textAlign: 'center',
    outline: 'none',
  },
  swapButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #8247e5 0%, #6b34d1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '24px',
    boxShadow: '0 8px 24px rgba(130, 71, 229, 0.3)',
  },
  swapButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default SwapModal;