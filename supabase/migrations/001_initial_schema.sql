-- MNEE Gatekeeper Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Channels table - Stores managed private channels
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  admin_telegram_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_channels_admin ON channels(admin_telegram_id);
CREATE INDEX IF NOT EXISTS idx_channels_channel_id ON channels(channel_id);

-- Subscription Plans table - Flexible pricing/duration options
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_mnee DECIMAL(18, 8) NOT NULL,
  duration_days INTEGER, -- NULL = lifetime
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active plans lookup
CREATE INDEX IF NOT EXISTS idx_plans_channel ON subscription_plans(channel_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- Users table - Subscriber records
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id TEXT NOT NULL UNIQUE,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Subscriptions table - Active/expired subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON subscriptions(expiry_date) WHERE expiry_date IS NOT NULL;

-- Transactions table - Payment records
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON transactions(subscription_id);

-- Enable Row Level Security (RLS)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service role (allow all for backend)
-- Note: These policies allow authenticated service role access
-- You may want to adjust based on your security requirements

CREATE POLICY "Service role can do everything on channels"
  ON channels FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on subscription_plans"
  ON subscription_plans FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions to service role
GRANT ALL ON channels TO service_role;
GRANT ALL ON subscription_plans TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON transactions TO service_role;
