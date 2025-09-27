import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPortfolioData } from './portfolioService.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
// Simple logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /portfolio?address=<wallet_address>
app.get('/portfolio', async (req, res) => {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid address parameter' });
  }

  try {
    const data = await getPortfolioData(address.toLowerCase());
    res.json(data);
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Ensolv backend API running on http://localhost:${PORT}`);
});