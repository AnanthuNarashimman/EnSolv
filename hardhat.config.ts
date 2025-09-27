import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    ...(process.env.POLYGON_RPC_URL && {
      polygon: {
        url: process.env.POLYGON_RPC_URL,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: 137,
      },
    }),
    ...(process.env.AMOY_RPC_URL && {
      amoy: {  // Amoy testnet (formerly Mumbai)
        url: process.env.AMOY_RPC_URL,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: 80002,  // Amoy testnet chainId
      },
    }),
  },
};

export default config;
