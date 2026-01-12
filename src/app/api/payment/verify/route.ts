import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import {
    supabaseAdmin,
    getOrCreateUser,
    createSubscription,
} from '@/lib/supabase';
import { MNEE_ABI, MNEE_CONTRACT_ADDRESS, CHAIN_ID, CHAINS } from '@/lib/constants';
import { createInviteLink, sendMessage } from '@/lib/telegram';
import type { SubscriptionPlan, Channel } from '@/types/database';

// Create viem client for on-chain verification
const chain = CHAIN_ID === CHAINS.MAINNET ? mainnet : sepolia;
const publicClient = createPublicClient({
    chain,
    transport: http(process.env.ETHEREUM_RPC_URL),
});

interface VerifyPaymentRequest {
    txHash: string;
    telegramId: string;
    planId: string;
    channelId: string;
}

interface PlanWithChannel extends SubscriptionPlan {
    channel: Channel;
}

export async function POST(request: NextRequest) {
    try {
        const body: VerifyPaymentRequest = await request.json();
        const { txHash, telegramId, planId, channelId } = body;

        // Validate required fields
        if (!txHash || !telegramId || !planId || !channelId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch plan details
        const { data: planData, error: planError } = await supabaseAdmin
            .from('subscription_plans')
            .select('*, channel:channels(*)')
            .eq('id', planId)
            .single();

        const plan = planData as PlanWithChannel | null;

        if (planError || !plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const channel = plan.channel;
        if (!channel) {
            return NextResponse.json(
                { error: 'Channel not found' },
                { status: 404 }
            );
        }

        // Verify transaction on-chain
        const receipt = await publicClient.getTransactionReceipt({
            hash: txHash as `0x${string}`,
        });

        if (!receipt || receipt.status !== 'success') {
            return NextResponse.json(
                { error: 'Transaction not found or failed' },
                { status: 400 }
            );
        }

        // Find Transfer event in logs
        let transferFound = false;
        let fromAddress = '';
        let transferAmount = BigInt(0);

        for (const log of receipt.logs) {
            try {
                // Check if this log is from the MNEE contract
                if (log.address.toLowerCase() !== MNEE_CONTRACT_ADDRESS.toLowerCase()) {
                    continue;
                }

                const decoded = decodeEventLog({
                    abi: MNEE_ABI,
                    data: log.data,
                    topics: log.topics,
                });

                if (decoded.eventName === 'Transfer') {
                    const args = decoded.args as unknown as { from: string; to: string; value: bigint };

                    // Verify recipient is the channel wallet
                    if (
                        args.to.toLowerCase() === channel.wallet_address.toLowerCase()
                    ) {
                        transferFound = true;
                        fromAddress = args.from;
                        transferAmount = args.value;
                        break;
                    }
                }
            } catch {
                // Not a Transfer event, continue
                continue;
            }
        }

        if (!transferFound) {
            return NextResponse.json(
                { error: 'No valid MNEE transfer found to channel wallet' },
                { status: 400 }
            );
        }

        // Verify amount (with some tolerance for gas)
        const expectedAmount = BigInt(Math.floor(plan.price_mnee * 10 ** 18));
        if (transferAmount < expectedAmount) {
            return NextResponse.json(
                { error: 'Insufficient payment amount' },
                { status: 400 }
            );
        }

        // Get or create user
        const user = await getOrCreateUser(telegramId, fromAddress);
        if (!user) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        // Check if transaction was already processed
        const { data: existingTx } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('tx_hash', txHash)
            .single();

        if (existingTx) {
            return NextResponse.json(
                { error: 'Transaction already processed' },
                { status: 400 }
            );
        }

        // Create subscription and transaction record
        const { subscription, expiryDate } = await createSubscription(
            user.id,
            channel.id,
            plan.id,
            txHash,
            fromAddress,
            channel.wallet_address,
            plan.price_mnee,
            plan.duration_days
        );

        // Generate invite link
        const inviteLink = await createInviteLink(
            channel.channel_id,
            `Sub ${subscription.id.slice(0, 8)}`
        );

        // Send invite link to user via Telegram
        try {
            const expiryText = expiryDate
                ? `Your subscription is valid until ${new Date(expiryDate).toLocaleDateString()}.`
                : 'You have lifetime access!';

            await sendMessage(
                telegramId,
                `🎉 <b>Payment Confirmed!</b>\n\n` +
                `You've subscribed to <b>${channel.channel_name}</b>.\n\n` +
                `${expiryText}\n\n` +
                `Click the link below to join:\n${inviteLink}\n\n` +
                `<i>This link expires in 24 hours and can only be used once.</i>`
            );
        } catch (telegramError) {
            console.error('Failed to send Telegram message:', telegramError);
            // Don't fail the whole request, user can still use the link from response
        }

        return NextResponse.json({
            success: true,
            inviteLink,
            subscriptionId: subscription.id,
            expiryDate,
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
