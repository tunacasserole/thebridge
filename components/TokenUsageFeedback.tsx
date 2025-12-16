'use client';

import { useState } from 'react';

interface TokenUsageBreakdown {
  inputTokens: number;
  outputTokens: number;
  total: number;
  savings?: number;
  cacheHits?: number;
}

interface TokenUsageFeedbackProps {
  usage: TokenUsageBreakdown;
  className?: string;
}

export default function TokenUsageFeedback({
  usage,
  className = '',
}: TokenUsageFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const percentInput = Math.round((usage.inputTokens / usage.total) * 100);
  const percentOutput = Math.round((usage.outputTokens / usage.total) * 100);

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      {/* Compact display */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--md-surface-container-high)] hover:bg-[var(--md-surface-container-highest)] transition-colors duration-200 text-xs"
        >
          <svg className="w-3 h-3 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-mono font-medium text-[var(--md-on-surface)]">
            {usage.total.toLocaleString()}
          </span>
          <span className="text-[var(--md-on-surface-variant)]">tokens</span>
          <svg
            className={`w-3 h-3 text-[var(--md-on-surface-variant)] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Savings badge */}
        {usage.savings && usage.savings > 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--md-success-container)] text-[var(--md-success)]">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-[10px] font-medium">-{usage.savings.toLocaleString()} saved</span>
          </div>
        ) : null}

        {/* Cache hits badge */}
        {usage.cacheHits && usage.cacheHits > 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--md-accent)]/10 text-[var(--md-accent)]">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-[10px] font-medium">{usage.cacheHits} cached</span>
          </div>
        ) : null}
      </div>

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="p-3 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] space-y-3">
          {/* Breakdown bars */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--md-on-surface)]">Token Breakdown</div>

            {/* Input tokens */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--md-on-surface-variant)]">Input</span>
                <span className="font-mono font-medium text-[var(--md-on-surface)]">
                  {usage.inputTokens.toLocaleString()} ({percentInput}%)
                </span>
              </div>
              <div className="h-1.5 bg-[var(--md-surface-container-high)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--md-accent)] rounded-full transition-all duration-500"
                  style={{ width: `${percentInput}%` }}
                />
              </div>
            </div>

            {/* Output tokens */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--md-on-surface-variant)]">Output</span>
                <span className="font-mono font-medium text-[var(--md-on-surface)]">
                  {usage.outputTokens.toLocaleString()} ({percentOutput}%)
                </span>
              </div>
              <div className="h-1.5 bg-[var(--md-surface-container-high)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--md-success)] rounded-full transition-all duration-500"
                  style={{ width: `${percentOutput}%` }}
                />
              </div>
            </div>
          </div>

          {/* Optimization tips */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--md-on-surface)]">Optimization Tips</div>
            <div className="space-y-1">
              {usage.inputTokens > usage.outputTokens ? (
                <div className="text-[10px] text-[var(--md-on-surface-variant)] flex items-start gap-1.5">
                  <span className="text-[var(--md-warning)]">⚠</span>
                  <span>Input tokens are high. Consider shorter queries or use templates.</span>
                </div>
              ) : null}

              {!usage.cacheHits || usage.cacheHits === 0 ? (
                <div className="text-[10px] text-[var(--md-on-surface-variant)] flex items-start gap-1.5">
                  <span className="text-[var(--md-accent)]">💡</span>
                  <span>Enable prompt caching to reduce token usage on repeated queries.</span>
                </div>
              ) : null}

              <div className="text-[10px] text-[var(--md-on-surface-variant)] flex items-start gap-1.5">
                <span className="text-[var(--md-accent)]">💡</span>
                <span>Use concise mode for simple queries to save ~60% tokens.</span>
              </div>
            </div>
          </div>

          {/* Estimated cost */}
          <div className="pt-2 border-t border-[var(--md-outline-variant)]">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--md-on-surface-variant)]">Estimated cost</span>
              <span className="font-mono font-medium text-[var(--md-on-surface)]">
                ${((usage.inputTokens * 0.000003 + usage.outputTokens * 0.000015).toFixed(4))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
