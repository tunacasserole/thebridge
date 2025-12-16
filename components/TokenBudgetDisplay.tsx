'use client';

import { useMemo } from 'react';

interface TokenBudgetDisplayProps {
  tokensUsed: number;
  tokenLimit: number;
  className?: string;
}

export default function TokenBudgetDisplay({
  tokensUsed,
  tokenLimit,
  className = '',
}: TokenBudgetDisplayProps) {
  const percentUsed = useMemo(() => {
    return (tokensUsed / tokenLimit) * 100;
  }, [tokensUsed, tokenLimit]);

  const status = useMemo(() => {
    if (percentUsed >= 90) return 'critical';
    if (percentUsed >= 75) return 'warning';
    if (percentUsed >= 50) return 'caution';
    return 'good';
  }, [percentUsed]);

  const statusConfig = {
    good: {
      color: 'var(--md-success)',
      bgColor: 'var(--md-success-container)',
      label: 'Good',
      icon: '✓',
    },
    caution: {
      color: 'var(--md-warning)',
      bgColor: 'var(--md-warning-container)',
      label: 'Moderate',
      icon: '⚠',
    },
    warning: {
      color: 'var(--md-error)',
      bgColor: 'var(--md-error-container)',
      label: 'High',
      icon: '⚠',
    },
    critical: {
      color: 'var(--md-error)',
      bgColor: 'var(--md-error-container)',
      label: 'Critical',
      icon: '🚨',
    },
  };

  const config = statusConfig[status];
  const remaining = tokenLimit - tokensUsed;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Compact display */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--md-on-surface-variant)]">Tokens:</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono font-medium text-[var(--md-on-surface)]">
            {tokensUsed.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--md-on-surface-variant)]">/</span>
          <span className="text-xs font-mono text-[var(--md-on-surface-variant)]">
            {tokenLimit.toLocaleString()}
          </span>
        </div>

        {/* Visual indicator */}
        <div className="relative w-16 h-2 bg-[var(--md-surface-container-high)] rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(percentUsed, 100)}%`,
              backgroundColor: config.color,
            }}
          />
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: config.bgColor,
            color: config.color,
          }}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
      </div>

      {/* Low budget warning */}
      {status === 'warning' || status === 'critical' ? (
        <div
          className="text-xs px-2 py-1 rounded-md border"
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.color,
            color: config.color,
          }}
        >
          {status === 'critical'
            ? `Only ${remaining.toLocaleString()} tokens remaining`
            : `${remaining.toLocaleString()} tokens remaining`}
        </div>
      ) : null}
    </div>
  );
}
