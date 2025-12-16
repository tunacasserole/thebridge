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
  prompt?: string | null;
  isPublished: boolean;
}

/**
 * Data for creating a new lesson
 */
export interface CreateLessonData {
  name: string;
  prompt: string;
}

/**
 * Data for updating a lesson
 */
export interface UpdateLessonData {
  name?: string;
  content?: string;
  prompt?: string;
  isPublished?: boolean;
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
  /** Whether AI is generating content */
  isGenerating: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Error message if any */
  error: string | null;
  /** Select a lesson by ID */
  selectLesson: (id: string) => void;
  /** Clear the selected lesson */
  clearLesson: () => void;
  /** Refresh the lessons list */
  refreshLessons: () => Promise<void>;
  /** Create a new lesson with AI-generated content */
  createLesson: (data: CreateLessonData) => Promise<Lesson>;
  /** Update an existing lesson */
  updateLesson: (id: string, data: UpdateLessonData) => Promise<Lesson>;
  /** Delete a lesson */
  deleteLesson: (id: string) => Promise<void>;
  /** Regenerate content for an existing lesson */
  regenerateContent: (id: string, prompt: string) => Promise<string>;
}

const LearnContext = createContext<LearnContextValue | null>(null);

export function LearnProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Create a new lesson with AI-generated content
  const createLesson = useCallback(async (data: CreateLessonData): Promise<Lesson> => {
    setIsGenerating(true);
    setError(null);

    try {
      // First, generate content using AI
      const generateResponse = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, prompt: data.prompt }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate lesson content');
      }

      const { content } = await generateResponse.json();

      setIsGenerating(false);
      setIsSaving(true);

      // Then, create the lesson with the generated content
      const createResponse = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          prompt: data.prompt,
          content,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create lesson');
      }

      const lesson = await createResponse.json();

      // Refresh the lessons list
      await refreshLessons();

      // Select the newly created lesson
      setCurrentLessonId(lesson.id);
      setCurrentLesson(lesson);

      return lesson;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lesson';
      setError(errorMessage);
      console.error('[LearnContext] Error creating lesson:', err);
      throw err;
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  }, [refreshLessons]);

  // Update an existing lesson
  const updateLesson = useCallback(async (id: string, data: UpdateLessonData): Promise<Lesson> => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lesson');
      }

      const lesson = await response.json();

      // Update current lesson if it's the one being edited
      if (currentLessonId === id) {
        setCurrentLesson(lesson);
      }

      // Refresh the lessons list
      await refreshLessons();

      return lesson;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lesson';
      setError(errorMessage);
      console.error('[LearnContext] Error updating lesson:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [currentLessonId, refreshLessons]);

  // Delete a lesson
  const deleteLesson = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lesson');
      }

      // Clear selection if the deleted lesson was selected
      if (currentLessonId === id) {
        setCurrentLessonId(null);
        setCurrentLesson(null);
      }

      // Refresh the lessons list
      await refreshLessons();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lesson';
      setError(errorMessage);
      console.error('[LearnContext] Error deleting lesson:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [currentLessonId, refreshLessons]);

  // Regenerate content for an existing lesson
  const regenerateContent = useCallback(async (id: string, prompt: string): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get the lesson name
      const lessonResponse = await fetch(`/api/lessons/${id}`);
      if (!lessonResponse.ok) {
        throw new Error('Failed to fetch lesson');
      }
      const lesson = await lessonResponse.json();

      // Generate new content
      const generateResponse = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lesson.name, prompt }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const { content } = await generateResponse.json();

      // Update the lesson with new content
      await updateLesson(id, { content, prompt });

      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate content';
      setError(errorMessage);
      console.error('[LearnContext] Error regenerating content:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [updateLesson]);

  return (
    <LearnContext.Provider
      value={{
        lessons,
        currentLesson,
        currentLessonId,
        isLoadingLessons,
        isLoadingContent,
        isGenerating,
        isSaving,
        error,
        selectLesson,
        clearLesson,
        refreshLessons,
        createLesson,
        updateLesson,
        deleteLesson,
        regenerateContent,
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
