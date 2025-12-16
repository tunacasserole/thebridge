'use client';

import { useState } from 'react';
import GlassTile from './GlassTile';
import { RootlyLogo, CoralogixLogo, NewRelicLogo } from '../logos';

// Integration definitions with icons
const integrations = [
  {
    id: 'jira',
    title: 'Jira',
    description: 'Project tracking',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84h-9.63z" fill="#2684FF"/>
        <path d="M6.77 6.82a4.35 4.35 0 0 0 4.34 4.34h1.8v1.72a4.35 4.35 0 0 0 4.34 4.34V7.66a.84.84 0 0 0-.83-.84H6.77z" fill="url(#jira-gradient-1)"/>
        <path d="M2 11.65c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c0 2.4 1.95 4.34 4.35 4.35v-9.57a.84.84 0 0 0-.84-.84H2z" fill="url(#jira-gradient-2)"/>
        <defs>
          <linearGradient id="jira-gradient-1" x1="12.82" y1="6.82" x2="8.44" y2="11.25">
            <stop offset="0" stopColor="#0052CC"/>
            <stop offset="1" stopColor="#2684FF"/>
          </linearGradient>
          <linearGradient id="jira-gradient-2" x1="7.85" y1="11.65" x2="3.54" y2="16.03">
            <stop offset="0" stopColor="#0052CC"/>
            <stop offset="1" stopColor="#2684FF"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    statusColor: 'success' as const,
  },
  {
    id: 'slack',
    title: 'Slack',
    description: 'Team messaging',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A"/>
        <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0"/>
        <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D"/>
        <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E"/>
        <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
      </svg>
    ),
    statusColor: 'success' as const,
  },
  {
    id: 'confluence',
    title: 'Confluence',
    description: 'Documentation',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 0 0 .255 1.04l4.965 3.054a.764.764 0 0 0 1.058-.26c.199-.332.454-.763.733-1.221 1.967-3.247 3.945-2.853 7.508-1.146l4.957 2.412a.764.764 0 0 0 1.02-.37l2.45-5.438a.764.764 0 0 0-.357-1.006c-1.468-.748-4.326-2.143-6.284-3.072-6.09-2.882-11.156-2.7-15.542 4.762z" fill="url(#confluence-gradient-1)"/>
        <path d="M23.131 5.743c.249-.405.531-.875.764-1.244a.764.764 0 0 0-.256-1.057L18.675.388a.764.764 0 0 0-1.058.26c-.199.332-.453.763-.733 1.204-1.967 3.247-3.945 2.853-7.508 1.163L4.42.603a.764.764 0 0 0-1.02.37L.95 6.412a.764.764 0 0 0 .357 1.005c1.468.749 4.326 2.143 6.284 3.056 6.09 2.898 11.156 2.716 15.541-4.73z" fill="url(#confluence-gradient-2)"/>
        <defs>
          <linearGradient id="confluence-gradient-1" x1="22.51" y1="21.43" x2="8.77" y2="14.52">
            <stop offset="0" stopColor="#0052CC"/>
            <stop offset="1" stopColor="#2684FF"/>
          </linearGradient>
          <linearGradient id="confluence-gradient-2" x1="1.49" y1="2.57" x2="15.23" y2="9.48">
            <stop offset="0" stopColor="#0052CC"/>
            <stop offset="1" stopColor="#2684FF"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    statusColor: 'warning' as const,
  },
  {
    id: 'rootly',
    title: 'Rootly',
    description: 'Incident management',
    icon: <RootlyLogo width={32} height={32} />,
    statusColor: 'success' as const,
  },
  {
    id: 'newrelic',
    title: 'New Relic',
    description: 'Observability',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-[#1CE783] flex items-center justify-center">
        <NewRelicLogo width={20} height={20} className="text-[#1D252C]" />
      </div>
    ),
    statusColor: 'success' as const,
    badge: 'New',
  },
  {
    id: 'coralogix',
    title: 'Coralogix',
    description: 'Log analytics',
    icon: <CoralogixLogo width={32} height={32} />,
    statusColor: 'success' as const,
  },
  {
    id: 'metabase',
    title: 'Metabase',
    description: 'Business intelligence',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-[#509EE3] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    ),
    badge: 'Beta',
  },
  {
    id: 'github',
    title: 'GitHub',
    description: 'Code & PRs',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-[var(--md-on-surface)]" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
  {
    id: 'pagerduty',
    title: 'PagerDuty',
    description: 'On-call & alerts',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-[#06AC38] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
          <path d="M12.006 0C5.39 0 0 5.373 0 11.991c0 4.773 2.84 8.923 6.915 10.808v-6.87c0-.503.196-.98.56-1.344L12 10.055l4.524 4.53c.364.365.561.842.561 1.344v6.87C21.16 20.913 24 16.763 24 11.99 24 5.373 18.622 0 12.006 0zM12 14.467l-2.56-2.567 2.56-2.567 2.56 2.567L12 14.467z"/>
        </svg>
      </div>
    ),
    statusColor: 'error' as const,
  },
];

interface IntegrationLauncherProps {
  /** Currently selected integration ID */
  selectedId?: string;
  /** Callback when an integration is selected */
  onSelect?: (id: string) => void;
  /** Layout mode */
  layout?: 'grid' | 'horizontal';
  /** Tile size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the animated gradient background */
  animated?: boolean;
  /** Title for the launcher */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
}

export default function IntegrationLauncher({
  selectedId,
  onSelect,
  layout = 'grid',
  size = 'md',
  animated = true,
  title = 'Integrations',
  subtitle = 'Connect your tools to supercharge your workflow',
}: IntegrationLauncherProps) {
  const [selected, setSelected] = useState<string | undefined>(selectedId);

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelect?.(id);
  };

  return (
    <div
      className={`
        min-h-screen w-full
        ${animated ? 'gradient-mesh-animated' : 'gradient-mesh'}
        flex flex-col items-center justify-center
        p-8
      `}
    >
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-4xl font-bold text-[var(--md-on-surface)] mb-3">
          {title}
        </h1>
        <p className="text-lg text-[var(--md-on-surface-variant)] max-w-md">
          {subtitle}
        </p>
      </div>

      {/* Glass container for tiles */}
      <div
        className={`
          glass-strong
          rounded-3xl
          p-8
          animate-fade-in-up
          max-w-4xl
          w-full
        `}
        style={{ animationDelay: '100ms' }}
      >
        {/* Tiles grid */}
        <div
          className={`
            ${layout === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'flex flex-wrap justify-center gap-4'
            }
          `}
        >
          {integrations.map((integration, index) => (
            <div
              key={integration.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <GlassTile
                id={integration.id}
                icon={integration.icon}
                title={integration.title}
                description={integration.description}
                selected={selected === integration.id}
                statusColor={integration.statusColor}
                badge={integration.badge}
                onClick={handleSelect}
                size={size}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Selected integration action */}
      {selected && (
        <div
          className="mt-8 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <button
            className={`
              glass
              px-8 py-4
              rounded-full
              font-semibold
              text-[var(--md-on-surface)]
              hover:bg-[var(--md-accent)]
              hover:text-white
              transition-all duration-300
              flex items-center gap-3
            `}
          >
            <span>Launch {integrations.find(i => i.id === selected)?.title}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}

      {/* Decorative floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--md-primary) 0%, transparent 70%)',
            top: '10%',
            left: '5%',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, var(--md-secondary) 0%, transparent 70%)',
            bottom: '15%',
            right: '10%',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--md-tertiary) 0%, transparent 70%)',
            top: '50%',
            right: '30%',
            filter: 'blur(50px)',
          }}
        />
      </div>
    </div>
  );
}
