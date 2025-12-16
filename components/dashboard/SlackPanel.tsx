'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { useSlackData } from '@/hooks/useSlackData';
import { useSlackMessages } from '@/hooks/useSlackMessages';
import { colors } from '@/lib/colors';
import type { SlackChannel } from '@/lib/slack';
import ChatInterface from '../ChatInterface';
import { PanelSkeleton, PanelError, getErrorMessage } from './PanelStates';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface SlackPanelProps {
  compact?: boolean;
  refreshTrigger?: number;
  defaultExpanded?: boolean;
  embedded?: boolean; // When true, hides internal header (used inside DashboardPanel)
}

// Slack logo component
const SlackLogo = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 54 54"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0)">
      <path
        d="M19.712 11.52c0-3.174-2.582-5.76-5.76-5.76-3.174 0-5.76 2.586-5.76 5.76 0 3.178 2.586 5.76 5.76 5.76h5.76v-5.76zm2.88 0c0-3.174 2.586-5.76 5.76-5.76 3.178 0 5.76 2.586 5.76 5.76v14.4c0 3.178-2.582 5.76-5.76 5.76-3.174 0-5.76-2.582-5.76-5.76v-14.4z"
        fill="#E01E5A"
      />
      <path
        d="M28.352 48.48c-3.174 0-5.76-2.582-5.76-5.76 0-3.174 2.586-5.76 5.76-5.76h5.76v5.76c0 3.178-2.582 5.76-5.76 5.76zm0-17.28c-3.174 0-5.76-2.586-5.76-5.76 0-3.178 2.586-5.76 5.76-5.76h14.4c3.178 0 5.76 2.582 5.76 5.76 0 3.174-2.582 5.76-5.76 5.76h-14.4z"
        fill="#36C5F0"
      />
      <path
        d="M11.52 25.2c0 3.174-2.582 5.76-5.76 5.76C2.586 30.96 0 28.374 0 25.2c0-3.178 2.586-5.76 5.76-5.76h5.76v5.76zm2.88 0c0 3.174 2.586 5.76 5.76 5.76 3.178 0 5.76-2.586 5.76-5.76V10.8c0-3.178-2.582-5.76-5.76-5.76-3.174 0-5.76 2.582-5.76 5.76v14.4z"
        fill="#2EB67D"
      />
      <path
        d="M48.48 25.2c0-3.178 2.582-5.76 5.76-5.76 3.174 0 5.76 2.582 5.76 5.76 0 3.174-2.586 5.76-5.76 5.76h-5.76v-5.76zm-2.88 0c0-3.178-2.586-5.76-5.76-5.76-3.178 0-5.76 2.582-5.76 5.76v14.4c0 3.178 2.582 5.76 5.76 5.76 3.174 0 5.76-2.582 5.76-5.76v-14.4z"
        fill="#ECB22E"
      />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="54" height="54" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default function SlackPanel({ compact = false, refreshTrigger, defaultExpanded = false, embedded = false }: SlackPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { data, loading, error, refetch } = useSlackData(REFRESH_INTERVAL, refreshTrigger);
  const { messages, loading: messagesLoading, error: messagesError } = useSlackMessages(selectedChannel?.id || null);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  // Collapsed state - Circular avatar button
  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
        style={{
          background: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        aria-label="Expand Slack panel"
      >
        <SlackLogo size={32} />

        {/* Channel Count Badge */}
        {data?.stats && data.stats.totalChannels > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: colors.success,
              color: 'var(--md-on-success)',
              border: '2px solid white',
            }}
          >
            {data.stats.totalChannels > 99 ? '99+' : data.stats.totalChannels}
          </span>
        )}

        {/* Hover Tooltip */}
        <span
          className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: 'var(--md-surface-container-high)',
            color: 'var(--md-on-surface)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          Slack{data?.workspace && ` - ${data.workspace.team.name}`}
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl flex items-center justify-center bg-white w-12 h-12">
            <SlackLogo size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-bridge-text-primary">
              Slack
              {data?.workspace && ` - ${data.workspace.team.name}`}
            </h3>
            <p className="text-xs text-bridge-text-muted">
              {data ? `${data.stats?.totalChannels || 0} channels, ${data.stats?.totalUsers || 0} users` : 'Workspace communication'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-bridge-text-muted flex items-center gap-1">
              <Icon name="refresh" size={12} animate="animate-spin" decorative />
              Loading...
            </span>
          ) : error ? (
            <span className="text-xs text-bridge-accent-red flex items-center gap-1">
              <Icon name="warning" size={12} decorative />
              Error
            </span>
          ) : (
            <span className="text-xs text-bridge-text-muted flex items-center gap-1">
              <Icon name="check_circle" size={12} className="text-bridge-status-migrated" decorative />
              Live
            </span>
          )}

          {/* AI Chat button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowChat(!showChat);
            }}
            className={`p-2 rounded-lg transition-colors ${
              showChat
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                : 'bg-bridge-bg-card hover:bg-bridge-bg-tertiary text-bridge-text-secondary'
            }`}
            title="AI Chat"
          >
            <Icon name="smart_toy" size={16} decorative />
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-bridge-bg-card hover:bg-bridge-bg-tertiary transition-colors disabled:opacity-50"
          >
            <Icon name="refresh" size={16} className="text-bridge-text-secondary" animate={loading ? "animate-spin" : undefined} decorative />
          </button>
        </div>
      </div>

      {error && (
        <PanelError
          {...getErrorMessage(error)}
          onRetry={refetch}
          isRetrying={loading}
          className="mb-4"
        />
      )}

      {/* Chat Interface */}
      {showChat && (
        <div className="mb-4 h-96">
          <ChatInterface />
        </div>
      )}

      {data && (
        <>
          {/* Workspace Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="tag" size={16} style={{ color: colors.primary }} decorative />
                <span className="text-xs text-bridge-text-muted">Channels</span>
              </div>
              <div className="text-2xl font-bold text-bridge-text-primary">
                {data.stats?.totalChannels || 0}
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="people" size={16} style={{ color: colors.tertiary }} decorative />
                <span className="text-xs text-bridge-text-muted">Users</span>
              </div>
              <div className="text-2xl font-bold text-bridge-text-primary">
                {data.stats?.totalUsers || 0}
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--md-surface-container-high)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="link" size={16} style={{ color: colors.success }} decorative />
                <span className="text-xs text-bridge-text-muted">Team</span>
              </div>
              <div className="text-sm font-bold text-bridge-text-primary truncate">
                {data.workspace?.team.name || 'N/A'}
              </div>
            </div>
          </div>

          {/* Channel View or Messages View */}
          {selectedChannel ? (
            // Messages View
            <>
              {/* Channel Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-bridge-border-primary">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedChannel(null)}
                    className="p-1.5 rounded-lg hover:bg-bridge-bg-tertiary transition-colors"
                  >
                    <Icon name="arrow_back" size={18} className="text-bridge-text-secondary" decorative />
                  </button>
                  <Icon
                    name={selectedChannel.is_private ? 'lock' : 'tag'}
                    size={16}
                    style={{ color: selectedChannel.is_private ? colors.warning : colors.primary }}
                    decorative
                  />
                  <h4 className="text-sm font-bold text-bridge-text-primary">
                    #{selectedChannel.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1 text-xs text-bridge-text-muted">
                  <Icon name="people" size={14} decorative />
                  <span>{selectedChannel.num_members || 0}</span>
                </div>
              </div>

              {/* Messages */}
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
                  ))}
                </div>
              ) : messagesError ? (
                <div className="p-3 rounded-lg bg-bridge-accent-red/10 border border-bridge-accent-red/30">
                  <p className="text-sm text-bridge-accent-red">{messagesError}</p>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const timestamp = new Date(parseFloat(message.ts) * 1000);
                    const timeStr = timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                    return (
                      <div
                        key={message.ts}
                        className="p-3 rounded-xl"
                        style={{
                          background: 'var(--md-surface-container-high)',
                          border: '1px solid var(--md-outline-variant)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* User Avatar */}
                          {message.userInfo?.profile?.image_48 ? (
                            <img
                              src={message.userInfo.profile.image_48}
                              alt={message.userInfo.real_name || message.userInfo.name}
                              className="w-8 h-8 rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: colors.primary }}
                            >
                              <Icon name="person" size={16} color="white" decorative />
                            </div>
                          )}

                          {/* Message Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-sm text-bridge-text-primary">
                                {message.userInfo?.profile?.display_name || message.userInfo?.real_name || message.userInfo?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-bridge-text-muted">{timeStr}</span>
                            </div>
                            <p className="text-sm text-bridge-text-secondary whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                            {message.thread_ts && message.reply_count && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-bridge-accent-blue">
                                <Icon name="forum" size={14} decorative />
                                <span>{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Icon name="chat" size={40} color="var(--md-on-surface-variant)" decorative className="mx-auto mb-3" />
                  <p className="text-sm text-bridge-text-muted">No messages in this channel</p>
                </div>
              )}
            </>
          ) : (
            // Channels List View
            data.recentChannels && data.recentChannels.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-bridge-text-primary mb-3 flex items-center gap-2">
                  <Icon name="tag" size={16} style={{ color: colors.primary }} decorative />
                  Top Channels
                </h4>
                <div className="space-y-2">
                  {data.recentChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className="w-full p-3 rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer text-left"
                      style={{
                        background: 'var(--md-surface-container-high)',
                        border: '1px solid var(--md-outline-variant)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              name={channel.is_private ? 'lock' : 'tag'}
                              size={14}
                              style={{ color: channel.is_private ? colors.warning : colors.primary }}
                              decorative
                            />
                            <span className="font-semibold text-sm text-bridge-text-primary">
                              #{channel.name}
                            </span>
                            {channel.is_private && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: `${colors.warning}22`, color: colors.warning }}
                              >
                                Private
                              </span>
                            )}
                          </div>
                          {channel.topic?.value && (
                            <p className="text-xs text-bridge-text-muted truncate">
                              {channel.topic.value}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-bridge-text-muted flex-shrink-0">
                            <Icon name="people" size={14} decorative />
                            <span>{channel.num_members || 0}</span>
                          </div>
                          <Icon name="chevron_right" size={16} className="text-bridge-text-muted" decorative />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )
          )}
        </>
      )}

      {loading && !data && (
        <div className="space-y-3">
          <div className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
          <div className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--md-surface-container-high)' }} />
        </div>
      )}

      {!loading && !data && !error && (
        <div className="py-12 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--md-surface-container-highest)' }}
          >
            <Icon name="info" size={40} color="var(--md-on-surface-variant)" decorative />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--md-on-surface)' }}>
            Slack Integration Ready
          </h3>
          <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            Data will load automatically
          </p>
        </div>
      )}
    </div>
  );
}
