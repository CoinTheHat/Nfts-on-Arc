# Arc NFT Launchpad (Lite)

A minimal, production-ready dApp on **Arc Testnet** for deploying and minting ERC-721 NFT collections.

## Features
- **Wallet Connection**: Connects to Arc Testnet (Chain ID 5042002).
- **Creator Dashboard**: Deploy your own NFT collection (Name, Symbol, Supply, Base URI, **Mint Price**).
- **Public Mint Page**: Shareable link for users to mint NFTs (supports free or paid mints).
- **Discovery**: Homepage features recently deployed collections.
- **No Backend**: Fully client-side using Arc RPC.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open the App**:
   Visit [http://localhost:3000](http://localhost:3000).

## Configuration
- **Chain Config**: `lib/arcChain.ts`
- **Wagmi Config**: `lib/wagmiClient.ts`
- **Smart Contract**: `contracts/NFTCollection.sol`

## Deployment
This project uses **Wagmi** and **Viem** to interact with the Arc Testnet.
Smart contracts are compiled using **Hardhat**.

To re-compile contracts:
```bash
npx hardhat compile
```
