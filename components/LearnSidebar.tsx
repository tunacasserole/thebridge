'use client';

import { useLearn, type LessonSummary } from '@/contexts/LearnContext';

interface LearnSidebarProps {
  mode?: 'full' | 'mini';
  onToggleMode?: () => void;
}

function LessonItem({ lesson, isSelected, onClick }: {
  lesson: LessonSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative
        hover:bg-[var(--md-surface-container-high)]
        ${isSelected
          ? 'bg-[var(--md-surface-container)]'
          : ''
        }
      `}
      style={{
        backgroundColor: isSelected ? 'rgba(166, 124, 82, 0.12)' : undefined,
        borderLeft: isSelected ? '3px solid #a67c52' : '3px solid transparent',
      }}
    >
      {/* Book Icon */}
      <div
        className={`
          flex items-center justify-center w-9 h-9 rounded-lg transition-colors
          ${isSelected
            ? 'text-[#a67c52]'
            : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] group-hover:bg-[var(--md-surface-container-high)]'
          }
        `}
        style={{
          backgroundColor: isSelected ? 'rgba(166, 124, 82, 0.15)' : undefined,
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      {/* Lesson Name */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-sm font-medium truncate
            ${isSelected
              ? 'text-[#a67c52]'
              : 'text-[var(--md-on-surface)]'
            }
          `}
        >
          {lesson.name}
        </p>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#a67c52' }}
        />
      )}
    </button>
  );
}

function LessonSkeleton() {
  return (
    <div className="w-full flex items-center gap-3 px-3 py-2.5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-[var(--md-surface-container-high)]" />
      <div className="flex-1">
        <div className="h-4 w-3/4 rounded bg-[var(--md-surface-container-high)]" />
      </div>
    </div>
  );
}

export default function LearnSidebar({ mode = 'full', onToggleMode }: LearnSidebarProps) {
  const { lessons, currentLessonId, isLoadingLessons, error, selectLesson, refreshLessons } = useLearn();
  const isMiniMode = mode === 'mini';

  return (
    <aside className={`${isMiniMode ? 'w-14' : 'w-64'} h-full flex-shrink-0 border-r border-[var(--md-outline-variant)] bg-[var(--md-surface)] flex flex-col overflow-hidden relative transition-all duration-300`}>
      <div className={`${isMiniMode ? 'p-1' : 'p-3'} flex-1 space-y-4 overflow-y-auto`}>
        {/* Lessons Header */}
        {!isMiniMode && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                Lessons
              </h2>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(166, 124, 82, 0.15)',
                  color: '#a67c52',
                }}
              >
                {lessons.length}
              </span>
            </div>
            {/* Refresh button */}
            <button
              onClick={() => refreshLessons()}
              className="p-1 rounded transition-colors hover:bg-[var(--md-surface-container-high)]"
              title="Refresh lessons"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 text-[var(--md-on-surface-variant)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}

        {/* Lessons List */}
        <div className="space-y-1">
          {isLoadingLessons ? (
            // Loading skeletons
            <>
              <LessonSkeleton />
              <LessonSkeleton />
              <LessonSkeleton />
            </>
          ) : error ? (
            // Error state
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-[var(--md-error)]">{error}</p>
              <button
                onClick={() => refreshLessons()}
                className="mt-2 text-xs text-[var(--md-primary)] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : lessons.length === 0 ? (
            // Empty state
            <div className="px-3 py-8 text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(166, 124, 82, 0.1)' }}
              >
                <svg className="w-6 h-6" style={{ color: '#a67c52' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm text-[var(--md-on-surface-variant)]">
                No lessons available
              </p>
              <p className="text-xs text-[var(--md-on-surface-variant)] opacity-70 mt-1">
                Lessons will appear here once added
              </p>
            </div>
          ) : (
            // Lessons list
            lessons.map((lesson) => (
              isMiniMode ? (
                // Mini mode: icon only
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson.id)}
                  className="w-full flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--md-surface-container)]"
                  style={{
                    backgroundColor: currentLessonId === lesson.id ? 'rgba(166, 124, 82, 0.12)' : 'transparent',
                  }}
                  title={lesson.name}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-colors [&>svg]:w-5 [&>svg]:h-5"
                    style={{
                      background: currentLessonId === lesson.id ? 'rgba(166, 124, 82, 0.15)' : 'var(--md-surface-container-high)',
                      color: currentLessonId === lesson.id ? '#a67c52' : 'var(--md-on-surface-variant)',
                      border: currentLessonId === lesson.id ? '1.5px solid rgba(166, 124, 82, 0.5)' : '1.5px solid transparent',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </button>
              ) : (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  isSelected={currentLessonId === lesson.id}
                  onClick={() => selectLesson(lesson.id)}
                />
              )
            ))
          )}
        </div>
      </div>

      {/* Footer with toggle button */}
      <div className={`flex-shrink-0 border-t border-[var(--md-outline-variant)] ${isMiniMode ? 'p-2' : 'px-3 py-2'}`}>
        <div className={`flex items-center ${isMiniMode ? 'justify-center' : 'justify-between'}`}>
          {!isMiniMode && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(166, 124, 82, 0.15)',
                color: '#a67c52',
              }}
            >
              Learn Mode
            </span>
          )}
          {/* Toggle Button */}
          <button
            onClick={onToggleMode}
            className={`
              flex items-center justify-center rounded-lg transition-colors
              hover:bg-[var(--md-surface-container-high)]
              ${isMiniMode ? 'w-full h-8' : 'w-8 h-8'}
            `}
            title={isMiniMode ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 text-[var(--md-on-surface-variant)] transition-transform duration-300 ${
                isMiniMode ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
