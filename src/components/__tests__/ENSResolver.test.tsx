import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealPortfolioAPI } from '../../services/realPortfolioAPI';
import ENSResolver from '../ENSResolver';
import { WalletProvider } from '../../contexts/WalletContext';
import { ToastProvider } from '../../providers/ToastProvider';

// Mock the services
jest.mock('../services/realPortfolioAPI');
const mockRealPortfolioAPI = RealPortfolioAPI as jest.Mocked<typeof RealPortfolioAPI>;

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      resolveName: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    })),
  },
}));

// Mock ENS client
jest.mock('@ensdomains/ensjs', () => ({
  createEnsPublicClient: jest.fn(() => ({
    getAddressRecord: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
  })),
}));

const renderENSResolver = () => {
  return render(
    <ToastProvider>
      <WalletProvider>
        <ENSResolver />
      </WalletProvider>
    </ToastProvider>
  );
};

describe('ENSResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variable
    process.env.VITE_ETHEREUM_RPC_URL = 'https://eth.llamarpc.com';
    
    // Setup default mocks
    mockRealPortfolioAPI.getPortfolio.mockResolvedValue({
      summary: {
        totalUsdValue: 1000,
        tokenCount: 5,
        liquidityPositionCount: 2,
        networkTotals: {
          ethereum: 500,
          polygon: 300,
          base: 200,
        },
      },
      tokenHoldings: [
        {
          symbol: 'USDC',
          balance: '1000',
          usdValue: 1000,
          network: 'ethereum',
        },
      ],
      liquidityPositions: [],
      updatedAt: new Date().toISOString(),
    } as any);
  });

  it('should render ENS resolver form', () => {
    renderENSResolver();
    
    expect(screen.getByPlaceholderText(/Try: .* or enter any ENS name/)).toBeInTheDocument();
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('should show example ENS names', () => {
    renderENSResolver();
    
    expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    expect(screen.getByText('austingriffith.eth')).toBeInTheDocument();
    expect(screen.getByText('nick.eth')).toBeInTheDocument();
  });

  it('should resolve ENS name and fetch portfolio', async () => {
    renderENSResolver();
    
    const input = screen.getByPlaceholderText(/Try: .* or enter any ENS name/);
    const resolveButton = screen.getByText('Resolve');
    
    fireEvent.change(input, { target: { value: 'vitalik.eth' } });
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(mockRealPortfolioAPI.getPortfolio).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890'
      );
    });
  });

  it('should handle ENS resolution errors gracefully', async () => {
    const { ethers } = require('ethers');
    ethers.JsonRpcProvider.mockImplementation(() => ({
      resolveName: jest.fn().mockRejectedValue(new Error('Failed to resolve')),
    }));
    
    renderENSResolver();
    
    const input = screen.getByPlaceholderText(/Try: .* or enter any ENS name/);
    const resolveButton = screen.getByText('Resolve');
    
    fireEvent.change(input, { target: { value: 'invalid.eth' } });
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should handle portfolio fetch errors gracefully', async () => {
    mockRealPortfolioAPI.getPortfolio.mockRejectedValue(new Error('Portfolio fetch failed'));
    
    renderENSResolver();
    
    const input = screen.getByPlaceholderText(/Try: .* or enter any ENS name/);
    const resolveButton = screen.getByText('Resolve');
    
    fireEvent.change(input, { target: { value: 'vitalik.eth' } });
    fireEvent.click(resolveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should allow clicking example ENS names', () => {
    renderENSResolver();
    
    const exampleButton = screen.getByText('vitalik.eth');
    fireEvent.click(exampleButton);
    
    const input = screen.getByPlaceholderText(/Try: .* or enter any ENS name/) as HTMLInputElement;
    expect(input.value).toBe('vitalik.eth');
  });

  it('should disable resolve button when input is empty', () => {
    renderENSResolver();
    
    const resolveButton = screen.getByText('Resolve') as HTMLButtonElement;
    expect(resolveButton.disabled).toBe(true);
  });

  it('should enable resolve button when input has value', () => {
    renderENSResolver();
    
    const input = screen.getByPlaceholderText(/Try: .* or enter any ENS name/);
    const resolveButton = screen.getByText('Resolve') as HTMLButtonElement;
    
    fireEvent.change(input, { target: { value: 'test.eth' } });
    
    expect(resolveButton.disabled).toBe(false);
  });
});