'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

/**
 * Lesson summary (from API list endpoint)
 */
export interface LessonSummary {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full lesson (from API detail endpoint)
 */
export interface Lesson extends LessonSummary {
  content: string;
  isPublished: boolean;
}

interface LearnContextValue {
  /** List of all available lessons */
  lessons: LessonSummary[];
  /** Currently selected lesson (full content) */
  currentLesson: Lesson | null;
  /** ID of the currently selected lesson */
  currentLessonId: string | null;
  /** Whether lessons are loading */
  isLoadingLessons: boolean;
  /** Whether current lesson content is loading */
  isLoadingContent: boolean;
  /** Error message if any */
  error: string | null;
  /** Select a lesson by ID */
  selectLesson: (id: string) => void;
  /** Clear the selected lesson */
  clearLesson: () => void;
  /** Refresh the lessons list */
  refreshLessons: () => Promise<void>;
}

const LearnContext = createContext<LearnContextValue | null>(null);

export function LearnProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lessons list
  const refreshLessons = useCallback(async () => {
    setIsLoadingLessons(true);
    setError(null);

    try {
      const response = await fetch('/api/lessons');
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const data = await response.json();
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lessons');
      console.error('[LearnContext] Error fetching lessons:', err);
    } finally {
      setIsLoadingLessons(false);
    }
  }, []);

  // Load lessons on mount
  useEffect(() => {
    refreshLessons();
  }, [refreshLessons]);

  // Fetch lesson content when selection changes
  useEffect(() => {
    if (!currentLessonId) {
      setCurrentLesson(null);
      return;
    }

    const fetchLesson = async () => {
      setIsLoadingContent(true);
      setError(null);

      try {
        const response = await fetch(`/api/lessons/${currentLessonId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch lesson');
        }
        const data = await response.json();
        setCurrentLesson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
        console.error('[LearnContext] Error fetching lesson:', err);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchLesson();
  }, [currentLessonId]);

  const selectLesson = useCallback((id: string) => {
    setCurrentLessonId(id);
  }, []);

  const clearLesson = useCallback(() => {
    setCurrentLessonId(null);
    setCurrentLesson(null);
  }, []);

  return (
    <LearnContext.Provider
      value={{
        lessons,
        currentLesson,
        currentLessonId,
        isLoadingLessons,
        isLoadingContent,
        error,
        selectLesson,
        clearLesson,
        refreshLessons,
      }}
    >
      {children}
    </LearnContext.Provider>
  );
}

export function useLearn() {
  const context = useContext(LearnContext);
  if (!context) {
    throw new Error('useLearn must be used within a LearnProvider');
  }
  return context;
}
