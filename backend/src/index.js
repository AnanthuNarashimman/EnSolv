/**
 * @fileoverview Express.js server for EnSolv Portfolio API
 * 
 * This is the main server file that sets up the Express application,
 * configures middleware, defines API routes, and handles portfolio
 * data aggregation requests across multiple blockchain networks.
 * 
 * @author EnSolv Team
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { getPortfolioData } from './portfolioService.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());

/**
 * Enhanced logging middleware that tracks request details and response status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log response status when request completes
  res.on('finish', () => {
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  
  next();
});

app.use(express.json());

/**
 * Health check endpoint to verify API service status
 * @route GET /health
 * @returns {Object} Service status information including timestamp and version
 */
// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Ensolv Portfolio API',
    version: '1.0.0'
  });
});

/**
 * Main portfolio endpoint that aggregates wallet data across multiple chains
 * @route GET /portfolio
 * @param {string} address - Ethereum wallet address (query parameter)
 * @returns {Object} Complete portfolio data with token holdings and USD valuations
 * @throws {400} When address parameter is missing or invalid format
 * @throws {503} When blockchain networks are unavailable
 * @throws {500} When internal server error occurs
 */
// Main portfolio endpoint: GET /portfolio?address=<wallet_address>
app.get('/portfolio', async (req, res) => {
  const startTime = Date.now();
  const { address } = req.query;

  // Input validation
  if (!address || typeof address !== 'string') {
    console.log(`Invalid request - missing address parameter`);
    return res.status(400).json({ 
      error: 'Missing or invalid address parameter',
      message: 'Please provide a valid Ethereum wallet address as a query parameter'
    });
  }

  // Validate Ethereum address format
  if (!ethers.isAddress(address)) {
    console.log(`Invalid request - invalid address format: ${address}`);
    return res.status(400).json({ 
      error: 'Invalid Ethereum address format',
      message: 'The provided address is not a valid Ethereum address'
    });
  }

  try {
    console.log(`Fetching portfolio for address: ${address}`);
    const portfolioData = await getPortfolioData(address.toLowerCase());
    
    const responseTime = Date.now() - startTime;
    console.log(`Portfolio fetch completed for ${address} in ${responseTime}ms`);
    
    // Add metadata to response
    const response = {
      ...portfolioData,
      metadata: {
        responseTime: `${responseTime}ms`,
        cached: portfolioData.cached,
        apiVersion: '1.0.0'
      }
    };
    
    res.json(response);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Error fetching portfolio for ${address} (${responseTime}ms):`, error.message);
    
    // Determine appropriate error response based on error type
    if (error.message.includes('Invalid Ethereum address')) {
      return res.status(400).json({ 
        error: 'Invalid address format',
        message: error.message
      });
    }
    
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Unable to fetch data from blockchain networks. Please try again later.'
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch portfolio data. Please try again later.'
    });
  }
});

/**
 * API documentation endpoint providing comprehensive API information
 * @route GET /api-docs
 * @returns {Object} Complete API documentation with endpoints, parameters, and examples
 */
// API documentation endpoint
app.get('/api-docs', (_req, res) => {
  res.json({
    title: 'Ensolv Portfolio API',
    version: '1.0.0',
    description: 'API for aggregating wallet portfolio data across Polygon and Rootstock chains',
    endpoints: {
      '/health': {
        method: 'GET',
        description: 'Health check endpoint',
        response: 'Service status and metadata'
      },
      '/portfolio': {
        method: 'GET',
        description: 'Get wallet portfolio data across supported chains',
        parameters: {
          address: {
            type: 'string',
            required: true,
            description: 'Ethereum wallet address to fetch portfolio for'
          }
        },
        example: '/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        response: {
          address: 'string',
          updatedAt: 'ISO timestamp',
          summary: {
            totalUsdValue: 'number',
            networkTotals: {
              polygon: 'number',
              rootstock: 'number'
            },
            tokenCount: 'number',
            liquidityPositionCount: 'number'
          },
          tokenHoldings: 'array of token holdings',
          liquidityPositions: 'array of liquidity positions'
        }
      }
    },
    supportedNetworks: ['polygon', 'rootstock'],
    priceProvider: 'Pyth Network'
  });
});

/**
 * 404 handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 404 error response with route information
 */
// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

/**
 * Global error handler for unhandled application errors
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object} 500 error response
 */
// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

/**
 * Start the Express server and listen on the configured port
 * Logs server startup information and available endpoints
 */
app.listen(PORT, () => {
  console.log(`🚀 Ensolv Portfolio API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api-docs`);
  console.log(`💼 Portfolio endpoint: http://localhost:${PORT}/portfolio?address=<wallet_address>`);
});