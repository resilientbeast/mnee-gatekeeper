import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { supabaseAdmin, getActivePlans } from '@/lib/supabase';
import {
    sendMessage,
    buildWelcomeMessage,
    buildPlansKeyboard,
    isChannelAdmin,
} from '@/lib/telegram';
import type { Channel, SubscriptionPlan } from '@/types/database';

// Helper to find channel by either UUID or Telegram channel ID
async function findChannel(channelId: string): Promise<Channel | null> {
    // Try by UUID first
    const { data: byId } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

    if (byId) return byId as Channel;

    // Try by Telegram channel ID
    const { data: byTgId } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('channel_id', channelId)
        .single();

    return byTgId as Channel | null;
}

// Helper to find channel by either UUID or Telegram ID with admin check
async function findChannelByAdmin(channelId: string, adminId: string): Promise<Channel | null> {
    // Try by UUID first
    const { data: byId } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .eq('admin_telegram_id', adminId)
        .single();

    if (byId) return byId as Channel;

    // Try by Telegram channel ID
    const { data: byTgId } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('channel_id', channelId)
        .eq('admin_telegram_id', adminId)
        .single();

    return byTgId as Channel | null;
}

// Telegram update types
interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
        };
        chat: {
            id: number;
            type: string;
        };
        text?: string;
        reply_to_message?: {
            text?: string;
        };
    };
    callback_query?: {
        id: string;
        from: {
            id: number;
            first_name: string;
        };
        message: {
            chat: {
                id: number;
            };
        };
        data: string;
    };
}

// POST /api/bot/webhook - Handle Telegram webhook updates
export async function POST(request: NextRequest) {
    try {
        const update: TelegramUpdate = await request.json();

        // Handle callback queries (button clicks)
        if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
            return NextResponse.json({ ok: true });
        }

        // Handle messages
        if (update.message?.text) {
            await handleMessage(update.message);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ ok: true }); // Always return 200 to prevent retries
    }
}

async function handleMessage(message: TelegramUpdate['message']) {
    if (!message) return;

    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text || '';
    const args = text.split(' ');
    const command = args[0].toLowerCase();

    switch (command) {
        case '/start':
            await handleStartCommand(chatId, userId, args.slice(1));
            break;
        case '/admin':
            await handleAdminCommand(chatId, userId);
            break;
        case '/addchannel':
            await handleAddChannelCommand(chatId, userId, args.slice(1));
            break;
        case '/plans':
            await handlePlansCommand(chatId, userId, args.slice(1));
            break;
        case '/addplan':
            await handleAddPlanCommand(chatId, userId, args.slice(1));
            break;
        case '/help':
            await handleHelpCommand(chatId);
            break;
        default:
            // Ignore other messages
            break;
    }
}

// /start [channelId] - Welcome message with subscription button
async function handleStartCommand(
    chatId: number,
    _userId: number,
    args: string[]
) {
    const channelId = args[0];

    if (channelId) {
        // Fetch channel and show subscription options
        const channel = await findChannel(channelId);

        if (channel) {
            const plans = await getActivePlans(channel.id);

            if (plans.length > 0) {
                const { text, keyboard } = buildWelcomeMessage(
                    channel.channel_name,
                    channel.id
                );
                await sendMessage(chatId, text, { reply_markup: keyboard });
            } else {
                await sendMessage(
                    chatId,
                    `No subscription plans available for ${channel.channel_name} yet.`
                );
            }
            return;
        }
    }

    // Generic welcome message
    await sendMessage(
        chatId,
        `👋 <b>Welcome to MNEE Gatekeeper!</b>\n\n` +
        `I help Telegram channel owners accept MNEE stablecoin payments for subscriptions.\n\n` +
        `<b>For Subscribers:</b>\n` +
        `Click subscribe links from channel owners to access premium content.\n\n` +
        `<b>For Channel Owners:</b>\n` +
        `/admin - Manage your channels\n` +
        `/help - View all commands`
    );
}

