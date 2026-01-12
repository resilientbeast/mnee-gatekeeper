import TelegramBot from 'node-telegram-bot-api';

// Initialize bot instance (lazy loaded)
let bot: TelegramBot | null = null;

export function getBot(): TelegramBot {
    if (!bot) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error('TELEGRAM_BOT_TOKEN is not set');
        }
        bot = new TelegramBot(token);
    }
    return bot;
}

// Send a message to a user
export async function sendMessage(
    chatId: number | string,
    text: string,
    options?: TelegramBot.SendMessageOptions
) {
    const telegramBot = getBot();
    return telegramBot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...options,
    });
}

// Create a single-use invite link for a private channel
export async function createInviteLink(
    channelId: number | string,
    name?: string
): Promise<string> {
    const telegramBot = getBot();
    const inviteLink = await telegramBot.createChatInviteLink(channelId, {
        member_limit: 1, // Single use
        name: name || `Subscription ${new Date().toISOString()}`,
        expire_date: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h expiry
    });
    return inviteLink.invite_link;
}

// Ban/remove a user from channel (for expired subscriptions)
export async function banChatMember(
    channelId: number | string,
    userId: number
): Promise<boolean> {
    const telegramBot = getBot();
    try {
        // Ban then immediately unban to remove without permanent ban
        await telegramBot.banChatMember(channelId, userId);
        await telegramBot.unbanChatMember(channelId, userId);
        return true;
    } catch (error) {
        console.error('Failed to remove user from channel:', error);
        return false;
    }
}

// Check if user is admin of a channel
export async function isChannelAdmin(
    channelId: number | string,
    userId: number
): Promise<boolean> {
    const telegramBot = getBot();
    try {
        const member = await telegramBot.getChatMember(channelId, userId);
        return ['creator', 'administrator'].includes(member.status);
    } catch {
        return false;
    }
}

// Get channel info
export async function getChannelInfo(channelId: number | string) {
    const telegramBot = getBot();
    try {
        return await telegramBot.getChat(channelId);
    } catch {
        return null;
    }
}

// Build inline keyboard for subscription plans
export function buildPlansKeyboard(
    plans: Array<{ id: string; name: string; price_mnee: number }>,
    channelId: string
): TelegramBot.InlineKeyboardMarkup {
    return {
        inline_keyboard: plans.map((plan) => [
            {
                text: `${plan.name} - ${plan.price_mnee} MNEE`,
                web_app: {
                    url: `${process.env.NEXT_PUBLIC_APP_URL}?channelId=${channelId}&planId=${plan.id}`,
                },
            },
        ]),
    };
}

// Build welcome message with mini app button
export function buildWelcomeMessage(channelName: string, channelId: string) {
    const text = `🔐 <b>Welcome to ${channelName} Subscription</b>\n\nClick the button below to subscribe using MNEE tokens.`;

    const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
            [
                {
                    text: '💳 Subscribe Now',
                    web_app: {
                        url: `${process.env.NEXT_PUBLIC_APP_URL}?channelId=${channelId}`,
                    },
                },
            ],
        ],
    };

    return { text, keyboard };
}
