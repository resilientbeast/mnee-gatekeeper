# MNEE Gatekeeper Testing Guide

This guide walks you through testing the MNEE Gatekeeper application using the **Sepolia Testnet**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Testnet Tokens](#getting-testnet-tokens)
3. [Deploy Test MNEE Token](#deploy-test-mnee-token)
4. [Environment Setup](#environment-setup)
5. [Testing the Application](#testing-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 18+ installed
- [x] MetaMask browser extension
- [x] Telegram account
- [x] Supabase project set up
- [x] Reown (WalletConnect) project ID

---

## Getting Testnet Tokens

### Get Sepolia ETH (for gas)

**Option 1: Sepolia PoW Faucet (Recommended)**

1. Go to **[Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)**
2. Paste your wallet address
3. Click **"Start Mining"**
4. Leave the tab open for **10-15 minutes**
5. Once you have ~0.5 Sepolia ETH, stop mining and claim

**Option 2: Other Faucets**

| Faucet | Link | Notes |
|--------|------|-------|
| Alchemy | [sepoliafaucet.com](https://sepoliafaucet.com/) | Requires account |
| QuickNode | [faucet.quicknode.com](https://faucet.quicknode.com/ethereum/sepolia) | No account needed |
| Infura | [infura.io/faucet](https://www.infura.io/faucet/sepolia) | Requires account |

---

## Deploy Test MNEE Token

Since there's no official MNEE token on Sepolia, deploy your own test token.

### Using Remix IDE

1. Go to **[Remix IDE](https://remix.ethereum.org/)**
2. Create a new file called `TestMNEE.sol`
3. Paste this code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestMNEE is ERC20 {
    constructor() ERC20("Test MNEE", "tMNEE") {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }
    
    // Faucet - anyone can mint 1000 test tokens
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** 18);
    }
}
```

4. **Compile**: Click Solidity Compiler tab → Compile
5. **Deploy**: 
   - Click Deploy & Run tab
   - Set Environment to "Injected Provider - MetaMask"
   - Ensure MetaMask is on **Sepolia**
   - Click "Deploy" and confirm in MetaMask
6. **Copy the contract address** from "Deployed Contracts"

### Add Token to MetaMask

1. MetaMask → Assets → Import tokens
2. Paste your deployed contract address
3. Symbol: `tMNEE`, Decimals: `18`
4. You should see **1,000,000 tMNEE** in your wallet

---

## Environment Setup

### Local Development (`.env.local`)

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXT_PUBLIC_BOT_USERNAME=YourBotUsername

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Web3 - SEPOLIA TESTNET
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_MNEE_CONTRACT=0xYOUR_DEPLOYED_TEST_TOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=11155111

# RPC for backend verification
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth_sepolia

# Cron
CRON_SECRET=your_cron_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Deployment

Set these environment variables in Vercel Dashboard:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` |
| `NEXT_PUBLIC_MNEE_CONTRACT` | `0xYourSepoliaContractAddress` |
| `ETHEREUM_RPC_URL` | `https://rpc.ankr.com/eth_sepolia` |

---

## Testing the Application

### 1. Database Setup

Run the migration in Supabase SQL Editor:
```bash
# Use the script from: supabase/migrations/001_initial_schema.sql
```

### 2. Start the Development Server

```bash
npm install
npm run dev
```

### 3. Set Up Telegram Webhook (for local dev)

Use ngrok or similar to expose localhost:
```bash
ngrok http 3000
```

Set webhook:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-ngrok-url.ngrok.io/api/bot/webhook"
```

### 4. Register a Test Channel

Via Telegram Bot commands:
```
/addchannel -1001234567890 0xYourWalletAddress
/addplan -1001234567890 "Weekly Access" 1 7
/addplan -1001234567890 "Monthly Access" 5 30
```

### 5. Test the Payment Flow

1. **Open Mini App**: Send `/start -1001234567890` to your bot
2. **Connect Wallet**: Click the wallet button, connect MetaMask on Sepolia
3. **Get Test Tokens**: If needed, call `faucet()` in Remix on your deployed contract
4. **Select Plan**: Choose a subscription tier
5. **Pay**: Approve the tMNEE transfer transaction
6. **Verify**: Confirm the invite link is generated

### 6. Verify On-Chain

Check your transaction on [Sepolia Etherscan](https://sepolia.etherscan.io/):
- Confirm Transfer event emitted
- Verify recipient matches channel wallet
- Check amount matches plan price

---

## Troubleshooting

### "Insufficient balance" Error

- Ensure you have Sepolia ETH for gas
- Verify you have test tMNEE tokens in your wallet
- Check you're connected to Sepolia (Chain ID 11155111)

### Transaction Not Verifying

- Ensure `ETHEREUM_RPC_URL` is set to a reliable RPC like `https://rpc.ankr.com/eth_sepolia`
- Check the contract address matches your deployed test token
- Verify transaction was confirmed on Etherscan

### Wallet Won't Connect

- Ensure MetaMask is on Sepolia network
- Check `NEXT_PUBLIC_PROJECT_ID` is valid
- Try clearing browser cache and reconnecting

### Bot Not Responding

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check webhook is set: 
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
  ```
- Ensure the bot is added to your channel as admin

### RPC Timeout Errors

If you see "Failed to fetch transaction receipt", try a different RPC:
- `https://rpc.ankr.com/eth_sepolia` (recommended)
- `https://eth-sepolia.g.alchemy.com/v2/demo`
- `https://sepolia.infura.io/v3/YOUR_KEY`

---

## Production Deployment

When ready to deploy to mainnet:

1. Update environment variables:
   ```env
   NEXT_PUBLIC_MNEE_CONTRACT=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
   NEXT_PUBLIC_CHAIN_ID=1
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
   ```

2. Deploy to Vercel

3. Set the Telegram webhook to your production URL

---

## Quick Reference

| Environment | Chain ID | MNEE Contract | RPC URL |
|-------------|----------|---------------|---------|
| **Mainnet** | 1 | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` | Alchemy/Infura |
| **Sepolia** | 11155111 | Deploy your own | `https://rpc.ankr.com/eth_sepolia` |

---

## Resources

- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
- [Remix IDE](https://remix.ethereum.org/)
- [MNEE Official](https://mnee.io)
