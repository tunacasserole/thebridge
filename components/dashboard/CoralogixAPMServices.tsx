'use client';

import type { CoralogixAPMService } from '@/lib/coralogix/types';
import { colors } from '@/lib/colors';
import { Icon } from '@/components/ui';
import { formatTimeAgo } from '@/lib/coralogix/utils';

interface CoralogixAPMServicesProps {
  services: CoralogixAPMService[];
}

export default function CoralogixAPMServices({ services }: CoralogixAPMServicesProps) {
  const getStatusColor = (status: CoralogixAPMService['status']) => {
    const colorMap = {
      healthy: colors.success,
      degraded: colors.warning,
      down: colors.error,
    };
    return colorMap[status];
  };

  const getStatusIcon = (status: CoralogixAPMService['status']) => {
    const iconMap = {
      healthy: <Icon name="check_circle" size={16} decorative />,
      degraded: <Icon name="warning" size={16} decorative />,
      down: <Icon name="cancel" size={16} decorative />,
    };
    return iconMap[status];
  };

  const formatLatency = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatRate = (rate: number) => {
    if (rate < 1) return `${(rate * 60).toFixed(1)}/min`;
    if (rate < 1000) return `${rate.toFixed(1)}/s`;
    return `${(rate / 1000).toFixed(2)}k/s`;
  };

  return (
    <div className="space-y-2">
      {services.map((service) => {
        const statusColor = getStatusColor(service.status);
        const errorRate = service.metrics.errorRate * 100;

        return (
          <div
            key={service.name}
            className="p-4 rounded-xl transition-all duration-200 hover:shadow-md"
            style={{
              background: 'var(--md-surface-container-high)',
              border: `1px solid ${statusColor}44`,
            }}
          >
            <div className="flex items-start gap-3">
              {/* Status icon */}
              <div style={{ color: statusColor }}>
                {getStatusIcon(service.status)}
              </div>

              {/* Service details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h5 className="text-sm font-medium text-bridge-text-primary">
                      {service.name}
                    </h5>
                    <p className="text-xs text-bridge-text-muted">
                      {service.language} • Last seen {formatTimeAgo(service.lastSeen)}
                    </p>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
                    style={{
                      background: `${statusColor}22`,
                      color: statusColor,
                    }}
                  >
                    {service.status.toUpperCase()}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {/* Request Rate */}
                  <div className="p-2 rounded bg-bridge-bg-primary">
                    <div className="text-xs text-bridge-text-muted mb-1">Requests</div>
                    <div className="text-sm font-semibold text-bridge-text-primary flex items-center gap-1">
                      {formatRate(service.metrics.requestRate)}
                      <Icon name="monitoring" size={12} style={{ color: colors.primary }} decorative />
                    </div>
                  </div>

                  {/* Error Rate */}
                  <div className="p-2 rounded bg-bridge-bg-primary">
                    <div className="text-xs text-bridge-text-muted mb-1">Errors</div>
                    <div
                      className="text-sm font-semibold flex items-center gap-1"
                      style={{
                        color: errorRate > 5 ? colors.error : errorRate > 1 ? colors.warning : colors.success,
                      }}
                    >
                      {errorRate.toFixed(2)}%
                      {errorRate > 1 ? (
                        <Icon name="trending_up" size={12} decorative />
                      ) : (
                        <Icon name="trending_down" size={12} decorative />
                      )}
                    </div>
                  </div>

                  {/* P50 Latency */}
                  <div className="p-2 rounded bg-bridge-bg-primary">
                    <div className="text-xs text-bridge-text-muted mb-1">P50</div>
                    <div className="text-sm font-semibold text-bridge-text-primary">
                      {formatLatency(service.metrics.p50Latency)}
                    </div>
                  </div>

                  {/* P95 Latency */}
                  <div className="p-2 rounded bg-bridge-bg-primary">
                    <div className="text-xs text-bridge-text-muted mb-1">P95</div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: service.metrics.p95Latency > 1000
                          ? colors.error
                          : service.metrics.p95Latency > 500
                          ? colors.warning
                          : colors.primary,
                      }}
                    >
                      {formatLatency(service.metrics.p95Latency)}
                    </div>
                  </div>

                  {/* P99 Latency */}
                  <div className="p-2 rounded bg-bridge-bg-primary">
                    <div className="text-xs text-bridge-text-muted mb-1">P99</div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: service.metrics.p99Latency > 2000
                          ? colors.error
                          : service.metrics.p99Latency > 1000
                          ? colors.warning
                          : colors.primary,
                      }}
                    >
                      {formatLatency(service.metrics.p99Latency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
