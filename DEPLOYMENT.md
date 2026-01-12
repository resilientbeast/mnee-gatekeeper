# MNEE Gatekeeper - Deployment Guide

A step-by-step guide to deploy your own MNEE Gatekeeper instance.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone & Install](#clone--install)
3. [Set Up External Services](#set-up-external-services)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Set Up Telegram Webhook](#set-up-telegram-webhook)
7. [Create Your Channel](#create-your-channel)
8. [Verify Deployment](#verify-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 18+ installed
- [x] Git installed
- [x] GitHub account
- [x] Vercel account (free tier works)
- [x] Telegram account
- [x] MetaMask wallet

---

## Clone & Install

### Step 1: Clone the Repository

```bash
git clone https://github.com/resilientbeast/mnee-gatekeeper.git
cd mnee-gatekeeper
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Test the Build

```bash
npm run build
```

If the build succeeds, you're ready to deploy.

---

## Set Up External Services

### A. Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `MNEE Gatekeeper`
4. Choose a username: `YourMNEEGatekeeperBot` (must end in `bot`)
5. **Save the API token** - you'll need it for environment variables

### B. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - Project name: `mnee-gatekeeper`
   - Database password: Generate a strong password
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

5. **Run the database migration:**
   - Go to **SQL Editor** in left sidebar
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click **"Run"**

6. **Get your credentials** (Settings → API):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### C. Get Reown (WalletConnect) Project ID

1. Go to [cloud.reown.com](https://cloud.reown.com)
2. Sign up / Sign in
3. Click **"Create Project"**
4. Name: `MNEE Gatekeeper`
5. Copy the **Project ID** → `NEXT_PUBLIC_PROJECT_ID`

---

## Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Fork the repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Find and select your forked `mnee-gatekeeper` repository
5. Click **"Import"**
6. **Framework Preset**: Next.js (auto-detected)
7. **Skip environment variables for now** - we'll add them next
8. Click **"Deploy"**

The initial deploy will fail (missing env vars) - that's expected!

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from mnee-gatekeeper directory)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? mnee-gatekeeper
# - Directory? ./
# - Override settings? No
```

---

## Configure Environment Variables

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable below:

| Variable | Value | Environment |
|----------|-------|-------------|
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` (from BotFather) | Production, Preview |
| `NEXT_PUBLIC_BOT_USERNAME` | `YourMNEEGatekeeperBot` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production, Preview |
| `NEXT_PUBLIC_PROJECT_ID` | `abc123...` (Reown) | Production, Preview |
| `NEXT_PUBLIC_MNEE_CONTRACT` | See below | Production, Preview |
| `NEXT_PUBLIC_CHAIN_ID` | See below | Production, Preview |
| `ETHEREUM_RPC_URL` | See below | Production, Preview |
| `CRON_SECRET` | Generate random string | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production, Preview |

### Network Configuration:

**For Testnet (Sepolia) - Recommended for Testing:**
```
NEXT_PUBLIC_MNEE_CONTRACT=0xYOUR_TEST_TOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=11155111
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth_sepolia
```

**For Mainnet (Production):**
```
NEXT_PUBLIC_MNEE_CONTRACT=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
NEXT_PUBLIC_CHAIN_ID=1
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
```

### Generate CRON_SECRET:

```bash
openssl rand -hex 32
```

Or use: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

### Redeploy After Adding Variables:

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**
4. Uncheck **"Use existing Build Cache"**
5. Click **"Redeploy"**

---

## Set Up Telegram Webhook

After successful deployment, configure Telegram to send updates to your app.

### Set the Webhook

Run this command (replace placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/bot/webhook"}'
```

**Expected response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Verify Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## Create Your Channel

### Step 1: Create Private Channel

1. Open Telegram → **New Channel**
2. Name your channel
3. Select **Private Channel**

### Step 2: Add Bot as Admin

1. Channel settings → **Administrators** → **Add Administrator**
2. Search for your bot username
3. Grant these permissions:
   - ✅ Invite Users via Link
   - ✅ Add Members

### Step 3: Get Channel ID

Forward any channel message to **@userinfobot** to get the channel ID (format: `-100xxxxxxxxxx`)

### Step 4: Register Channel with Bot

Send these commands to your bot:

```
/addchannel -100CHANNEL_ID 0xYourWalletAddress
/addplan -100CHANNEL_ID "Weekly Access" 1 7
/addplan -100CHANNEL_ID "Monthly Access" 5 30
```

---

## Verify Deployment

### Test Checklist

| Test | How to Verify |
|------|---------------|
| ✅ App loads | Visit your Vercel URL |
| ✅ Bot responds | Send `/start` to bot |
| ✅ Plans visible | Send `/start -100CHANNEL_ID` |
| ✅ Mini App opens | Click "Subscribe Now" button |
| ✅ Wallet connects | Connect MetaMask in Mini App |
| ✅ Payment works | Complete a test payment |
| ✅ Invite link works | Use the generated link to join |

---

## Troubleshooting

### Bot Not Responding

1. Check webhook: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
2. Check Vercel logs: Dashboard → Project → Logs tab
3. Verify `TELEGRAM_BOT_TOKEN` is correct

### Mini App Not Loading

- Check `NEXT_PUBLIC_APP_URL` matches your Vercel domain
- Ensure using HTTPS

### Payments Not Verifying

- Verify `ETHEREUM_RPC_URL` is correct for your chain
- Check `NEXT_PUBLIC_MNEE_CONTRACT` address
- Look at Vercel function logs for detailed error messages

### RPC Timeout Errors

Try a different RPC provider:
- `https://rpc.ankr.com/eth_sepolia` (recommended)
- `https://eth-sepolia.g.alchemy.com/v2/demo`

---

## Quick Reference

### Bot Commands

```
/start - Welcome message
/start [channel_id] - View channel subscription
/admin - List your channels
/addchannel [id] [wallet] - Register channel
/addplan [id] "name" [price] [days] - Add plan
/plans [id] - View plans
/help - Show commands
```

### Useful Links

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| Telegram BotFather | https://t.me/BotFather |
| Reown Console | https://cloud.reown.com |
