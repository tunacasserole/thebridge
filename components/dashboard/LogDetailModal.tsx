'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import { colors } from '@/lib/colors';
import { duration, easing } from '@/lib/theme/motion';

export interface LogEntry {
  id?: string;
  timestamp?: string;
  severity?: string;
  service?: string;
  message?: string;
  // Additional fields that may come from different sources
  level?: string;
  source?: string;
  host?: string;
  application?: string;
  subsystem?: string;
  category?: string;
  className?: string;
  methodName?: string;
  threadId?: string;
  traceId?: string;
  spanId?: string;
  // Raw data for display
  raw?: Record<string, unknown>;
  // Metadata from Coralogix format
  metadata?: Array<{ key: string; value: string }>;
  labels?: Record<string, string>;
  userData?: string;
}

interface LogDetailModalProps {
  log: LogEntry | null;
  onClose: () => void;
  source?: string; // 'coralogix' | 'newrelic' | 'cloudwatch' | etc.
}

export default function LogDetailModal({ log, onClose, source = 'log' }: LogDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!log) return null;

  // Get severity color
  const getSeverityColor = (severity?: string): string => {
    const level = (severity || log.level || '').toLowerCase();
    switch (level) {
      case 'critical':
      case 'fatal':
      case 'emergency':
        return colors.error;
      case 'error':
      case 'err':
        return '#ef4444';
      case 'warning':
      case 'warn':
        return colors.warning;
      case 'info':
      case 'information':
        return colors.primary;
      case 'debug':
      case 'verbose':
        return colors.secondary;
      default:
        return colors.onSurfaceVariant;
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity?: string): string => {
    const level = (severity || log.level || '').toLowerCase();
    switch (level) {
      case 'critical':
      case 'fatal':
      case 'emergency':
        return 'error';
      case 'error':
      case 'err':
        return 'warning';
      case 'warning':
      case 'warn':
        return 'report_problem';
      case 'info':
      case 'information':
        return 'info';
      case 'debug':
      case 'verbose':
        return 'bug_report';
      default:
        return 'article';
    }
  };

  // Extract all displayable fields
  const getDisplayFields = (): Array<{ key: string; value: string; isCode?: boolean }> => {
    const fields: Array<{ key: string; value: string; isCode?: boolean }> = [];

    // Add metadata fields first (Coralogix format)
    if (log.metadata) {
      log.metadata.forEach(({ key, value }) => {
        if (value && value !== 'undefined' && value !== 'null') {
          fields.push({ key, value });
        }
      });
    }

    // Add labels
    if (log.labels) {
      Object.entries(log.labels).forEach(([key, value]) => {
        if (value) {
          fields.push({ key: `label.${key}`, value });
        }
      });
    }

    // Add known fields
    const knownFields = [
      { key: 'timestamp', value: log.timestamp },
      { key: 'severity', value: log.severity || log.level },
      { key: 'service', value: log.service },
      { key: 'source', value: log.source },
      { key: 'host', value: log.host },
      { key: 'application', value: log.application },
      { key: 'subsystem', value: log.subsystem },
      { key: 'category', value: log.category },
      { key: 'className', value: log.className },
      { key: 'methodName', value: log.methodName },
      { key: 'threadId', value: log.threadId },
      { key: 'traceId', value: log.traceId, isCode: true },
      { key: 'spanId', value: log.spanId, isCode: true },
    ];

    knownFields.forEach(({ key, value, isCode }) => {
      if (value && !fields.find(f => f.key === key)) {
        fields.push({ key, value, isCode });
      }
    });

    // Add raw fields
    if (log.raw) {
      Object.entries(log.raw).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !fields.find(f => f.key === key)) {
          const strValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          fields.push({ key, value: strValue, isCode: typeof value === 'object' });
        }
      });
    }

    return fields;
  };

  const displayFields = getDisplayFields();
  const severity = log.severity || log.level || 'info';
  const severityColor = getSeverityColor(severity);
  const message = log.message || log.userData || 'No message content';

  return (
    <>
      {/* Backdrop - clicking closes the panel */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
        style={{
          animation: !isClosing ? `fadeIn ${duration.medium.expand}ms ${easing.standard}` : undefined,
        }}
      />

      {/* Bottom Slide-Up Panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl overflow-hidden shadow-2xl flex flex-col transition-transform duration-200 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          background: 'var(--md-surface-container)',
          maxHeight: '70vh',
          animation: !isClosing ? `slideUpFromBottom ${duration.medium.expand}ms ${easing.decelerate}` : undefined,
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div
            className="w-12 h-1 rounded-full cursor-pointer hover:opacity-80"
            style={{ background: 'var(--md-outline-variant)' }}
            onClick={handleClose}
          />
        </div>

        {/* Header */}
        <div
          className="px-6 py-3 flex items-center justify-between shrink-0"
          style={{
            borderBottom: '1px solid var(--md-outline-variant)',
            background: `linear-gradient(135deg, ${severityColor}15, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${severityColor}20` }}
            >
              <Icon name={getSeverityIcon(severity)} size={24} color={severityColor} decorative />
            </div>
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--md-on-surface)' }}
              >
                Log Detail
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium uppercase"
                  style={{
                    background: `${severityColor}20`,
                    color: severityColor,
                  }}
                >
                  {severity}
                </span>
                {log.service && (
                  <span
                    className="text-xs"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {log.service}
                  </span>
                )}
                {source && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: 'var(--md-surface-variant)',
                      color: 'var(--md-on-surface-variant)',
                    }}
                  >
                    {source}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            aria-label="Close panel"
          >
            <Icon name="close" size={20} color={colors.onSurfaceVariant} decorative />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Message */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Message
            </h3>
            <div
              className="p-4 rounded-lg font-mono text-sm whitespace-pre-wrap break-words"
              style={{
                background: 'var(--md-surface-container-high)',
                color: 'var(--md-on-surface)',
                borderLeft: `3px solid ${severityColor}`,
              }}
            >
              {message}
            </div>
          </div>

          {/* Timestamp */}
          {log.timestamp && (
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                Timestamp
              </h3>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--md-on-surface)' }}
              >
                <Icon name="schedule" size={16} color={colors.onSurfaceVariant} decorative />
                <span className="font-mono">{log.timestamp}</span>
              </div>
            </div>
          )}

          {/* Fields Grid */}
          {displayFields.length > 0 && (
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                Fields
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {displayFields.map(({ key, value, isCode }, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--md-surface-container-high)' }}
                  >
                    <div
                      className="text-xs font-medium mb-1"
                      style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                      {key}
                    </div>
                    <div
                      className={`text-sm break-all ${isCode ? 'font-mono text-xs' : ''}`}
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {isCode && value.length > 100 ? (
                        <pre className="whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                          {value}
                        </pre>
                      ) : (
                        value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON (if available and has content not shown above) */}
          {log.raw && Object.keys(log.raw).length > displayFields.length && (
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                Raw Data
              </h3>
              <pre
                className="p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto"
                style={{
                  background: 'var(--md-surface-container-high)',
                  color: 'var(--md-on-surface)',
                }}
              >
                {JSON.stringify(log.raw, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-3 flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid var(--md-outline-variant)' }}
        >
          <div className="flex items-center gap-2">
            {log.traceId && (
              <button
                onClick={() => navigator.clipboard.writeText(log.traceId || '')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
                style={{
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                <Icon name="content_copy" size={14} decorative />
                Copy Trace ID
              </button>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(message)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
              style={{
                background: 'var(--md-surface-variant)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              <Icon name="content_copy" size={14} decorative />
              Copy Message
            </button>
          </div>

          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{
              background: colors.primary,
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUpFromBottom {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
