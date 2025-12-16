'use client';

import { useState, useEffect } from 'react';

interface MCPServer {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  transportType: string;
  configTemplate: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    type?: string;
    url?: string;
    headers?: Record<string, string>;
  };
  docsUrl: string | null;
  isOfficial: boolean;
}

interface MCPConfigFormProps {
  server: MCPServer;
  initialConfig: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function MCPConfigForm({
  server,
  initialConfig,
  onSave,
  onCancel,
  isSaving
}: MCPConfigFormProps) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Initialize config from template and initial values
  useEffect(() => {
    const template = server.configTemplate;
    const initialValues: Record<string, string> = {};

    // Extract env variables from template
    if (template.env) {
      Object.keys(template.env).forEach(key => {
        // Check if value exists in initialConfig.env or use template default
        const envConfig = initialConfig.env as Record<string, string> | undefined;
        initialValues[key] = envConfig?.[key] || template.env![key] || '';
      });
    }

    // Extract URL if present
    if (template.url) {
      const urlConfig = initialConfig.url as string | undefined;
      initialValues['url'] = urlConfig || template.url;
    }

    // Extract headers if present
    if (template.headers) {
      Object.keys(template.headers).forEach(key => {
        const headersConfig = initialConfig.headers as Record<string, string> | undefined;
        initialValues[`header_${key}`] = headersConfig?.[key] || template.headers![key] || '';
      });
    }

    setConfig(initialValues);
  }, [server, initialConfig]);

  // Determine if a field is a secret (API key, token, password, etc.)
  const isSecretField = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('key') ||
           lowerKey.includes('token') ||
           lowerKey.includes('secret') ||
           lowerKey.includes('password');
  };

  // Get field label from key
  const getFieldLabel = (key: string): string => {
    if (key.startsWith('header_')) {
      return key.replace('header_', '').replace(/_/g, ' ');
    }
    return key.replace(/_/g, ' ');
  };

  // Handle input change
  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Toggle secret visibility
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required env vars
    if (server.configTemplate.env) {
      Object.keys(server.configTemplate.env).forEach(key => {
        if (!config[key] || config[key].trim() === '') {
          newErrors[key] = 'This field is required';
        }
      });
    }

    // Check URL if required
    if (server.configTemplate.url && (!config['url'] || config['url'].trim() === '')) {
      newErrors['url'] = 'URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Build config object
      const configData: Record<string, unknown> = {};

      // Add env variables
      if (server.configTemplate.env) {
        const env: Record<string, string> = {};
        Object.keys(server.configTemplate.env).forEach(key => {
          if (config[key]) {
            env[key] = config[key];
          }
        });
        configData.env = env;
      }

      // Add URL
      if (server.configTemplate.url && config['url']) {
        configData.url = config['url'];
      }

      // Add headers
      if (server.configTemplate.headers) {
        const headers: Record<string, string> = {};
        Object.keys(server.configTemplate.headers).forEach(key => {
          const headerKey = `header_${key}`;
          if (config[headerKey]) {
            headers[key] = config[headerKey];
          }
        });
        configData.headers = headers;
      }

      await onSave(configData);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // Get all config fields
  const getAllFields = (): string[] => {
    const fields: string[] = [];

    // Add env vars
    if (server.configTemplate.env) {
      fields.push(...Object.keys(server.configTemplate.env));
    }

    // Add URL
    if (server.configTemplate.url) {
      fields.push('url');
    }

    // Add headers
    if (server.configTemplate.headers) {
      fields.push(...Object.keys(server.configTemplate.headers).map(k => `header_${k}`));
    }

    return fields;
  };

  const fields = getAllFields();

  if (fields.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--md-on-surface-variant)]">
          No configuration required for this server
        </p>
        <button
          onClick={onCancel}
          className="mt-3 px-4 py-2 text-sm rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)] transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {fields.map(key => {
          const isSecret = isSecretField(key);
          const fieldValue = config[key] || '';
          const showSecret = showSecrets[key];

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-[var(--md-on-surface)] mb-1 capitalize">
                {getFieldLabel(key)}
              </label>
              <div className="relative">
                <input
                  type={isSecret && !showSecret ? 'password' : 'text'}
                  value={fieldValue}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`
                    w-full px-3 py-2 rounded-lg
                    bg-[var(--md-surface-container-highest)] text-[var(--md-on-surface)]
                    border ${errors[key] ? 'border-[var(--md-error)]' : 'border-[var(--md-outline-variant)]'}
                    focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSecret ? 'pr-10' : ''}
                  `}
                  placeholder={`Enter ${getFieldLabel(key)}`}
                  disabled={isSaving}
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility(key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--md-surface-container)] transition-colors"
                    title={showSecret ? 'Hide' : 'Show'}
                  >
                    {showSecret ? (
                      <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              {errors[key] && (
                <p className="mt-1 text-xs text-[var(--md-error)]">{errors[key]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      {server.docsUrl && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1 text-sm">
            <p>Need help? Check the{' '}
              <a
                href={server.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                documentation
              </a>
              {' '}for setup instructions.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>
    </form>
  );
}
