# MNEE Gatekeeper - Vercel Deployment Guide

A complete step-by-step guide to deploy the MNEE Gatekeeper Telegram Mini App to Vercel.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Prepare Local Repository](#prepare-local-repository)
3. [Set Up External Services](#set-up-external-services)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Set Up Telegram Webhook](#set-up-telegram-webhook)
7. [Create Demo Channel](#create-demo-channel)
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

## Prepare Local Repository

### Step 1: Verify Project Builds Locally

```bash
cd mnee-gatekeeper

# Install dependencies
npm install

# Test the build
npm run build
```

If the build succeeds, you're ready to deploy.

### Step 2: Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - MNEE Gatekeeper"
```

### Step 3: Push to GitHub

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `mnee-gatekeeper`
3. Make it **Public** (required for hackathon)
4. Do NOT initialize with README (you already have one)
5. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/mnee-gatekeeper.git
git branch -M main
git push -u origin main
```

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

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find and select your `mnee-gatekeeper` repository
4. Click **"Import"**
5. **Framework Preset**: Next.js (auto-detected)
6. **Root Directory**: Leave as is (or select `mnee-gatekeeper` if in subdirectory)
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

### Network Configuration Options:

**For Testnet (Soneium Minato) - Recommended for Demo:**
```
NEXT_PUBLIC_MNEE_CONTRACT=0xYOUR_TEST_TOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=1946
ETHEREUM_RPC_URL=https://rpc.minato.soneium.org/
```

**For Mainnet (Production):**
```
NEXT_PUBLIC_MNEE_CONTRACT=0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF
NEXT_PUBLIC_CHAIN_ID=1
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
```

### Generate CRON_SECRET:

```bash
# Run in terminal to generate random secret
openssl rand -hex 32
```

Or use: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

### Redeploy After Adding Variables:

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** → NO (uncheck it)
5. Click **"Redeploy"**

---

## Set Up Telegram Webhook

After successful deployment, configure Telegram to send updates to your app.

### Get Your Deployment URL

Your Vercel URL will be: `https://mnee-gatekeeper-xxxxx.vercel.app`

Find it in the Vercel dashboard under your project.

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

**Expected response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/bot/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## Create Demo Channel

### Step 1: Create Private Channel

1. Open Telegram
2. Tap **New Channel**
3. Name: `MNEE Gatekeeper Demo`
4. Description: `Demo channel for MNEE stablecoin subscriptions`
5. Select **Private Channel**
6. Skip adding members

### Step 2: Add Bot as Admin

1. Open channel settings
2. Go to **Administrators**
3. Click **Add Administrator**
4. Search for your bot username
5. Grant these permissions:
   - ✅ Invite Users via Link
   - ✅ Post Messages (optional)
6. Save

### Step 3: Get Channel ID

Send a message in the channel, then:

1. Forward that message to **@userinfobot**
2. It will show the channel ID (format: `-100xxxxxxxxxx`)

Or use the API:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

### Step 4: Register Channel with Bot

Send these commands to your bot in Telegram:

```
/addchannel -100CHANNEL_ID 0xYourWalletAddress
```

Then add subscription plans:
```
/addplan -100CHANNEL_ID "Demo Weekly" 1 7
/addplan -100CHANNEL_ID "Demo Monthly" 5 30
```

---

## Verify Deployment

### Checklist

| Test | How to Verify |
|------|---------------|
| ✅ App loads | Visit your Vercel URL |
| ✅ Bot responds | Send `/start` to bot |
| ✅ Channel registered | Send `/admin` to see channels |
| ✅ Plans visible | Send `/start -100CHANNEL_ID` |
| ✅ Mini App opens | Click "Subscribe Now" button |
| ✅ Wallet connects | Connect MetaMask in Mini App |
| ✅ Payment works | Complete a test payment |
| ✅ Invite link received | Should get link after payment |

### Test Full Flow

1. **Start the bot**: Send `/start -100YOUR_CHANNEL_ID`
2. **Open Mini App**: Click the "Subscribe Now" button
3. **Connect wallet**: MetaMask on correct network
4. **Select plan**: Choose a subscription tier
5. **Pay**: Approve the MNEE transfer
6. **Get link**: Receive and use invite link
7. **Join channel**: Verify access granted

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `Module not found`
- Check all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

**Error**: Type errors
```bash
# Run locally to see errors
npm run build
```

### Bot Not Responding

1. Check webhook is set correctly:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

2. Check Vercel function logs:
   - Vercel Dashboard → Project → **Logs** tab

3. Verify `TELEGRAM_BOT_TOKEN` is correct

### Mini App Not Loading

1. Check `NEXT_PUBLIC_APP_URL` matches your Vercel domain
2. Ensure HTTPS (Telegram requires it)
3. Check browser console for errors

### Payments Not Verifying

1. Verify `ETHEREUM_RPC_URL` is correct for your chain
2. Check `NEXT_PUBLIC_MNEE_CONTRACT` address
3. Look at Vercel function logs for errors

### Database Errors

1. Verify Supabase credentials are correct
2. Check migration was run successfully
3. Test connection:
   ```bash
   curl "https://xxx.supabase.co/rest/v1/channels" \
     -H "apikey: YOUR_ANON_KEY"
   ```

---

## Production Domains (Optional)

### Add Custom Domain

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to new domain
5. Update Telegram webhook URL

---

## Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| Your App | `https://your-app.vercel.app` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| Supabase Dashboard | `https://supabase.com/dashboard` |
| Telegram BotFather | `https://t.me/BotFather` |
| Reown Console | `https://cloud.reown.com` |

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

---

## Next Steps

After successful deployment:

1. ✅ Test full payment flow
2. ✅ Record demo video
3. ✅ Submit to Devpost before deadline
4. ✅ Include GitHub repo link
5. ✅ Include Live Demo URL
6. ✅ Include Bot link for judges
