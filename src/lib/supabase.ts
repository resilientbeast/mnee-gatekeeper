import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
    Database,
    User,
    Channel,
    SubscriptionPlan,
    Subscription,
    SubscriptionWithDetails
} from '@/types/database';

// Lazy-loaded Supabase clients to avoid build-time errors
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;

// Client-side Supabase client (uses anon key)
export function getSupabase(): SupabaseClient<Database> {
    if (!supabaseInstance) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !anonKey) {
            throw new Error('Supabase URL and Anon Key must be configured');
        }

        supabaseInstance = createClient<Database>(url, anonKey);
    }
    return supabaseInstance;
}

// Server-side Supabase client with service role (for admin operations)
export function getSupabaseAdmin(): SupabaseClient<Database> {
    if (!supabaseAdminInstance) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            throw new Error('Supabase URL and Service Role Key must be configured');
        }

        supabaseAdminInstance = createClient<Database>(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return supabaseAdminInstance;
}

// Legacy exports for backward compatibility
export const supabase = new Proxy({} as SupabaseClient<Database>, {
    get: (_, prop) => {
        const client = getSupabase();
        return (client as never)[prop];
    }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
    get: (_, prop) => {
        const client = getSupabaseAdmin();
        return (client as never)[prop];
    }
});

// Helper to get or create user
export async function getOrCreateUser(telegramId: string, walletAddress?: string): Promise<User | null> {
    const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

    if (existingUser) {
        const user = existingUser as User;
        // Update wallet address if provided and different
        if (walletAddress && user.wallet_address !== walletAddress) {
            const { data: updatedUser } = await supabaseAdmin
                .from('users')
                .update({ wallet_address: walletAddress } as never)
                .eq('id', user.id)
                .select()
                .single();
            return updatedUser as User | null;
        }
        return user;
    }

    // Create new user
    const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
            telegram_id: telegramId,
            wallet_address: walletAddress || null,
        } as never)
        .select()
        .single();

    if (error) throw error;
    return newUser as User | null;
}

// Get channel by Telegram channel ID
export async function getChannelByTelegramId(channelId: string): Promise<Channel | null> {
    const { data } = await supabaseAdmin
        .from('channels')
        .select('*, subscription_plans(*)')
        .eq('channel_id', channelId)
        .single();
    return data as Channel | null;
}

// Get active subscription plans for a channel
export async function getActivePlans(channelId: string): Promise<SubscriptionPlan[]> {
    const { data } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .order('price_mnee', { ascending: true });
    return (data || []) as SubscriptionPlan[];
}

// Create subscription and transaction
export async function createSubscription(
    userId: string,
    channelId: string,
    planId: string,
    txHash: string,
    fromAddress: string,
    toAddress: string,
    amount: number,
    durationDays: number | null
): Promise<{ subscription: Subscription; expiryDate: string | null }> {
    // Calculate expiry date
    const expiryDate = durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Create subscription
    const { data: subscriptionData, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
            user_id: userId,
            channel_id: channelId,
            plan_id: planId,
            status: 'active',
            expiry_date: expiryDate,
        } as never)
        .select()
        .single();

    if (subError) throw subError;

    const subscription = subscriptionData as Subscription;

    // Create transaction record
    const { error: txError } = await supabaseAdmin.from('transactions').insert({
        subscription_id: subscription.id,
        tx_hash: txHash,
        from_address: fromAddress,
        to_address: toAddress,
        amount,
        status: 'confirmed',
    } as never);

    if (txError) throw txError;

    return { subscription, expiryDate };
}

// Get expired subscriptions
export async function getExpiredSubscriptions(): Promise<SubscriptionWithDetails[]> {
    const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('*, user:users(*), channel:channels(*)')
        .eq('status', 'active')
        .not('expiry_date', 'is', null)
        .lt('expiry_date', new Date().toISOString());
    return (data || []) as SubscriptionWithDetails[];
}

// Mark subscription as expired
export async function expireSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired' } as never)
        .eq('id', subscriptionId);
    if (error) throw error;
}
