// TasksContainer.tsx

import { Task } from "@/types";
import TaskList from "@/components/TaskList";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

interface TasksContainerProps {
  localTasks: Task[];
  containerId: string;
  currentDate: Date;
  onTaskChange: (taskId: number, changes: Partial<Task>) => void;
  onTaskDelete: (taskId: number) => void;
  onTaskEdit: (task: Task) => void;
  onAddTask: () => void;
  onCreateTask?: (task: Omit<Task, "id">) => Promise<void>;
}

export function TasksContainer({
  localTasks,
  containerId,
  currentDate,
  onTaskChange,
  onTaskDelete,
  onTaskEdit,
  onAddTask,
  onCreateTask,
}: TasksContainerProps) {
  // Transform tasks to have prefixed IDs for sortable context
  const sortableTaskIds = localTasks.map((task) => `task-${task.id}`);

  // Make this container droppable for cross-container drops
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: {
      type: "container",
      date: currentDate,
    },
  });

  return (
    <div ref={setNodeRef} className="h-full">
      <SortableContext
        items={sortableTaskIds}
        strategy={verticalListSortingStrategy}
      >
        <TaskList
          tasks={localTasks}
          id={containerId}
          onTaskChange={onTaskChange}
          onTaskDelete={onTaskDelete}
          onTaskEdit={onTaskEdit}
          date={currentDate}
          onAddTask={onAddTask}
          onCreateTask={onCreateTask}
          isOver={isOver}
        />
      </SortableContext>
    </div>
  );
}
