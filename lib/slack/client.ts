// Slack API Client for TheBridge

import {
  SlackChannel,
  SlackMessage,
  SlackUser,
  SlackWorkspaceInfo,
} from './types';

const SLACK_API_BASE = 'https://slack.com/api';

export class SlackClient {
  private token: string;

  constructor(token: string) {
    if (!token) {
      throw new Error('Slack bot token is required');
    }
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const url = new URL(`${SLACK_API_BASE}/${endpoint}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Test authentication and get workspace info
   */
  async testAuth(): Promise<SlackWorkspaceInfo> {
    const data = await this.request<any>('auth.test');
    return {
      team: {
        id: data.team_id,
        name: data.team,
        domain: data.url?.replace('https://', '').replace('.slack.com/', '') || data.team_id,
      },
      user: data.user,
      user_id: data.user_id,
      bot_id: data.bot_id,
    };
  }

  /**
   * List all channels (public and private the bot has access to)
   */
  async listChannels(options: {
    excludeArchived?: boolean;
    types?: string; // 'public_channel,private_channel'
    limit?: number;
  } = {}): Promise<SlackChannel[]> {
    const params: Record<string, string | number> = {
      exclude_archived: options.excludeArchived ? 'true' : 'false',
      types: options.types || 'public_channel,private_channel',
      limit: options.limit || 200,
    };

    const data = await this.request<{ channels: SlackChannel[] }>(
      'conversations.list',
      params
    );

    return data.channels || [];
  }

  /**
   * Get channel history
   */
  async getChannelHistory(
    channelId: string,
    options: {
      limit?: number;
      oldest?: string;
      latest?: string;
    } = {}
  ): Promise<SlackMessage[]> {
    const params: Record<string, string | number> = {
      channel: channelId,
      limit: options.limit || 100,
    };

    if (options.oldest) params.oldest = options.oldest;
    if (options.latest) params.latest = options.latest;

    const data = await this.request<{ messages: SlackMessage[] }>(
      'conversations.history',
      params
    );

    return data.messages || [];
  }

  /**
   * Get channel info
   */
  async getChannelInfo(channelId: string): Promise<SlackChannel> {
    const data = await this.request<{ channel: SlackChannel }>(
      'conversations.info',
      { channel: channelId }
    );

    return data.channel;
  }

  /**
   * List all users in the workspace
   */
  async listUsers(options: {
    limit?: number;
  } = {}): Promise<SlackUser[]> {
    const params: Record<string, string | number> = {
      limit: options.limit || 200,
    };

    const data = await this.request<{ members: SlackUser[] }>(
      'users.list',
      params
    );

    return data.members || [];
  }

  /**
   * Get user info
   */
  async getUserInfo(userId: string): Promise<SlackUser> {
    const data = await this.request<{ user: SlackUser }>(
      'users.info',
      { user: userId }
    );

    return data.user;
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    options: {
      count?: number;
      sort?: 'score' | 'timestamp';
    } = {}
  ): Promise<SlackMessage[]> {
    const params: Record<string, string | number> = {
      query,
      count: options.count || 20,
      sort: options.sort || 'timestamp',
    };

    const data = await this.request<{ messages: { matches: SlackMessage[] } }>(
      'search.messages',
      params
    );

    return data.messages?.matches || [];
  }
}

/**
 * Create a Slack client instance
 */
export function createSlackClient(token?: string): SlackClient {
  const botToken = token || process.env.SLACK_BOT_TOKEN;

  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN environment variable is required');
  }

  return new SlackClient(botToken);
}
