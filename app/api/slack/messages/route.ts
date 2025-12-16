// Slack Messages API Route - Fetch messages for a specific channel

import { NextRequest, NextResponse } from 'next/server';
import { createSlackClient } from '@/lib/slack';
import type { SlackMessagesResponse } from '@/lib/slack';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channel');

    if (!channelId) {
      return NextResponse.json({
        success: false,
        error: 'Channel ID is required',
      } as SlackMessagesResponse, { status: 400 });
    }

    // Check for bot token
    if (!process.env.SLACK_BOT_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Slack bot token not configured',
      } as SlackMessagesResponse, { status: 500 });
    }

    // Create Slack client
    const slack = createSlackClient();

    // Get channel messages
    const messages = await slack.getChannelHistory(channelId, {
      limit: 50, // Last 50 messages
    });

    // Get user info for each unique user in messages
    const userIds = Array.from(new Set(messages.map(m => m.user).filter(Boolean)));
    const userMap = new Map();

    // Fetch user info in parallel
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await slack.getUserInfo(userId);
          userMap.set(userId, user);
        } catch (error) {
          console.warn(`Failed to fetch user info for ${userId}:`, error);
        }
      })
    );

    // Enrich messages with user info
    const enrichedMessages = messages.map(message => ({
      ...message,
      userInfo: message.user ? userMap.get(message.user) : undefined,
    }));

    const response: SlackMessagesResponse = {
      success: true,
      messages: enrichedMessages,
      channel: channelId,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Slack messages API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific Slack API errors
    let userFriendlyError = `Failed to fetch messages: ${errorMessage}`;

    if (errorMessage.includes('missing_scope')) {
      userFriendlyError = `Missing Slack permissions. Your bot token needs these OAuth scopes:\n\n• channels:history - Read messages in public channels\n• channels:read - View basic channel info\n• users:read - View user info\n• groups:history - Read messages in private channels (optional)\n\nTo add scopes:\n1. Go to api.slack.com/apps\n2. Select your app\n3. Click "OAuth & Permissions"\n4. Add the scopes above\n5. Reinstall the app to your workspace`;
    } else if (errorMessage.includes('not_in_channel')) {
      userFriendlyError = `Bot is not in this channel. Please invite the bot to the channel first by typing:\n\n/invite @YourBotName`;
    } else if (errorMessage.includes('channel_not_found')) {
      userFriendlyError = `Channel not found. The channel may be archived or deleted.`;
    }

    return NextResponse.json({
      success: false,
      error: userFriendlyError,
    } as SlackMessagesResponse, { status: 500 });
  }
}
