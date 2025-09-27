import '@testing-library/jest-dom';

// Mock window.ethereum for MetaMask testing
Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: {
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
});

// Mock environment variables
process.env.VITE_ETHEREUM_RPC_URL = 'https://eth.llamarpc.com';