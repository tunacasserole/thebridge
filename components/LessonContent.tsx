'use client';

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

export default function LessonContent() {
  const { currentLesson, isLoadingContent, error } = useLearn();

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
    </div>
  );
}
