import { NextRequest, NextResponse } from 'next/server';
import { getExpiredSubscriptions, expireSubscription } from '@/lib/supabase';
import { banChatMember, sendMessage } from '@/lib/telegram';

// GET /api/cron/check-expiry - Check and handle expired subscriptions
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get expired subscriptions
        const expiredSubs = await getExpiredSubscriptions();

        if (expiredSubs.length === 0) {
            return NextResponse.json({
                message: 'No expired subscriptions',
                processed: 0,
            });
        }

        const results = {
            processed: 0,
            removed: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const subscription of expiredSubs) {
            results.processed++;

            try {
                const user = subscription.user;
                const channel = subscription.channel;

                if (!user || !channel) {
                    results.errors.push(
                        `Missing user or channel data for subscription ${subscription.id}`
                    );
                    results.failed++;
                    continue;
                }

                // Remove user from channel
                const removed = await banChatMember(
                    channel.channel_id,
                    parseInt(user.telegram_id)
                );

                if (removed) {
                    results.removed++;

                    // Notify user their subscription expired
                    try {
                        await sendMessage(
                            user.telegram_id,
                            `⏰ <b>Subscription Expired</b>\n\n` +
                            `Your access to <b>${channel.channel_name}</b> has expired.\n\n` +
                            `To renew, click here:\n` +
                            `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}?start=${channel.id}`
                        );
                    } catch {
                        // User may have blocked the bot, continue anyway
                    }
                } else {
                    results.failed++;
                    results.errors.push(
                        `Failed to remove user ${user.telegram_id} from channel ${channel.channel_id}`
                    );
                }

                // Mark subscription as expired
                await expireSubscription(subscription.id);
            } catch (error) {
                results.failed++;
                results.errors.push(
                    `Error processing subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'
                    }`
                );
            }
        }

        return NextResponse.json({
            message: 'Expiry check completed',
            ...results,
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Cron job failed' },
            { status: 500 }
        );
    }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
    return GET(request);
}
