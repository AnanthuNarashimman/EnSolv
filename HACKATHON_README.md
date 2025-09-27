# 🔮 Ensolv - DeFi Portfolio & Cross-Chain Swap Platform

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://ensolv.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)](#testing)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **ETHGlobal Bangkok Hackathon Submission** - A comprehensive DeFi portfolio tracker with integrated cross-chain swap functionality powered by ENS resolution.

## 🌟 Overview

Ensolv is a next-generation DeFi dashboard that combines portfolio analytics with seamless cross-chain swaps. Simply enter any ENS name to instantly view comprehensive portfolio data and swap tokens across supported networks.

### Key Features

- 🔍 **ENS Resolution** - Resolve any ENS name to view portfolio analytics
- 📊 **Multi-Chain Portfolio Tracking** - View assets across 10+ networks
- 🔄 **Cross-Chain Swaps** - Powered by Katana Network for Polygon ↔ Rootstock
- 🎨 **Beautiful UI** - Modern glassmorphism design with smooth animations
- ⚡ **Real-time Data** - Live pricing via Pyth Network oracles
- 🔐 **Secure** - MetaMask integration with robust error handling

## 🚀 Sponsor Integrations

### Primary Sponsors

- **🏆 ENS (Ethereum Name Service)** - Core ENS resolution with dual fallback system
- **🏆 Katana Network (Sky Mavis)** - Cross-chain swap infrastructure for Polygon/Rootstock
- **🏆 Polygon** - Primary L2 network for DeFi operations
- **🏆 Rootstock** - Bitcoin-secured smart contract platform

### Supporting Technologies

- **Pyth Network** - Real-time price feeds and portfolio valuation
- **MetaMask** - Wallet connection and transaction signing
- **Viem/Ethers.js** - Ethereum interaction layer

## 🛠 Tech Stack

### Frontend
- **React 19** + **TypeScript** - Modern React with latest features
- **Vite** - Lightning-fast build tool
- **Framer Motion** - Smooth animations and transitions
- **React Hot Toast** - Beautiful notification system
- **Recharts** - Interactive portfolio charts

### Blockchain
- **Ethers.js 6** - Ethereum library
- **Viem** - Type-safe Ethereum library
- **@ensdomains/ensjs** - Official ENS JavaScript library
- **@sky-mavis/katana-swap** - Katana Network SDK

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Jest** - Testing framework

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MetaMask browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/AnkanMisra/EnSolv.git
cd EnSolv

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your RPC URLs and API keys

# Start development server
pnpm dev
```

### Environment Variables

```bash
# .env file
VITE_ETHEREUM_RPC_URL=https://eth.llamarpc.com
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_BASE_RPC_URL=https://mainnet.base.org
# Add other network RPC URLs...
```

### Build for Production

```bash
# Build the application
pnpm build

# Preview production build
pnpm preview

# Deploy to Vercel (recommended)
vercel --prod
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📱 Demo Instructions

### 2-Minute Video Script

1. **Start (0-30s)**: Show landing page, explain the problem Ensolv solves
2. **ENS Resolution (30s-1min)**: Enter "vitalik.eth", show dual resolution system
3. **Portfolio View (1min-1:30min)**: Explore charts, network distribution, token holdings
4. **Cross-Chain Swap (1:30min-2min)**: Open swap modal, show Katana integration, execute swap

### Live Demo Flow

1. **Open** [https://ensolv.vercel.app](https://ensolv.vercel.app)
2. **Connect MetaMask** wallet (or use demo mode)
3. **Enter ENS name**: Try `vitalik.eth`, `austingriffith.eth`, or `nick.eth`
4. **Explore Portfolio**: View interactive charts and breakdowns
5. **Test Swap**: Click "Swap Tokens" to see Katana Network integration
6. **Try Features**: Refresh data, copy addresses, explore different ENS names

## 🏗 Architecture

### Core Components

```
src/
├── components/           # React components
│   ├── ENSResolver.tsx   # Main ENS resolution interface
│   ├── PortfolioDashboard.tsx # Portfolio visualization
│   ├── SwapModal.tsx     # Katana-powered swap interface
│   └── ui/              # Reusable UI components
├── services/            # Business logic
│   ├── katanaSwap.ts    # Katana Network integration
│   ├── realPortfolioAPI.ts # Multi-chain portfolio aggregation
│   └── unifiedPortfolioService.ts # Service orchestration
├── contexts/            # React contexts
│   └── WalletContext.tsx # Wallet state management
└── providers/           # App providers
    └── ToastProvider.tsx # Toast notifications
```

### Data Flow

1. **ENS Resolution**: User enters ENS → Ethers.js + ENSJS → Wallet address
2. **Portfolio Fetch**: Address → Multi-chain APIs → Aggregated portfolio data
3. **Swap Preparation**: Portfolio tokens → Katana quotes → Swap execution
4. **Real-time Updates**: WebSocket connections for live price feeds

## 🤝 Sponsor Integration Details

### ENS Integration
- **Primary Resolution**: Ethers.js `provider.resolveName()`
- **Fallback Resolution**: ENSJS `getAddressRecord()`
- **Features Used**: Name-to-address resolution, reverse resolution (planned)

### Katana Network Integration
- **SDK**: `@sky-mavis/katana-swap`
- **Networks**: Polygon ↔ Rootstock cross-chain swaps
- **Features**: Quote aggregation, optimal routing, gas estimation

### Polygon Integration
- **Use Case**: Primary DeFi network for portfolio assets
- **Features**: Token balance queries, transaction execution, gas optimization
- **RPC**: Multiple endpoint redundancy for reliability

### Rootstock Integration  
- **Use Case**: Bitcoin-secured cross-chain destination
- **Features**: RBTC/DOC token support, bridge compatibility
- **Benefits**: Bitcoin security model for DeFi operations

## 🎯 Hackathon Highlights

### Innovation Points
1. **Dual ENS Resolution** - Redundant resolution with automatic fallback
2. **Cross-Chain UX** - Seamless Polygon ↔ Rootstock swaps
3. **Portfolio Pre-filling** - Swap modal auto-populated with user's tokens
4. **Error Resilience** - Robust error handling with user-friendly messages
5. **Performance** - Sub-second ENS resolution and portfolio loading

### Technical Excellence
- **Type Safety** - Full TypeScript coverage
- **Testing** - Unit tests for critical paths
- **Responsive Design** - Mobile-optimized interface
- **Error Boundaries** - Graceful failure handling
- **Performance** - Code splitting and lazy loading

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Connect to Vercel
vercel

# Deploy to production
vercel --prod
```

### Docker

```bash
# Build Docker image
docker build -t ensolv .

# Run container
docker run -p 3000:3000 ensolv
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Serve static files
serve -s dist
```

## 🤖 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ENS Team for pioneering decentralized naming
- Sky Mavis for Katana Network infrastructure
- Polygon team for L2 scaling solutions  
- Rootstock community for Bitcoin DeFi innovation
- ETHGlobal for hosting an incredible hackathon

## 📧 Contact

**Team**: AnkanMisra  
**Email**: ankan@ensolv.io  
**Twitter**: [@ensolv_io](https://twitter.com/ensolv_io)  
**Discord**: AnkanMisra#1234

---

<div align="center">
  <strong>Built with ❤️ for ETHGlobal Bangkok 2024</strong>
</div>