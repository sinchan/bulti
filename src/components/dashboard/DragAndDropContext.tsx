// DragAndDropContext.tsx
import React, { useState, useCallback, ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@/types";
import { toast } from "sonner";
import { apiService } from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import { format } from "date-fns";

interface DragAndDropContextProps {
  children: ReactNode;
  localTasks: { [key: string]: Task[] };
  setLocalTasks: React.Dispatch<
    React.SetStateAction<{ [key: string]: Task[] }>
  >;
}

export const DragAndDropContext: React.FC<DragAndDropContextProps> = ({
  children,
  localTasks,
  setLocalTasks,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [clonedLocalTasks, setClonedLocalTasks] = useState<{
    [key: string]: Task[];
  }>({});

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Find the container (date) for a given task id
  const findContainer = useCallback(
    (id: UniqueIdentifier): string | null => {
      if (!id) return null;

      // If id is a date string (container id), return it
      if (localTasks[id as string]) return id as string;

      // Remove 'task-' prefix if present
      const taskId = String(id).startsWith("task-")
        ? Number(String(id).replace("task-", ""))
        : Number(id);

      // Find which date container contains this task
      return (
        Object.keys(localTasks).find((date) =>
          localTasks[date].some((task) => task.id === taskId)
        ) || null
      );
    },
    [localTasks]
  );

  // Ensure date is in the correct format (YYYY-MM-DD)
  const formatDateString = useCallback((dateValue: string | Date): string => {
    if (typeof dateValue === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      try {
        return format(new Date(dateValue), "yyyy-MM-dd");
      } catch (error: unknown) {
        console.error("Failed to parse date string:", dateValue, error);
        return format(new Date(), "yyyy-MM-dd");
      }
    } else {
      return format(dateValue, "yyyy-MM-dd");
    }
  }, []);

  // Handle drag start event
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeId = active.id;

      // Store the current state of tasks for potential cancellation
      setClonedLocalTasks({ ...localTasks });

      // If dragging a task, find and set the active task
      if (String(activeId).startsWith("task-")) {
        const taskId = Number(String(activeId).replace("task-", ""));
        const container = findContainer(activeId);

        if (container) {
          const task = localTasks[container].find((t) => t.id === taskId);
          if (task) {
            setActiveTask(task);
          }
        }
      }
    },
    [findContainer, localTasks]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      if (activeId === overId) return; // nothing to do
      if (!String(activeId).startsWith("task-")) return;

      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);
      if (!activeContainer || !overContainer) return;

      const taskId = Number(String(activeId).replace("task-", ""));

      setLocalTasks((prev) => {
        const newState = { ...prev };
        const activeItems = [...(prev[activeContainer] || [])];
        const overItems =
          activeContainer === overContainer
            ? activeItems
            : [...(prev[overContainer] || [])];

        const activeIndex = activeItems.findIndex((t) => t.id === taskId);
        if (activeIndex === -1) return prev;

        let overIndex: number;
        if (String(overId).startsWith("task-")) {
          const overTaskId = Number(String(overId).replace("task-", ""));
          overIndex = overItems.findIndex((t) => t.id === overTaskId);
        } else {
          overIndex = overItems.length; // dropped on container
        }

        overIndex = Math.max(0, Math.min(overIndex, overItems.length));

        if (activeContainer === overContainer) {
          // reorder within same list
          const reordered = arrayMove(activeItems, activeIndex, overIndex);
          newState[activeContainer] = reordered.map((t, i) => ({
            ...t,
            order: i,
          }));
        } else {
          // move between lists
          const [moved] = activeItems.splice(activeIndex, 1);
          const updated = { ...moved, date: formatDateString(overContainer) };
          overItems.splice(overIndex, 0, updated);

          newState[activeContainer] = activeItems.map((t, i) => ({
            ...t,
            order: i,
          }));
          newState[overContainer] = overItems.map((t, i) => ({
            ...t,
            order: i,
          }));
        }
        return newState;
      });
    },
    [findContainer, formatDateString]
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // Reset drag states
      setActiveTask(null);

      if (!over) {
        // Dropped outside - revert
        console.log("Dropped outside, reverting to original state");
        setLocalTasks(clonedLocalTasks);
        return;
      }

      const activeId = active.id;
      if (!String(activeId).startsWith("task-")) return;

      try {
        // Build batch updates by comparing original state with final state
        const batchUpdates: { id: number; order: number; date?: string }[] = [];
        const processedTasks = new Set<number>();

        // Process all containers to find changes
        const allContainers = new Set([
          ...Object.keys(clonedLocalTasks),
          ...Object.keys(localTasks),
        ]);

        for (const container of allContainers) {
          const currentTasks = localTasks[container] || [];

          // Process current tasks in this container
          currentTasks.forEach((task, currentIndex) => {
            if (processedTasks.has(task.id)) return;
            processedTasks.add(task.id);

            // Find where this task was originally
            let originalContainer: string | null = null;
            let originalIndex: number = -1;

            for (const [contKey, tasks] of Object.entries(clonedLocalTasks)) {
              const idx = tasks.findIndex((t) => t.id === task.id);
              if (idx !== -1) {
                originalContainer = contKey;
                originalIndex = idx;
                break;
              }
            }

            if (!originalContainer) {
              console.warn(
                `Could not find original location for task ${task.id}`
              );
              return;
            }

            // Determine if update is needed
            const containerChanged = originalContainer !== container;
            const orderChanged =
              !containerChanged && originalIndex !== currentIndex;

            if (containerChanged) {
              // Task moved to a different date
              console.log(
                `Task ${task.id} moved from ${originalContainer}[${originalIndex}] to ${container}[${currentIndex}]`
              );
              batchUpdates.push({
                id: task.id,
                order: currentIndex,
                date: formatDateString(container),
              });
            } else if (orderChanged) {
              // Task reordered within same container
              console.log(
                `Task ${task.id} reordered in ${container} from ${originalIndex} to ${currentIndex}`
              );
              batchUpdates.push({
                id: task.id,
                order: currentIndex,
              });
            }
          });
        }

        if (batchUpdates.length === 0) {
          console.log("No changes detected");
          return;
        }

        console.log("Sending batch updates:", batchUpdates);

        // Send updates to API
        await apiService.batchUpdateTasks(batchUpdates);
        console.log("Successfully updated tasks");

        // Clear cloned state
        setClonedLocalTasks({});
      } catch (error: unknown) {
        console.error("Error updating tasks:", error);
        toast.error("Failed to save changes. Reverting...");

        // Revert to original state
        setLocalTasks(clonedLocalTasks);
        setClonedLocalTasks({});
      }
    },
    [clonedLocalTasks, localTasks, formatDateString]
  );

  // Get all task IDs for the sortable contexts
  const getTaskIds = useCallback((containerTasks: Task[]) => {
    return containerTasks.map((task) => `task-${task.id}`);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Render sortable contexts for each container */}
      {Object.keys(localTasks).map((dateKey) => (
        <SortableContext
          key={dateKey}
          items={getTaskIds(localTasks[dateKey])}
          strategy={verticalListSortingStrategy}
        >
          {/* This is where your TasksContainer components will be rendered */}
        </SortableContext>
      ))}

      {children}

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
