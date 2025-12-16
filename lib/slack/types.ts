// Slack API Types for TheBridge

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
  is_archived: boolean;
  num_members?: number;
  topic?: {
    value: string;
  };
  purpose?: {
    value: string;
  };
}

export interface SlackMessage {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  is_bot: boolean;
  is_admin?: boolean;
  is_owner?: boolean;
  profile?: {
    display_name: string;
    real_name: string;
    email?: string;
    image_24?: string;
    image_48?: string;
    image_72?: string;
  };
}

export interface SlackWorkspaceInfo {
  team: {
    id: string;
    name: string;
    domain: string;
  };
  user: string;
  user_id: string;
  bot_id: string;
}

// API Response types
export interface SlackChannelsResponse {
  success: boolean;
  channels?: SlackChannel[];
  stats?: {
    totalChannels: number;
    publicChannels: number;
    privateChannels: number;
    archivedChannels: number;
  };
  error?: string;
}

export interface SlackMessagesResponse {
  success: boolean;
  messages?: SlackMessage[];
  channel?: string;
  error?: string;
}

export interface SlackUsersResponse {
  success: boolean;
  users?: SlackUser[];
  stats?: {
    totalUsers: number;
    activeUsers: number;
    bots: number;
    admins: number;
  };
  error?: string;
}

export interface SlackDashboardData {
  success: boolean;
  workspace?: SlackWorkspaceInfo;
  recentChannels?: SlackChannel[];
  stats?: {
    totalChannels: number;
    totalUsers: number;
    totalMessages: number;
  };
  error?: string;
}
