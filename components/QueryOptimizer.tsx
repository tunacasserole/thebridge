'use client';

import { useState, useMemo } from 'react';

interface QueryOptimization {
  type: 'verbose' | 'redundant' | 'template';
  issue: string;
  suggestion: string;
  original?: string;
  optimized?: string;
}

interface QueryOptimizerProps {
  query: string;
  onApplySuggestion?: (optimized: string) => void;
  className?: string;
}

export default function QueryOptimizer({
  query,
  onApplySuggestion,
  className = '',
}: QueryOptimizerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const optimizations = useMemo((): QueryOptimization[] => {
    const issues: QueryOptimization[] = [];
    const lowerQuery = query.toLowerCase();

    // Check for verbose phrases
    const verbosePhrases = [
      { verbose: 'can you please', concise: '' },
      { verbose: 'would you mind', concise: '' },
      { verbose: 'i would like you to', concise: '' },
      { verbose: 'could you', concise: '' },
      { verbose: 'please help me', concise: '' },
      { verbose: 'i need you to', concise: '' },
    ];

    verbosePhrases.forEach(({ verbose, concise }) => {
      if (lowerQuery.includes(verbose)) {
        issues.push({
          type: 'verbose',
          issue: `Verbose phrase: "${verbose}"`,
          suggestion: concise ? `Use "${concise}" instead` : 'Remove politeness padding',
          original: verbose,
          optimized: concise,
        });
      }
    });

    // Check for redundant words
    const redundantPatterns = [
      { pattern: /\b(very|really|actually|basically|literally)\b/gi, word: 'filler words' },
      { pattern: /\b(just|simply|merely)\b/gi, word: 'minimizers' },
    ];

    redundantPatterns.forEach(({ pattern, word }) => {
      if (pattern.test(query)) {
        issues.push({
          type: 'redundant',
          issue: `Contains ${word}`,
          suggestion: 'Remove for conciseness',
        });
      }
    });

    // Suggest templates for common queries
    if (lowerQuery.includes('show me') || lowerQuery.includes('list all')) {
      issues.push({
        type: 'template',
        issue: 'Common query pattern detected',
        suggestion: 'Use template: "List [resource] where [condition]"',
      });
    }

    if (lowerQuery.includes('what is') || lowerQuery.includes('tell me about')) {
      issues.push({
        type: 'template',
        issue: 'Information query detected',
        suggestion: 'Use template: "Explain [topic] focusing on [aspect]"',
      });
    }

    return issues;
  }, [query]);

  const estimatedSavings = useMemo(() => {
    // Rough estimate: each optimization saves ~10-20 tokens
    return optimizations.length * 15;
  }, [optimizations]);

  const optimizedQuery = useMemo(() => {
    let optimized = query;

    // Apply all optimizations
    optimizations.forEach((opt) => {
      if (opt.original && opt.optimized !== undefined) {
        const regex = new RegExp(opt.original, 'gi');
        optimized = optimized.replace(regex, opt.optimized);
      }
    });

    // Clean up extra spaces
    optimized = optimized.replace(/\s+/g, ' ').trim();

    return optimized;
  }, [query, optimizations]);

  if (optimizations.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--md-surface-container-high)] transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-[var(--md-accent)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-medium text-[var(--md-on-surface)]">
            Query Optimization Suggestions
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--md-accent)]/10 text-[var(--md-accent)] font-medium">
            {optimizations.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--md-on-surface-variant)]">
            ~{estimatedSavings} tokens saved
          </span>
          <svg className="w-4 h-4 text-[var(--md-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[var(--md-outline-variant)] p-3 space-y-3">
          {/* Optimizations list */}
          <div className="space-y-2">
            {optimizations.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs p-2 rounded-md bg-[var(--md-surface-container-high)]"
              >
                <div
                  className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                    opt.type === 'verbose'
                      ? 'bg-[var(--md-warning)]'
                      : opt.type === 'redundant'
                      ? 'bg-[var(--md-error)]'
                      : 'bg-[var(--md-accent)]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--md-on-surface)] font-medium">{opt.issue}</div>
                  <div className="text-[var(--md-on-surface-variant)] mt-0.5">{opt.suggestion}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Optimized query preview */}
          {optimizedQuery !== query && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-[var(--md-on-surface)]">Optimized Query:</div>
              <div className="p-2 rounded-md bg-[var(--md-surface-container-highest)] border border-[var(--md-accent)]/20">
                <div className="text-xs text-[var(--md-on-surface)] font-mono">{optimizedQuery}</div>
              </div>

              {onApplySuggestion && (
                <button
                  onClick={() => onApplySuggestion(optimizedQuery)}
                  className="w-full px-3 py-2 rounded-md bg-[var(--md-accent)] hover:bg-[var(--md-accent-dark)] text-[var(--md-on-accent)] text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apply Optimization
                </button>
              )}
            </div>
          )}

          {/* Token-efficient templates */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[var(--md-on-surface)]">Token-Efficient Templates:</div>
            <div className="space-y-1">
              {[
                'List [resource] where [condition]',
                'Explain [topic] in [format]',
                'Compare [A] vs [B] by [criteria]',
                'Analyze [data] for [pattern]',
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]"
                >
                  {template}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
