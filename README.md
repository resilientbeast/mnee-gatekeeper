# MNEE Gatekeeper

A Telegram Mini App for selling access to private channels using MNEE stablecoin (ERC-20).

## Features

- 🔐 Accept MNEE stablecoin payments for channel subscriptions
- ⏰ Flexible subscription plans (7-day, 30-day, lifetime, etc.)
- 🔗 Automatic single-use invite link generation
- 📱 Beautiful Telegram Mini App interface
- 🤖 Bot commands for channel management
- ⚡ On-chain payment verification

## Setup

### Prerequisites

- Node.js 18+
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Supabase account
- Reown/WalletConnect Project ID
- Ethereum RPC URL (Infura, Alchemy, etc.)

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### 2. Database Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the migration script from `supabase/migrations/001_initial_schema.sql`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Set Webhook

After deploying, set your Telegram webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/bot/webhook"}'
```

## Bot Commands

### For Channel Owners

| Command | Description |
|---------|-------------|
| `/admin` | View your registered channels |
| `/addchannel [channel_id] [wallet]` | Register a new channel |
| `/plans [channel_id]` | View subscription plans |
| `/addplan [channel_id] "name" [price] [days]` | Create a plan |

### For Users

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/start [channel_id]` | View subscription options |
| `/help` | Show all commands |

## User Flow

1. User sends `/start` or clicks subscription link
2. Bot shows "Subscribe" button opening Mini App
3. User connects wallet in Mini App
4. User selects plan and clicks "Pay"
5. MNEE tokens transferred to channel wallet
6. Backend verifies transaction on-chain
7. Bot generates single-use invite link
8. User joins private channel

## Cron Job

Set up a cron job to check expired subscriptions:

```bash
# Run every hour
0 * * * * curl -X GET "https://your-domain.com/api/cron/check-expiry" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI
- **Web3**: Wagmi, Viem, Reown AppKit
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Bot**: node-telegram-bot-api

## Acknowledgments & Third-Party Licenses

This project uses the following open-source libraries:

- [Next.js](https://nextjs.org/) - MIT License
- [Wagmi](https://wagmi.sh/) - MIT License
- [Viem](https://viem.sh/) - MIT License
- [Reown AppKit](https://reown.com/) - Apache 2.0 License
- [Supabase](https://supabase.com/) - MIT License
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - MIT License
- [Tailwind CSS](https://tailwindcss.com/) - MIT License
- [Shadcn UI](https://ui.shadcn.com/) - MIT License

## License

MIT
