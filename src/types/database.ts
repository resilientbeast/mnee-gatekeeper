// Database types for Supabase tables

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Channel {
  id: string;
  channel_id: string;
  channel_name: string;
  admin_telegram_id: string;
  wallet_address: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  channel_id: string;
  name: string;
  price_mnee: number;
  duration_days: number | null;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  telegram_id: string;
  wallet_address: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  channel_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  expiry_date: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  subscription_id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  status: TransactionStatus;
  created_at: string;
}

// Join types for queries
export interface SubscriptionWithDetails extends Subscription {
  user?: User;
  channel?: Channel;
  plan?: SubscriptionPlan;
}

export interface ChannelWithPlans extends Channel {
  subscription_plans?: SubscriptionPlan[];
}

// Supabase Database type - must match the exact format expected by @supabase/supabase-js
export type Database = {
  public: {
    Tables: {
      channels: {
        Row: Channel;
        Insert: {
          id?: string;
          channel_id: string;
          channel_name: string;
          admin_telegram_id: string;
          wallet_address: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          channel_name?: string;
          admin_telegram_id?: string;
          wallet_address?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: {
          id?: string;
          channel_id: string;
          name: string;
          price_mnee: number;
          duration_days?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          name?: string;
          price_mnee?: number;
          duration_days?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: User;
        Insert: {
          id?: string;
          telegram_id: string;
          wallet_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          telegram_id?: string;
          wallet_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          id?: string;
          user_id: string;
          channel_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          expiry_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          expiry_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          subscription_id: string;
          tx_hash: string;
          from_address: string;
          to_address: string;
          amount: number;
          status?: TransactionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          tx_hash?: string;
          from_address?: string;
          to_address?: string;
          amount?: number;
          status?: TransactionStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
