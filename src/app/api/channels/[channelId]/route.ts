import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getActivePlans } from '@/lib/supabase';
import type { Channel } from '@/types/database';

// GET /api/channels/[channelId] - Get channel and plans
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const { channelId } = await params;

        // Fetch channel by UUID
        const { data: channelData, error: channelError } = await supabaseAdmin
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .single();

        let channel = channelData as Channel | null;

        if (channelError || !channel) {
            // Try by telegram channel ID
            const { data: channelByTgId } = await supabaseAdmin
                .from('channels')
                .select('*')
                .eq('channel_id', channelId)
                .single();

            channel = channelByTgId as Channel | null;

            if (!channel) {
                return NextResponse.json(
                    { error: 'Channel not found' },
                    { status: 404 }
                );
            }
        }

        const plans = await getActivePlans(channel.id);
        return NextResponse.json({ channel, plans });
    } catch (error) {
        console.error('Error fetching channel:', error);
        return NextResponse.json(
            { error: 'Failed to fetch channel' },
            { status: 500 }
        );
    }
}
