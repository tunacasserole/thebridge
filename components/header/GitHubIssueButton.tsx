'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { colors } from '@/lib/colors';

interface CreateIssueFormData {
  title: string;
  body: string;
  labels: string[];
}

const AVAILABLE_LABELS = [
  { value: 'bug', label: 'Bug', color: '#d73a4a' },
  { value: 'enhancement', label: 'Enhancement', color: '#a2eeef' },
  { value: 'documentation', label: 'Documentation', color: '#0075ca' },
  { value: 'question', label: 'Question', color: '#d876e3' },
  { value: 'help wanted', label: 'Help Wanted', color: '#008672' },
];

export default function GitHubIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ url: string; number: number } | null>(null);
  const [formData, setFormData] = useState<CreateIssueFormData>({
    title: '',
    body: '',
    labels: [],
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', body: '', labels: [] });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create issue');
      }

      setSuccess({ url: result.data.url, number: result.data.number });
      setFormData({ title: '', body: '', labels: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label],
    }));
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        title="Create GitHub Issue"
        className="flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: '32px',
          height: '32px',
          background: isOpen
            ? `${colors.tertiary}33`
            : 'var(--md-surface-container, rgba(255,255,255,0.05))',
          border: `1px solid ${isOpen ? colors.tertiary : 'transparent'}`,
          color: isOpen ? colors.tertiary : 'var(--md-on-surface-variant)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--md-surface-container-high)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--md-surface-container, rgba(255,255,255,0.05))';
          }
        }}
      >
        <Icon name="bug_report" size={18} decorative />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outline}`,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.outline}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Icon name="account_tree" size={20} style={{ color: colors.tertiary }} decorative />
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.onSurface,
                  margin: 0,
                }}
              >
                Create GitHub Issue
              </h3>
              <p
                style={{
                  fontSize: '11px',
                  color: colors.onSurfaceVariant,
                  margin: 0,
                }}
              >
                Report a bug or request a feature
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: colors.onSurfaceVariant,
                borderRadius: '8px',
              }}
            >
              <Icon name="close" size={18} decorative />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 20px' }}>
            {success ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `${colors.success}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Icon name="check_circle" size={28} style={{ color: colors.success }} decorative />
                </div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: colors.onSurface,
                    margin: '0 0 8px',
                  }}
                >
                  Issue #{success.number} Created
                </h4>
                <a
                  href={success.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: colors.tertiary,
                    textDecoration: 'none',
                  }}
                >
                  View on GitHub
                  <Icon name="open_in_new" size={14} decorative />
                </a>
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setSuccess(null)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.onSurface,
                      background: colors.surfaceContainerHigh,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div
                    style={{
                      padding: '10px 12px',
                      marginBottom: '12px',
                      background: `${colors.error}15`,
                      border: `1px solid ${colors.error}44`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: colors.error,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Icon name="error" size={16} decorative />
                    {error}
                  </div>
                )}

                {/* Title */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: colors.onSurfaceVariant,
                      marginBottom: '6px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    TITLE *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: colors.onSurface,
                      background: colors.surfaceContainerHigh,
                      border: `1px solid ${colors.outline}`,
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.tertiary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.outline;
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: colors.onSurfaceVariant,
                      marginBottom: '6px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Detailed description, steps to reproduce, etc."
                    disabled={isSubmitting}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: colors.onSurface,
                      background: colors.surfaceContainerHigh,
                      border: `1px solid ${colors.outline}`,
                      borderRadius: '8px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.tertiary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.outline;
                    }}
                  />
                </div>

                {/* Labels */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: colors.onSurfaceVariant,
                      marginBottom: '8px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    LABELS
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {AVAILABLE_LABELS.map((label) => {
                      const isSelected = formData.labels.includes(label.value);
                      return (
                        <button
                          key={label.value}
                          type="button"
                          onClick={() => toggleLabel(label.value)}
                          disabled={isSubmitting}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: isSelected ? '#fff' : label.color,
                            background: isSelected ? label.color : `${label.color}22`,
                            border: `1px solid ${label.color}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {label.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#000',
                    background: `linear-gradient(135deg, ${colors.tertiary}, ${colors.tertiaryDark})`,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isSubmitting || !formData.title.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !formData.title.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="progress_activity" size={18} animate="animate-spin" decorative />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Icon name="add" size={18} decorative />
                      Create Issue
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
