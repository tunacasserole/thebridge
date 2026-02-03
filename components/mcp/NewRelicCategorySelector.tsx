'use client';

import { useMemo } from 'react';

/**
 * New Relic tool categories - mapped to specific New Relic tools
 * These categories help filter which New Relic tools are loaded
 */
export const NEW_RELIC_CATEGORIES = [
  {
    id: 'errors',
    name: 'Errors & Issues',
    description: 'Transaction errors, error groups, error tracking',
    icon: 'error',
    tools: ['list_entity_error_groups', 'execute_nrql_query'], // TransactionError, ErrorTrace queries
  },
  {
    id: 'incidents',
    name: 'Incidents & Alerts',
    description: 'Active incidents, alert conditions, notifications',
    icon: 'notifications_active',
    tools: ['list_recent_issues', 'list_change_events', 'list_alert_policies'],
  },
  {
    id: 'apm',
    name: 'APM & Performance',
    description: 'Application performance, response times, throughput',
    icon: 'speed',
    tools: ['list_apm_app_details', 'natural_language_to_nrql_query', 'execute_nrql_query'],
  },
  {
    id: 'entities',
    name: 'Entities & Services',
    description: 'Applications, hosts, services, infrastructure',
    icon: 'hub',
    tools: ['list_available_new_relic_accounts', 'list_entities', 'get_entity_golden_signals'],
  },
  {
    id: 'logs',
    name: 'Logs',
    description: 'Log queries, log patterns, log analysis',
    icon: 'article',
    tools: ['execute_nrql_query', 'natural_language_to_nrql_query'],
  },
  {
    id: 'nrql',
    name: 'Custom NRQL',
    description: 'Execute custom NRQL queries for any data type',
    icon: 'code',
    tools: ['execute_nrql_query', 'natural_language_to_nrql_query'],
  },
] as const;

export type NewRelicCategoryId = typeof NEW_RELIC_CATEGORIES[number]['id'];

interface NewRelicCategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  disabled?: boolean;
}

export default function NewRelicCategorySelector({
  selectedCategories,
  onChange,
  disabled = false,
}: NewRelicCategorySelectorProps) {
  // Use a derived state pattern instead of syncing with useEffect
  const categories = useMemo(() => new Set(selectedCategories), [selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    const newCategories = new Set(categories);
    if (newCategories.has(categoryId)) {
      newCategories.delete(categoryId);
    } else {
      newCategories.add(categoryId);
    }
    onChange(Array.from(newCategories));
  };

  const selectAll = () => {
    const allIds = NEW_RELIC_CATEGORIES.map(c => c.id);
    onChange(allIds);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--md-on-surface)]">
          Tool Categories
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-[var(--md-primary)] hover:underline disabled:opacity-50"
          >
            Select All
          </button>
          <span className="text-[var(--md-outline)]">|</span>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-[var(--md-primary)] hover:underline disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--md-on-surface-variant)]">
        Select which types of New Relic tools you want to use. This helps focus results and reduces noise.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {NEW_RELIC_CATEGORIES.map((category) => {
          const isSelected = categories.has(category.id);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              disabled={disabled}
              className={`
                flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                ${isSelected
                  ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)]'
                  : 'border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] hover:bg-[var(--md-surface-container)]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Checkbox indicator */}
              <div className={`
                mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center
                ${isSelected
                  ? 'bg-[var(--md-primary)]'
                  : 'border-2 border-[var(--md-outline)]'
                }
              `}>
                {isSelected && (
                  <svg className="w-3 h-3 text-[var(--md-on-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Category info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-[var(--md-on-primary-container)]' : 'text-[var(--md-on-surface-variant)]'}`}>
                    {category.icon}
                  </span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-[var(--md-on-primary-container)]' : 'text-[var(--md-on-surface)]'}`}>
                    {category.name}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isSelected ? 'text-[var(--md-on-primary-container)]' : 'text-[var(--md-on-surface-variant)]'}`}>
                  {category.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {categories.size === 0 && (
        <p className="text-xs text-[var(--md-error)] flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">warning</span>
          Select at least one category to use New Relic tools
        </p>
      )}
    </div>
  );
}

/**
 * Get the list of New Relic tool name patterns that should be loaded
 * based on selected categories
 */
export function getToolPatternsForCategories(categoryIds: string[]): string[] {
  const tools = new Set<string>();

  for (const categoryId of categoryIds) {
    const category = NEW_RELIC_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      category.tools.forEach(tool => tools.add(tool));
    }
  }

  return Array.from(tools);
}
