'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { colors } from '@/lib/colors';
import GitHubIssueList from './GitHubIssueList';

interface CreateIssueFormData {
  body: string;
}


export default function GitHubIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ url: string; number: number } | null>(null);
  const [formData, setFormData] = useState<CreateIssueFormData>({
    body: '',
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
      setFormData({ body: '' });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.body.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: formData.body, labels: ['claude-triage'] }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create issue');
      }

      setSuccess({ url: result.data.url, number: result.data.number });
      setFormData({ body: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
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
            width: '800px',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outline}`,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            maxHeight: '600px',
          }}
        >
          {/* Left Column - Issue List */}
          <div
            style={{
              flex: 1,
              borderRight: `1px solid ${colors.outline}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.outline}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon name="list" size={20} style={{ color: colors.tertiary }} decorative />
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.onSurface,
                  margin: 0,
                }}
              >
                GitHub Issues
              </h3>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px 20px' }}>
              <GitHubIssueList isOpen={isOpen} />
            </div>
          </div>

          {/* Right Column - Create Issue Form */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.outline}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon name="account_tree" size={20} style={{ color: colors.tertiary}} decorative />
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

            {/* Form Content */}
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
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

                {/* Description - single field */}
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
                    DESCRIBE THE ISSUE *
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ body: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder="Describe the bug, feature request, or issue. We'll generate a title for you automatically."
                    disabled={isSubmitting}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '13px',
                      color: colors.onSurface,
                      background: colors.surfaceContainerHigh,
                      border: `1px solid ${colors.outline}`,
                      borderRadius: '8px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      minHeight: '180px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.tertiary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.outline;
                    }}
                  />
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.body.trim()}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#000',
                      background: `linear-gradient(135deg, ${colors.tertiary}, ${colors.tertiaryDark})`,
                      border: 'none',
                      borderRadius: '10px',
                      cursor: isSubmitting || !formData.body.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting || !formData.body.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="progress_activity" size={16} animate="animate-spin" decorative />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Icon name="add" size={16} decorative />
                        Create Issue
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