// /admin - Show admin options
async function handleAdminCommand(chatId: number, userId: number) {
    // Get channels where user is admin
    const { data } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('admin_telegram_id', userId.toString());

    const channels = (data || []) as Channel[];

    if (channels.length === 0) {
        await sendMessage(
            chatId,
            `<b>🔧 Admin Panel</b>\n\n` +
            `You haven't registered any channels yet.\n\n` +
            `To add a channel:\n` +
            `1. Add this bot as an admin to your private channel\n` +
            `2. Run: /addchannel [channel_id] [wallet_address]\n\n` +
            `Example:\n` +
            `<code>/addchannel -1001234567890 0x1234...abcd</code>`
        );
        return;
    }

    let response = `<b>🔧 Admin Panel</b>\n\n<b>Your Channels:</b>\n\n`;

    for (const channel of channels) {
        const plans = await getActivePlans(channel.id);
        response += `📺 <b>${channel.channel_name}</b>\n`;
        response += `   ID: <code>${channel.channel_id}</code>\n`;
        response += `   Plans: ${plans.length}\n`;
        response += `   Wallet: <code>${channel.wallet_address.slice(0, 10)}...</code>\n\n`;
    }

    response += `\n<b>Commands:</b>\n`;
    response += `/addchannel - Add new channel\n`;
    response += `/plans [channel_id] - View plans\n`;
    response += `/addplan - Add subscription plan`;

    await sendMessage(chatId, response);
}

// /addchannel [channel_id] [wallet_address] - Register a channel
async function handleAddChannelCommand(
    chatId: number,
    userId: number,
    args: string[]
) {
    if (args.length < 2) {
        await sendMessage(
            chatId,
            `<b>Usage:</b>\n<code>/addchannel [channel_id] [wallet_address]</code>\n\n` +
            `Example:\n<code>/addchannel -1001234567890 0x1234...abcd</code>\n\n` +
            `<i>Make sure the bot is an admin in the channel first!</i>`
        );
        return;
    }

    const [channelId, walletAddress] = args;

    // Validate wallet address
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        await sendMessage(chatId, `❌ Invalid wallet address format.`);
        return;
    }

    // Check if user is admin of the channel
    const isAdmin = await isChannelAdmin(channelId, userId);
    if (!isAdmin) {
        await sendMessage(
            chatId,
            `❌ You must be an admin of the channel to register it.\n\n` +
            `Also make sure the bot is an admin in the channel.`
        );
        return;
    }

    // Get channel info
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!);
    let channelInfo;
    try {
        channelInfo = await bot.getChat(channelId);
    } catch {
        await sendMessage(
            chatId,
            `❌ Could not access channel. Make sure the bot is an admin.`
        );
        return;
    }

    // Check if channel already exists
    const { data: existingChannel } = await supabaseAdmin
        .from('channels')
        .select('id')
        .eq('channel_id', channelId)
        .single();

    if (existingChannel) {
        await sendMessage(chatId, `❌ This channel is already registered.`);
        return;
    }

    // Create channel - use raw SQL insert to avoid type issues
    const { data: newChannelData, error } = await supabaseAdmin
        .from('channels')
        .insert({
            channel_id: channelId,
            channel_name: channelInfo.title || 'Unnamed Channel',
            admin_telegram_id: userId.toString(),
            wallet_address: walletAddress,
        } as never)
        .select()
        .single();

    const newChannel = newChannelData as Channel | null;

    if (error || !newChannel) {
        await sendMessage(chatId, `❌ Failed to register channel: ${error?.message}`);
        return;
    }

    await sendMessage(
        chatId,
        `✅ <b>Channel Registered!</b>\n\n` +
        `<b>${channelInfo.title}</b>\n` +
        `ID: <code>${newChannel.id}</code>\n\n` +
        `Now add subscription plans:\n` +
        `<code>/addplan ${newChannel.id} "Plan Name" [price] [days]</code>\n\n` +
        `Example for 30-day plan at 10 MNEE:\n` +
        `<code>/addplan ${newChannel.id} "30 Day Access" 10 30</code>`
    );
}

// /plans [channel_id] - View plans for a channel
async function handlePlansCommand(
    chatId: number,
    userId: number,
    args: string[]
) {
    const { data } = await supabaseAdmin
        .from('channels')
        .select('*')
        .eq('admin_telegram_id', userId.toString());

    const channels = (data || []) as Channel[];

    if (channels.length === 0) {
        await sendMessage(chatId, `You don't have any registered channels.`);
        return;
    }

    const targetChannelId = args[0] || channels[0].id;
    const channel = channels.find(
        (c) => c.id === targetChannelId || c.channel_id === targetChannelId
    );

    if (!channel) {
        await sendMessage(chatId, `Channel not found.`);
        return;
    }

    const plans = await getActivePlans(channel.id);

    if (plans.length === 0) {
        await sendMessage(
            chatId,
            `<b>${channel.channel_name}</b> has no plans yet.\n\n` +
            `Add one with:\n` +
            `<code>/addplan ${channel.id} "Plan Name" [price] [days]</code>`
        );
        return;
    }

    let response = `<b>📋 Plans for ${channel.channel_name}</b>\n\n`;

    for (const plan of plans) {
        const duration =
            plan.duration_days === null ? 'Lifetime' : `${plan.duration_days} days`;
        response += `• <b>${plan.name}</b>\n`;
        response += `  Price: ${plan.price_mnee} MNEE\n`;
        response += `  Duration: ${duration}\n`;
        response += `  ID: <code>${plan.id}</code>\n\n`;
    }

    // Add subscription link
    response += `\n<b>Share this link:</b>\n`;
    response += `<code>https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}?start=${channel.id}</code>`;

    await sendMessage(chatId, response);
}

