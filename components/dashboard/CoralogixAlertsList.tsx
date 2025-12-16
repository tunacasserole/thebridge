'use client';

import type { CoralogixAlert } from '@/lib/coralogix/types';
import { getSeverityColor, formatTimeAgo } from '@/lib/coralogix/utils';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';

interface CoralogixAlertsListProps {
  alerts: CoralogixAlert[];
  compact?: boolean;
}

export default function CoralogixAlertsList({ alerts, compact = false }: CoralogixAlertsListProps) {
  const getSeverityBadgeColor = (severity: CoralogixAlert['severity']) => {
    const colorMap = {
      critical: colors.error,
      error: colors.warning,
      warning: colors.warning,
      info: colors.primary,
    };
    return colorMap[severity];
  };

  const getSeverityLabel = (severity: CoralogixAlert['severity']) => {
    return severity.toUpperCase();
  };

  if (compact) {
    return (
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center gap-2 p-2 rounded bg-bridge-bg-card text-xs"
          >
            <span
              className="px-1.5 py-0.5 rounded font-bold"
              style={{
                background: `${getSeverityBadgeColor(alert.severity)}22`,
                color: getSeverityBadgeColor(alert.severity),
                fontSize: '10px',
              }}
            >
              {getSeverityLabel(alert.severity)}
            </span>
            <span className="flex-1 truncate text-bridge-text-primary">
              {alert.name}
            </span>
            <span className="text-bridge-text-muted flex items-center gap-1">
              <Icon name="schedule" size={10} decorative />
              {formatTimeAgo(alert.startsAt)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="p-3 rounded-xl transition-all duration-200 hover:shadow-md"
          style={{
            background: 'var(--md-surface-container-high)',
            border: '1px solid var(--md-outline-variant)',
          }}
        >
          <div className="flex items-start gap-3">
            {/* Severity badge */}
            <span
              className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
              style={{
                background: `${getSeverityBadgeColor(alert.severity)}22`,
                color: getSeverityBadgeColor(alert.severity),
              }}
            >
              {getSeverityLabel(alert.severity)}
            </span>

            {/* Alert details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="text-sm font-medium text-bridge-text-primary">
                  {alert.name}
                </h5>
                <div className="flex items-center gap-1 text-xs text-bridge-text-muted whitespace-nowrap">
                  <Icon name="schedule" size={12} className="w-3 h-3" decorative />
                  {formatTimeAgo(alert.startsAt)}
                </div>
              </div>

              {alert.annotations?.summary && (
                <p className="text-xs text-bridge-text-muted mb-2">
                  {alert.annotations.summary}
                </p>
              )}

              {/* Labels */}
              {alert.labels && Object.keys(alert.labels).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {Object.entries(alert.labels).slice(0, 4).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-1.5 py-0.5 rounded text-xs bg-bridge-bg-tertiary text-bridge-text-muted"
                    >
                      {key}: {value}
                    </span>
                  ))}
                  {Object.keys(alert.labels).length > 4 && (
                    <span className="px-1.5 py-0.5 text-xs text-bridge-text-muted">
                      +{Object.keys(alert.labels).length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Status badge */}
              <div className="flex items-center gap-2">
                {alert.status && (
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: alert.status === 'firing'
                        ? `${colors.error}22`
                        : alert.status === 'pending'
                        ? `${colors.warning}22`
                        : `${colors.success}22`,
                      color: alert.status === 'firing'
                        ? colors.error
                        : alert.status === 'pending'
                        ? colors.warning
                        : colors.success,
                    }}
                  >
                    {alert.status.toUpperCase()}
                  </span>
                )}

                {alert.annotations?.runbook_url && (
                  <a
                    href={alert.annotations.runbook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-bridge-accent-blue hover:underline flex items-center gap-1"
                  >
                    Runbook
                    <Icon name="open_in_new" size={12} className="w-3 h-3" decorative />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
