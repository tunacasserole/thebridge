'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLearn } from '@/contexts/LearnContext';

function LessonSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Title skeleton */}
      <div className="mb-8">
        <div className="h-10 w-2/3 rounded bg-[var(--md-surface-container-high)] mb-3" />
        <div className="h-4 w-1/3 rounded bg-[var(--md-surface-container)] " />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-full rounded bg-[var(--md-surface-container)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--md-surface-container)]" />
        <div className="h-4 w-4/5 rounded bg-[var(--md-surface-container)]" />
        <div className="h-20 w-full rounded bg-[var(--md-surface-container-high)] mt-6" />
        <div className="h-4 w-full rounded bg-[var(--md-surface-container)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--md-surface-container)]" />
      </div>
    </div>
  );
}

function WelcomeState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {/* Book illustration */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(166, 124, 82, 0.1)' }}
      >
        <svg
          className="w-12 h-12"
          style={{ color: '#a67c52' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      <h2
        className="text-2xl font-semibold mb-3"
        style={{ color: '#a67c52' }}
      >
        Welcome to Learn Mode
      </h2>

      <p className="text-[var(--md-on-surface-variant)] max-w-md mb-6">
        Select a lesson from the sidebar to start learning. Each lesson contains
        detailed information to help you master SRE concepts and tools.
      </p>

      <div className="flex items-center gap-2 text-sm text-[var(--md-on-surface-variant)] opacity-70">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Select a lesson from the sidebar</span>
      </div>
    </div>
  );
}

interface EditFormProps {
  lessonId: string;
  initialName: string;
  initialContent: string;
  initialPrompt: string | null | undefined;
  onClose: () => void;
}

function EditForm({ lessonId, initialName, initialContent, initialPrompt, onClose }: EditFormProps) {
  const { updateLesson, regenerateContent, deleteLesson, isSaving, isGenerating, error } = useLearn();
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('Lesson name is required');
      return;
    }

    try {
      await updateLesson(lessonId, {
        name: name.trim(),
        content,
        prompt: prompt || undefined,
      });
      onClose();
    } catch {
      // Error is handled by context
    }
  };

  const handleRegenerate = async () => {
    setLocalError(null);

    if (!prompt.trim()) {
      setLocalError('Please provide a prompt to regenerate content');
      return;
    }

    try {
      const newContent = await regenerateContent(lessonId, prompt.trim());
      setContent(newContent);
    } catch {
      // Error is handled by context
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLesson(lessonId);
      onClose();
    } catch {
      // Error is handled by context
    }
  };

  const isProcessing = isSaving || isGenerating;
  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--md-surface-container)] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-outline-variant)]">
          <h2 className="text-xl font-semibold text-[#a67c52]">Edit Lesson</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--md-surface-container-high)] transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-5 h-5 text-[var(--md-on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--md-on-surface)] mb-1">
              Lesson Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] focus:outline-none focus:ring-2 focus:ring-[#a67c52] focus:border-transparent"
              disabled={isProcessing}
            />
          </div>

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[var(--md-on-surface)]">
                Content Prompt
              </label>
              <button
                onClick={handleRegenerate}
                disabled={isProcessing || !prompt.trim()}
                className="text-xs font-medium px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(166, 124, 82, 0.15)',
                  color: '#a67c52',
                }}
              >
                {isGenerating ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Regenerate Content
                  </>
                )}
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to regenerate content using AI"
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] placeholder:text-[var(--md-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[#a67c52] focus:border-transparent resize-none"
              disabled={isProcessing}
            />
          </div>

          {/* Content Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--md-on-surface)] mb-1">
              Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 rounded-lg bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#a67c52] focus:border-transparent resize-none"
              disabled={isProcessing}
            />
          </div>

          {displayError && (
            <p className="text-sm text-[var(--md-error)]">{displayError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--md-outline-variant)]">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--md-error)]">Delete this lesson?</span>
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--md-error)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] hover:opacity-90 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--md-error)] hover:bg-[var(--md-error)]/10 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Lesson
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: '#a67c52' }}
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LessonContent() {
  const { currentLesson, isLoadingContent, error } = useLearn();
  const [isEditing, setIsEditing] = useState(false);

  // Loading state
  if (isLoadingContent) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-[var(--md-surface)]">
        <LessonSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--md-surface)]">
        <div className="text-center px-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <svg className="w-8 h-8 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-[var(--md-error)] mb-2">
            Failed to load lesson
          </p>
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // No lesson selected - welcome state
  if (!currentLesson) {
    return (
      <div className="flex-1 bg-[var(--md-surface)]">
        <WelcomeState />
      </div>
    );
  }

  // Lesson content
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--md-surface)]">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Lesson Header */}
        <header className="mb-8 pb-6 border-b border-[var(--md-outline-variant)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: '#a67c52' }}
              >
                {currentLesson.name}
              </h1>
              <p className="text-sm text-[var(--md-on-surface-variant)]">
                Last updated: {new Date(currentLesson.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'rgba(166, 124, 82, 0.15)',
                color: '#a67c52',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </header>

        {/* Lesson Content - Markdown */}
        <article
          className="
            prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-semibold
            prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-8
            prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
            prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
            prose-p:text-[var(--md-on-surface)] prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-[#a67c52] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[var(--md-on-surface)] prose-strong:font-semibold
            prose-em:text-[var(--md-on-surface-variant)]
            prose-code:bg-[var(--md-surface-container-high)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[var(--md-surface-container-highest)] prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
            prose-ul:my-4 prose-ul:pl-6 prose-li:text-[var(--md-on-surface)] prose-li:my-1
            prose-ol:my-4 prose-ol:pl-6
            prose-table:text-sm prose-table:border-collapse prose-table:my-4 prose-table:w-full
            prose-th:bg-[var(--md-surface-container)] prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:border prose-th:border-[var(--md-outline-variant)]
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-[var(--md-outline-variant)]
            prose-hr:my-6 prose-hr:border-[var(--md-outline-variant)]
            prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[var(--md-on-surface-variant)] prose-blockquote:my-4
            prose-img:rounded-lg prose-img:my-4
            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
          "
          style={{
            // Override link color with brown theme
            // @ts-expect-error CSS custom property
            '--tw-prose-links': '#a67c52',
          }}
        >
          <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
        </article>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditForm
          lessonId={currentLesson.id}
          initialName={currentLesson.name}
          initialContent={currentLesson.content}
          initialPrompt={currentLesson.prompt}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