// /addplan [channel_id] "name" [price] [days] - Add a plan
async function handleAddPlanCommand(
    chatId: number,
    userId: number,
    args: string[]
) {
    if (args.length < 3) {
        await sendMessage(
            chatId,
            `<b>Usage:</b>\n<code>/addplan [channel_id] "Plan Name" [price] [days]</code>\n\n` +
            `Examples:\n` +
            `30 days: <code>/addplan abc123 "Monthly" 10 30</code>\n` +
            `Lifetime: <code>/addplan abc123 "Lifetime" 50</code>\n\n` +
            `<i>Omit days for lifetime access.</i>`
        );
        return;
    }

    const channelId = args[0];

    // Normalize quotes (Telegram often converts to curly quotes)
    const normalizedArgs = args.map(arg =>
        arg.replace(/[""„«»]/g, '"').replace(/[''‚‹›]/g, "'")
    );

    // Parse name (handles quotes)
    let name = '';
    let priceIndex = 1;

    if (normalizedArgs[1].startsWith('"')) {
        // Find closing quote
        for (let i = 1; i < normalizedArgs.length; i++) {
            name += (i > 1 ? ' ' : '') + normalizedArgs[i];
            if (normalizedArgs[i].endsWith('"')) {
                priceIndex = i + 1;
                break;
            }
        }
        name = name.replace(/"/g, '');
    } else {
        name = normalizedArgs[1];
        priceIndex = 2;
    }

    const price = parseFloat(normalizedArgs[priceIndex]);
    const days = normalizedArgs[priceIndex + 1] ? parseInt(normalizedArgs[priceIndex + 1]) : null;

    if (isNaN(price) || price <= 0) {
        await sendMessage(chatId, `❌ Invalid price. Must be a positive number.`);
        return;
    }

    // Verify channel ownership
    const channel = await findChannelByAdmin(channelId, userId.toString());

    if (!channel) {
        await sendMessage(chatId, `❌ Channel not found or you're not the admin.`);
        return;
    }

    // Create plan
    const { data: planData, error } = await supabaseAdmin
        .from('subscription_plans')
        .insert({
            channel_id: channel.id,
            name,
            price_mnee: price,
            duration_days: days,
            is_active: true,
        } as never)
        .select()
        .single();

    const plan = planData as SubscriptionPlan | null;

    if (error || !plan) {
        await sendMessage(chatId, `❌ Failed to create plan: ${error?.message}`);
        return;
    }

    const duration = days === null ? 'Lifetime' : `${days} days`;
    await sendMessage(
        chatId,
        `✅ <b>Plan Created!</b>\n\n` +
        `<b>${name}</b>\n` +
        `Price: ${price} MNEE\n` +
        `Duration: ${duration}\n\n` +
        `Share subscription link:\n` +
        `<code>https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}?start=${channel.id}</code>`
    );
}

// /help - Show all commands
async function handleHelpCommand(chatId: number) {
    await sendMessage(
        chatId,
        `<b>📚 MNEE Gatekeeper Commands</b>\n\n` +
        `<b>For Everyone:</b>\n` +
        `/start - Welcome message\n` +
        `/help - Show this help\n\n` +
        `<b>For Channel Owners:</b>\n` +
        `/admin - View your channels\n` +
        `/addchannel [id] [wallet] - Register channel\n` +
        `/plans [channel_id] - View subscription plans\n` +
        `/addplan - Create subscription plan\n\n` +
        `<b>Setup Steps:</b>\n` +
        `1. Add bot as admin to your channel\n` +
        `2. /addchannel with channel ID and wallet\n` +
        `3. /addplan to create subscription tiers\n` +
        `4. Share the subscription link with users`
    );
}

async function handleCallbackQuery(query: TelegramUpdate['callback_query']) {
    if (!query) return;

    const { data } = query;
    const chatId = query.message.chat.id;

    // Handle various callback actions
    if (data.startsWith('select_channel_')) {
        const channelId = data.replace('select_channel_', '');
        const plans = await getActivePlans(channelId);

        if (plans.length > 0) {
            await sendMessage(
                chatId,
                `Select a subscription plan:`,
                { reply_markup: buildPlansKeyboard(plans, channelId) }
            );
        }
    }
}
