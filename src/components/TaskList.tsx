// TaskList.tsx
"use client";
import React, { useMemo } from "react";
import TaskCard from "./TaskCard";
import { Task } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";

interface TaskListProps {
  tasks?: Task[];
  onTaskChange: (taskId: number, changes: Partial<Task>) => void;
  onTaskDelete: (taskId: number) => void;
  onTaskEdit?: (task: Task) => void;
  id?: string;
  date?: Date;
  onAddTask?: () => void;
  isOver?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  id,
  tasks: propTasks,
  date,
  onTaskChange,
  onTaskDelete,
  onTaskEdit,
  onAddTask,
  isOver = false,
}) => {
  const { updateTask, deleteTask } = useTasks();

  // Sort tasks by order
  const sortedTasks = useMemo(() => {
    const tasks = propTasks || [];
    return [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [propTasks]);

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      onTaskDelete(taskId);
    } catch (error) {
      toast.error("Failed to delete task");
      console.error("Failed to delete task:", error);
    }
  };

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto transition-colors ${
        isOver ? "bg-primary/10 border-primary border-2 border-dashed" : ""
      }`}
      data-date={date ? format(date, "yyyy-MM-dd") : id}
    >
      <div className="p-3 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddTask}
          className="w-full flex items-center justify-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      <div className="space-y-2 flex-grow overflow-y-auto p-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <p>No tasks for this date</p>
            <p className="text-xs mt-2">
              Drag tasks here to assign them to this date
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={(updatedTask) => {
                updateTask(updatedTask);
                onTaskChange(updatedTask.id, updatedTask);
              }}
              onDelete={() => handleDelete(task.id)}
              onEdit={onTaskEdit ? () => onTaskEdit(task) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
