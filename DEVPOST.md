# MNEE Gatekeeper

**Telegram-Native Subscription Paywalls Powered by MNEE Stablecoin**

---

## 🔮 Inspiration

Content creators on Telegram have a problem: monetizing exclusive content is either impossible or requires trusting third-party payment processors who take hefty cuts and impose geographic restrictions.

Meanwhile, crypto-native communities struggling with subscriptions face the volatility problem—nobody wants to pay 0.001 ETH today when it might be worth double tomorrow.

I wanted to build something that solved both problems at once: **MNEE Gatekeeper**, a Telegram Mini App that lets channel owners accept stable, programmable subscription payments directly in their chat platform—no payment processor middlemen, no volatility, no geographic restrictions.

The key insight: Telegram Mini Apps + MNEE stablecoin = frictionless, global subscription commerce native to where creators already have their audience.

---

## What it does

MNEE Gatekeeper is a turnkey subscription paywall system for Telegram channels:

- **Channel Registration**: Owners register their private channels and set up subscription plans (7-day, 30-day, lifetime, custom pricing)
- **Mini App Checkout**: Subscribers open a beautiful in-Telegram Mini App, connect their wallet, and pay with MNEE
- **On-Chain Verification**: The backend verifies the ERC-20 transfer directly on Ethereum—no trust required
- **Automatic Access**: Upon payment confirmation, the bot generates a single-use invite link and delivers it instantly
- **Subscription Management**: Expired subscriptions are automatically tracked, with optional removal from channels

The entire flow happens without leaving Telegram, creating a seamless Web3 commerce experience disguised as a familiar chat interaction.

---

## How we built it

We chose technologies optimized for both reliability and developer experience:

- **The Interface (Mini App)**: Built with Next.js 14 and Tailwind CSS, the Mini App uses Reown AppKit for wallet connections. It integrates deeply with Telegram's WebApp SDK for native theming and user context.

- **The Settlement Layer (MNEE)**: We use Wagmi and Viem to interact with the MNEE ERC-20 contract on Ethereum. Payments are simple `transfer()` calls—no complex smart contracts needed. The backend uses `getTransactionReceipt` to parse Transfer events and verify exact amounts.

- **The Backend (API Routes)**: Next.js API routes handle Telegram webhook events, payment verification, and invite link generation. All state is persisted in Supabase (PostgreSQL).

- **The Bot (Telegram)**: Uses `node-telegram-bot-api` for command handling, inline keyboards, and delivering invite links after successful payments.

### Architecture Highlights

```
User → Telegram Bot → Mini App (Connect Wallet)
                          ↓
                  MNEE Transfer (On-Chain)
                          ↓
              Backend Verification (Parse Logs)
                          ↓
            Generate Single-Use Invite Link
                          ↓
                 User Joins Channel ✅
```

---

## Challenges we ran into

- **Telegram Mini App Context**: Getting user identity reliably required handling both the `initDataUnsafe` from Telegram and graceful fallbacks for development environments.

- **Transaction Parsing**: Verifying the exact `Transfer` event from the MNEE contract required careful attention to address checksums, amount matching, and handling edge cases like multiple transfers in a single transaction.

- **Single-Use Links**: Telegram's invite link API has quirks—we needed to set proper expiration times and member limits to ensure each link works exactly once.

---

## Accomplishments that we're proud of

- **Zero-Trust Payment Verification**: We never ask users to "confirm" their payment—the blockchain is the source of truth. The backend independently verifies every transaction hash.

- **Native Telegram Experience**: The Mini App feels like part of Telegram, not a jarring redirect to an external site. Theme colors, user context, and instant access all contribute to a polished UX.

- **Creator-First Design**: Channel owners can self-register channels and manage plans entirely through bot commands—no admin panel needed to get started.

---

## What we learned

- **Stablecoins unlock real commerce**: The moment you remove volatility, crypto payments become viable for everyday transactions like subscriptions. MNEE's USD stability is essential for pricing recurring access.

- **Telegram is underrated for Web3**: The Mini App platform provides a captive audience of crypto-aware users who are already comfortable with bots and channels. It's the perfect distribution layer for Web3 apps.

- **Simplicity wins**: Rather than building complex escrow or streaming payment contracts, using simple ERC-20 transfers and off-chain subscription tracking keeps the system reliable and auditable.

---

## What's next for MNEE Gatekeeper

- **Multi-Channel Dashboard**: A web dashboard for creators to manage multiple channels, view analytics, and track revenue—all paid in MNEE.

- **Tiered Access**: Support for multiple subscription tiers within a single channel (e.g., Basic vs Premium content).

- **Recurring Payments**: Explore ERC-20 permit/approve patterns to enable true auto-renewal without repeated user interaction.

- **Revenue Splitting**: Automatic distribution of subscription revenue to multiple wallets (e.g., for collaborative channels with multiple creators).

---

## Built With

- blockchain
- ethereum
- mnee
- next.js
- node.js
- postgresql
- react
- reown-appkit
- shadcn-ui
- stablecoin
- supabase
- tailwindcss
- telegram-bot-api
- telegram-mini-app
- typescript
- viem
- wagmi
- web3

---

## Try it out

- [GitHub Repository](https://github.com/YOUR_USERNAME/mnee-gatekeeper)
- [Live Demo](https://your-deployment-url.vercel.app)
