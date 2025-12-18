'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { colors } from '@/lib/colors';
import JiraIssueList from './JiraIssueList';

interface CreateStoryFormData {
  summary: string;
  description: string;
}

export default function JiraIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ url: string; key: string } | null>(null);
  const [formData, setFormData] = useState<CreateStoryFormData>({
    summary: '',
    description: '',
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
      setFormData({ summary: '', description: '' });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      setError('Summary is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create story');
      }

      setSuccess({ url: result.data.url, key: result.data.key });
      setFormData({ summary: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        title="Jira Issues"
        className="flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: '32px',
          height: '32px',
          background: isOpen
            ? `${colors.primary}33`
            : 'var(--md-surface-container, rgba(255,255,255,0.05))',
          border: `1px solid ${isOpen ? colors.primary : 'transparent'}`,
          color: isOpen ? colors.primary : 'var(--md-on-surface-variant)',
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
        <Icon name="task" size={18} decorative />
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
              <Icon name="list" size={20} style={{ color: colors.primary }} decorative />
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.onSurface,
                  margin: 0,
                }}
              >
                Jira Issues
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  color: colors.onSurfaceVariant,
                  fontWeight: 500,
                }}
              >
                Platform Engineering
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px 20px' }}>
              <JiraIssueList isOpen={isOpen} />
            </div>
          </div>

          {/* Right Column - Create Story Form */}
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
              <Icon name="add_task" size={20} style={{ color: colors.primary }} decorative />
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.onSurface,
                    margin: 0,
                  }}
                >
                  Create Jira Story
                </h3>
                <p
                  style={{
                    fontSize: '11px',
                    color: colors.onSurfaceVariant,
                    margin: 0,
                  }}
                >
                  Add a new story to Platform Engineering
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
                    Story {success.key} Created
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
                      color: colors.primary,
                      textDecoration: 'none',
                    }}
                  >
                    View in Jira
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

                  {/* Summary */}
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
                      SUMMARY *
                    </label>
                    <input
                      type="text"
                      value={formData.summary}
                      onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Brief description of the story"
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
                        e.currentTarget.style.borderColor = colors.primary;
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
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description, acceptance criteria, etc."
                      disabled={isSubmitting}
                      rows={6}
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
                        e.currentTarget.style.borderColor = colors.primary;
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
                      disabled={isSubmitting || !formData.summary.trim()}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#fff',
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                        border: 'none',
                        borderRadius: '10px',
                        cursor: isSubmitting || !formData.summary.trim() ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting || !formData.summary.trim() ? 0.6 : 1,
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
                          Create Story
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
