# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# Ensolv - ENS Portfolio Dashboard

Ensolv is a comprehensive portfolio management application that resolves ENS names to wallet addresses and displays detailed portfolio analytics across multiple blockchain networks.

## Features

### Phase 3 - Frontend Integration & Portfolio Dashboard

✅ **ENS Resolution**: Resolve ENS names (e.g., `vitalik.eth`) to wallet addresses using ethers.js and @ensdomains/ensjs
✅ **Portfolio API Integration**: Automatic portfolio fetching after successful ENS resolution
✅ **Portfolio Dashboard**: Comprehensive portfolio visualization with:
- Total USD value display
- Per-chain breakdown (Polygon & Rootstock)
- Token holdings with balance and USD values
- Interactive pie charts for network distribution
- Bar charts for top token holdings
- Detailed token and liquidity position tables

✅ **State Management**: Robust error handling and loading states
✅ **Navigation**: Switch between Portfolio and Swap views
✅ **Responsive Design**: Mobile-friendly UI with accessibility features

🔄 **Coming Soon**: Token swapping functionality

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Ethers.js** for ENS resolution
- **@ensdomains/ensjs** for ENS fallback resolution
- **Axios** for API communication
- **Recharts** for data visualization
- **CSS-in-JS** styling

### Backend
- **Node.js** with Express
- **Ethers.js** for blockchain interactions
- **Pyth Network** for price feeds
- **Multi-chain support** (Polygon, Rootstock)

## Quick Start

### Prerequisites
- Node.js (v18+)
- pnpm package manager

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
VITE_ETHEREUM_RPC_URL=https://ethereum-mainnet.infura.io/v3/YOUR_PROJECT_ID
VITE_API_BASE_URL=http://localhost:4000
```

### Installation & Development

```bash
# Install frontend dependencies
pnpm install

# Start the backend (in a separate terminal)
cd backend
pnpm install
pnpm start

# Start the frontend development server
pnpm dev
```

The application will be available at `http://localhost:5173`

## Architecture

### Frontend Components

- **`ENSResolver.tsx`**: Main component handling ENS resolution and portfolio integration
- **`PortfolioDashboard.tsx`**: Comprehensive portfolio visualization component
- **`SwapComponent.tsx`**: Placeholder component for future swap functionality
- **`App.tsx`**: Main application with navigation between Portfolio and Swap views

### API Integration

- **`portfolioAPI.ts`**: Service layer for backend communication
- **`portfolio.ts`**: TypeScript interfaces for portfolio data types

### Data Flow

1. User enters ENS name (e.g., `vitalik.eth`)
2. ENSResolver resolves ENS to wallet address
3. Automatic API call to backend `/portfolio` endpoint
4. Portfolio data fetched and displayed in PortfolioDashboard
5. Interactive charts and tables show portfolio breakdown

## API Endpoints

### Backend Portfolio API

- **GET `/health`**: Service health check
- **GET `/portfolio?address=<wallet_address>`**: Fetch portfolio data
- **GET `/api-docs`**: API documentation

### Example Response
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "summary": {
    "totalUsdValue": 1234.56,
    "networkTotals": {
      "polygon": 800.00,
      "rootstock": 434.56
    },
    "tokenCount": 5,
    "liquidityPositionCount": 2
  },
  "tokenHoldings": [...],
  "liquidityPositions": [...]
}
```

## Development Notes

### Error Handling
- Comprehensive error states for ENS resolution failures
- API connection error handling with user-friendly messages
- Loading states throughout the application flow

### Performance Optimizations
- Automatic portfolio refresh functionality
- Efficient re-rendering with React hooks
- Optimized chart rendering with Recharts

### Accessibility
- Proper ARIA labels and semantic HTML
- Keyboard navigation support
- Responsive design for mobile devices

## Future Roadmap

### Phase 4 - Token Swapping
- Integration with DEX aggregators
- Cross-chain swap functionality
- Portfolio-based token selection
- Transaction execution and tracking

### Phase 5 - Advanced Features
- Historical portfolio tracking
- DeFi yield farming integration
- NFT portfolio support
- Advanced analytics and insights

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ensolv Team** - Building the future of decentralized portfolio management

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
