// Slack API Route - Server-side endpoint for Slack data

import { NextRequest, NextResponse } from 'next/server';
import { createSlackClient } from '@/lib/slack';
import type { SlackDashboardData } from '@/lib/slack';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check for bot token
    if (!process.env.SLACK_BOT_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Slack bot token not configured. Please set SLACK_BOT_TOKEN in .env.local',
      } as SlackDashboardData, { status: 500 });
    }

    // Create Slack client
    const slack = createSlackClient();

    // Get workspace info
    const workspace = await slack.testAuth();

    // Get all channels (excluding archived)
    const allChannels = await slack.listChannels({
      excludeArchived: true,
      types: 'public_channel,private_channel',
      limit: 200,
    });

    // Get recent/active channels (sorted by number of members)
    const recentChannels = allChannels
      .filter(channel => !channel.is_archived)
      .sort((a, b) => (b.num_members || 0) - (a.num_members || 0))
      .slice(0, 10);

    // Get user count (optional - can be slow for large workspaces)
    let totalUsers = 0;
    try {
      const users = await slack.listUsers({ limit: 200 });
      totalUsers = users.filter(user => !user.is_bot).length;
    } catch (error) {
      console.warn('Failed to fetch user count:', error);
    }

    // Calculate stats
    const stats = {
      totalChannels: allChannels.length,
      totalUsers,
      totalMessages: 0, // Would need to aggregate from channels
    };

    const response: SlackDashboardData = {
      success: true,
      workspace,
      recentChannels,
      stats,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Slack API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: `Failed to fetch Slack data: ${errorMessage}`,
    } as SlackDashboardData, { status: 500 });
  }
}
