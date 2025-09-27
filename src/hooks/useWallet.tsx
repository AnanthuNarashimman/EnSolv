import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  balance: string | null;
}

interface UseWalletReturn extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
  shortAddress: string | null;
}

export const useWallet = (): UseWalletReturn => {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    balance: null,
  });

  // Get short address for display
  const shortAddress = state.address
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    : null;

  // Check if wallet is connected
  const isConnected = !!state.address;

  // Get balance for connected address
  const getBalance = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  };

  // Connect wallet function - always prompts user to select account
  const connectWallet = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      }

      // Always request account access - this prompts user to choose account
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const balance = await getBalance(address, provider);

      setState({
        address,
        chainId,
        isConnecting: false,
        error: null,
        balance,
      });
    } catch (error: unknown) {
      console.error('Wallet connection error:', error);

      let errorMessage = 'Failed to connect wallet';
      if (error instanceof Error) {
        if (error.message.includes('MetaMask is not installed')) {
          errorMessage = error.message;
        } else if (error.message.includes('rejected')) {
          errorMessage = 'Connection request was rejected';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
        errorMessage = 'Connection request was rejected';
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      balance: null,
    });
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected wallet - always disconnect cleanly
      disconnectWallet();
    } else if (state.address && accounts[0] !== state.address && window.ethereum) {
      // User switched accounts while connected - update the account
      const address = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const balance = await getBalance(address, provider);

      setState(prev => ({
        ...prev,
        address,
        balance,
      }));
    }
    // If no current address (disconnected state), ignore account changes
    // User must explicitly connect again
  }, [state.address, disconnectWallet]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    setState(prev => ({
      ...prev,
      chainId,
    }));
  }, []);

  // Set up event listeners only - no auto-connect
  useEffect(() => {
    if (!window.ethereum) return;

    // Wrap async handler to match (...args: unknown[]) => void signature
    const accountsChangedListener = (accounts: unknown) => {
      if (Array.isArray(accounts)) {
        // Only call if accounts is an array of strings
        handleAccountsChanged(accounts as string[]);
      }
    };

    window.ethereum.on('accountsChanged', accountsChangedListener);

    // Wrap chainChanged handler to match (...args: unknown[]) => void
    const chainChangedListener = (chainIdHex: unknown) => {
      if (typeof chainIdHex === 'string') {
        handleChainChanged(chainIdHex);
      }
    };
    window.ethereum.on('chainChanged', chainChangedListener);

    // Cleanup
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', accountsChangedListener);
        window.ethereum.removeListener('chainChanged', chainChangedListener);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Update balance periodically
  useEffect(() => {
    if (!state.address || !window.ethereum) return;

    const updateBalance = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const balance = await getBalance(state.address!, provider);
      if (balance !== state.balance) {
        setState(prev => ({ ...prev, balance }));
      }
    };

    // Update balance immediately
    updateBalance();

    // Set up interval to update balance every 30 seconds
    const interval = setInterval(updateBalance, 30000);

    return () => clearInterval(interval);
  }, [state.address, state.balance]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    isConnected,
    shortAddress,
  };
};

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: {method: string; params?: unknown[]}) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

