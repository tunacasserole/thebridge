'use client';

/**
 * useDragReorder Hook
 *
 * Provides drag-and-drop reordering functionality for the multi-agent grid.
 * Uses native HTML5 drag and drop API for smooth performance.
 */

import { useState, useCallback, useRef } from 'react';

interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
}

interface UseDragReorderProps {
  onReorder: (fromIndex: number, toIndex: number) => void;
  itemCount: number;
}

interface UseDragReorderReturn {
  dragState: DragState;
  getDragHandleProps: (id: string, index: number) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
  getDropTargetProps: (index: number) => {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    'data-drop-active': boolean;
  };
}

export default function useDragReorder({
  onReorder,
  itemCount: _itemCount, // Reserved for future validation
}: UseDragReorderProps): UseDragReorderReturn {
  void _itemCount; // Suppress unused variable warning
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedIndex: null,
    dropTargetIndex: null,
  });

  // Track the drag counter for each drop zone to handle nested elements
  const dragCounters = useRef<Map<number, number>>(new Map());

  const getDragHandleProps = useCallback(
    (id: string, index: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        // Set drag data
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.setData('application/x-agent-index', index.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Create custom drag image
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        // Use the actual element as drag image with slight offset
        e.dataTransfer.setDragImage(target, rect.width / 2, 20);

        // Update drag state
        setDragState({
          isDragging: true,
          draggedId: id,
          draggedIndex: index,
          dropTargetIndex: null,
        });

        // Add dragging class for visual feedback
        target.classList.add('opacity-50', 'scale-95');
      },
      onDragEnd: (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('opacity-50', 'scale-95');

        // Reset drag state
        setDragState({
          isDragging: false,
          draggedId: null,
          draggedIndex: null,
          dropTargetIndex: null,
        });

        // Clear drag counters
        dragCounters.current.clear();
      },
    }),
    []
  );

  const getDropTargetProps = useCallback(
    (index: number) => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      },
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();

        // Increment drag counter for this index
        const currentCount = dragCounters.current.get(index) || 0;
        dragCounters.current.set(index, currentCount + 1);

        // Only update if this is not the dragged item
        if (dragState.draggedIndex !== index) {
          setDragState((prev) => ({
            ...prev,
            dropTargetIndex: index,
          }));
        }
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();

        // Decrement drag counter
        const currentCount = dragCounters.current.get(index) || 0;
        const newCount = Math.max(0, currentCount - 1);
        dragCounters.current.set(index, newCount);

        // Only clear if counter reaches 0 (truly left the element)
        if (newCount === 0 && dragState.dropTargetIndex === index) {
          setDragState((prev) => ({
            ...prev,
            dropTargetIndex: null,
          }));
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();

        const fromIndex = parseInt(
          e.dataTransfer.getData('application/x-agent-index'),
          10
        );

        // Only reorder if dropping on a different position
        if (!isNaN(fromIndex) && fromIndex !== index) {
          onReorder(fromIndex, index);
        }

        // Clear drag counters
        dragCounters.current.clear();

        // Reset drop target
        setDragState((prev) => ({
          ...prev,
          dropTargetIndex: null,
        }));
      },
      'data-drop-active': dragState.dropTargetIndex === index && dragState.draggedIndex !== index,
    }),
    [dragState.draggedIndex, dragState.dropTargetIndex, onReorder]
  );

  return {
    dragState,
    getDragHandleProps,
    getDropTargetProps,
  };
}
