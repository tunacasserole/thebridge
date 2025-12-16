'use client';

import type { CoralogixSLO } from '@/lib/coralogix/types';
import { getSLOStatusColor, calculateErrorBudgetPercentage, formatPercentage } from '@/lib/coralogix/utils';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';

interface CoralogixSLOCardProps {
  slo: CoralogixSLO;
}

export default function CoralogixSLOCard({ slo }: CoralogixSLOCardProps) {
  const statusColorMap = {
    healthy: colors.success,
    at_risk: colors.warning,
    breached: colors.error,
  };

  const statusColor = statusColorMap[slo.status];
  const errorBudgetPercentage = calculateErrorBudgetPercentage(slo);
  const isHealthy = slo.status === 'healthy';
  const isBreached = slo.status === 'breached';

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:shadow-md"
      style={{
        background: 'var(--md-surface-container-high)',
        border: `1px solid ${statusColor}44`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-bridge-accent-yellow mb-1">
            {slo.name}
          </h5>
          {slo.description && (
            <p className="text-xs text-bridge-text-muted">
              {slo.description}
            </p>
          )}
        </div>
        <span
          className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2"
          style={{
            background: `${statusColor}22`,
            color: statusColor,
          }}
        >
          {slo.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* SLO Target vs Current */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-2 rounded bg-bridge-bg-primary">
          <div className="text-xs text-bridge-text-muted mb-1">Target</div>
          <div className="text-lg font-bold" style={{ color: colors.primary }}>
            {formatPercentage(slo.target)}
          </div>
        </div>
        <div className="p-2 rounded bg-bridge-bg-primary">
          <div className="text-xs text-bridge-text-muted mb-1">Current</div>
          <div className="text-lg font-bold flex items-center gap-1" style={{ color: statusColor }}>
            {formatPercentage(slo.current)}
            {isHealthy ? (
              <Icon name="trending_up" size={12} className="w-3 h-3" decorative />
            ) : (
              <Icon name="trending_down" size={12} className="w-3 h-3" decorative />
            )}
          </div>
        </div>
      </div>

      {/* Error Budget */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-bridge-text-muted">Error Budget</span>
          <span className="font-semibold" style={{ color: errorBudgetPercentage > 20 ? colors.success : colors.error }}>
            {formatPercentage(errorBudgetPercentage)} remaining
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-bridge-bg-tertiary overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${errorBudgetPercentage}%`,
              background: errorBudgetPercentage > 50
                ? colors.success
                : errorBudgetPercentage > 20
                ? colors.warning
                : colors.error,
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-bridge-text-muted mt-1">
          <span>{slo.errorBudget.consumed.toFixed(2)} consumed</span>
          <span>{slo.errorBudget.remaining.toFixed(2)} remaining</span>
        </div>
      </div>

      {/* Warning for breached/at-risk */}
      {!isHealthy && (
        <div className="flex items-center gap-2 p-2 rounded text-xs" style={{ background: `${statusColor}15` }}>
          <Icon name="warning" size={12} className="w-3 h-3" decorative />
          <span style={{ color: statusColor }}>
            {isBreached ? 'SLO breached!' : 'SLO at risk'}
          </span>
        </div>
      )}

      {/* Time window */}
      <div className="text-xs text-bridge-text-muted mt-2">
        Window: {slo.timeWindow}
      </div>
    </div>
  );
}
