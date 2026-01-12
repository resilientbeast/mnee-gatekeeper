# MNEE Gatekeeper Testing Guide

This guide walks you through testing the MNEE Gatekeeper application using the **Soneium Minato Testnet**.

> [!IMPORTANT]
> The MNEE CLI tool is for BSV blockchain and is **NOT valid** for this hackathon. This hackathon requires MNEE ERC-20 on Ethereum-compatible networks.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Network Configuration](#network-configuration)
3. [Getting Testnet Tokens](#getting-testnet-tokens)
4. [Environment Setup](#environment-setup)
5. [Testing the Application](#testing-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 18+ installed
- [x] MetaMask or compatible Web3 wallet
- [x] Telegram account
- [x] Supabase project set up
- [x] Reown (WalletConnect) project ID

---

## Network Configuration

### Add Soneium Minato to MetaMask

| Field | Value |
|-------|-------|
| **Network Name** | Soneium Minato |
| **RPC URL** | `https://rpc.minato.soneium.org/` |
| **Chain ID** | `1946` |
| **Currency Symbol** | ETH |
| **Block Explorer** | `https://explorer-testnet.soneium.org/` |

**Steps:**
1. Open MetaMask → Settings → Networks → Add Network
2. Enter the values above
3. Click "Save"

---

## Getting Testnet Tokens

### Step 1: Get Sepolia ETH (for bridging)

The easiest method is using the Sepolia PoW Faucet:

1. Go to **[Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)**
2. Paste your wallet address
3. Click **"Start Mining"**
4. Leave the tab open for **10-15 minutes**
5. Once you have ~0.5 Sepolia ETH, stop mining and claim

**Alternative Faucets:**
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) (requires account)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia) (no account needed)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

### Step 2: Bridge ETH to Soneium Minato

1. Go to **[Soneium Superbridge](https://superbridge.app/soneium-minato)**
2. Connect your wallet (ensure you're on Sepolia network)
3. Enter the amount of ETH to bridge (recommend 0.3+ ETH)
4. Accept terms and click **"Bridge"**
5. Confirm the transaction in MetaMask
6. Wait for bridging to complete (~5-10 minutes)

### Step 3: Deploy/Use Test MNEE Token

Since there's no official MNEE faucet on Soneium Minato, you have two options:

#### Option A: Deploy Your Own Test ERC-20 Token

Use this simple ERC-20 contract for testing:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestMNEE is ERC20 {
    constructor() ERC20("Test MNEE", "tMNEE") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    // Allow anyone to mint for testing
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount * 10 ** decimals());
    }
}
```

Deploy using:
- [Remix IDE](https://remix.ethereum.org/) - Connect to Soneium Minato
- Hardhat with custom network config

#### Option B: Use Existing Test Token

Check the [Soneium Minato Explorer](https://explorer-testnet.soneium.org/) for existing ERC-20 test tokens.

---

## Environment Setup

### Update `.env.local` for Soneium Minato Testing

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXT_PUBLIC_BOT_USERNAME=YourBotUsername

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Web3 - SONEIUM MINATO TESTNET
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_MNEE_CONTRACT=0xYOUR_DEPLOYED_TEST_TOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=1946

# RPC for backend verification
ETHEREUM_RPC_URL=https://rpc.minato.soneium.org/

# Cron
CRON_SECRET=your_cron_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Update Web3 Config to Support Soneium Minato

Modify `src/lib/web3-config.ts`:

```typescript
import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, sepolia } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Custom Soneium Minato network definition
const soneiumMinato: AppKitNetwork = {
    id: 1946,
    name: 'Soneium Minato',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.minato.soneium.org/'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Soneium Explorer',
            url: 'https://explorer-testnet.soneium.org/',
        },
    },
    testnet: true,
};

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
    console.warn('NEXT_PUBLIC_PROJECT_ID is not set');
}

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111;

// Network selection based on chain ID
export const networks: [AppKitNetwork, ...AppKitNetwork[]] =
    chainId === 1946
        ? [soneiumMinato, sepolia, mainnet]
        : chainId === 1
            ? [mainnet, sepolia]
            : [sepolia, mainnet];

export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId: projectId || '',
    networks,
});

export const config = wagmiAdapter.wagmiConfig;

export const metadata = {
    name: 'MNEE Gatekeeper',
    description: 'Subscribe to premium Telegram channels with MNEE',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    icons: ['/icon.png'],
};
```

---

## Testing the Application

### 1. Database Setup

```bash
# Run the migration in Supabase SQL Editor
# Use the script from: supabase/migrations/001_initial_schema.sql
```

### 2. Start the Development Server

```bash
npm install
npm run dev
```

### 3. Register a Test Channel

Via Telegram Bot commands:
```
/addchannel -1001234567890 0xYourWalletAddress
/addplan -1001234567890 "Weekly Access" 5 7
/addplan -1001234567890 "Monthly Access" 15 30
```

### 4. Test the Payment Flow

1. **Open Mini App**: Send `/start -1001234567890` to your bot
2. **Connect Wallet**: Click the wallet button, connect MetaMask on Soneium Minato
3. **Get Test Tokens**: If using your own contract, call the `faucet()` function
4. **Select Plan**: Choose a subscription tier
5. **Pay**: Approve the MNEE transfer transaction
6. **Verify**: Check that the invite link is generated

### 5. Verify On-Chain

Check your transaction on the [Soneium Minato Explorer](https://explorer-testnet.soneium.org/):
- Confirm Transfer event emitted
- Verify recipient matches channel wallet
- Check amount matches plan price

---

## Troubleshooting

### "Insufficient balance" Error

- Ensure you have bridged ETH to Soneium Minato for gas
- Verify you have test MNEE tokens in your wallet
- Check you're connected to the correct network (Chain ID 1946)

### Transaction Not Verifying

- Ensure `ETHEREUM_RPC_URL` is set to `https://rpc.minato.soneium.org/`
- Check the contract address matches your deployed test token
- Verify transaction was confirmed (check explorer)

### Wallet Won't Connect

- Ensure MetaMask has Soneium Minato network added
- Check `NEXT_PUBLIC_PROJECT_ID` is valid
- Try clearing browser cache and reconnecting

### Bot Not Responding

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check webhook is set: 
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
  ```
- Ensure the bot is added to your channel as admin

---

## Production Deployment

When ready to deploy to mainnet:

1. Update `.env` with production values:
   ```env
   NEXT_PUBLIC_MNEE_CONTRACT=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
   NEXT_PUBLIC_CHAIN_ID=1
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
   ```

2. Deploy to Vercel or your hosting provider

3. Set the Telegram webhook to your production URL

---

## Quick Reference

| Environment | Chain ID | MNEE Contract | RPC URL |
|-------------|----------|---------------|---------|
| **Mainnet** | 1 | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` | Infura/Alchemy |
| **Sepolia** | 11155111 | Deploy your own | `https://sepolia.infura.io/v3/...` |
| **Soneium Minato** | 1946 | Deploy your own | `https://rpc.minato.soneium.org/` |

---

## Resources

- [Soneium Minato Explorer](https://explorer-testnet.soneium.org/)
- [Soneium Superbridge](https://superbridge.app/soneium-minato)
- [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
- [MNEE Official](https://mnee.io)
- [Devpost Hackathon Forum](https://mnee-eth.devpost.com/forum_topics)
