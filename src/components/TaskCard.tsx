// TaskCard.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckIcon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import FullscreenTaskView from "./FullscreenTaskView";

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
  onUpdate?: (task: Task) => void;
  onDelete?: (id: number) => void;
  onEdit?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task: initialTask,
  isDragOverlay = false,
  onUpdate,
  onEdit,
}) => {
  const [task, setTask] = useState<Task>(initialTask);
  const [isStarted, setIsStarted] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${initialTask.id}`,
    data: {
      type: "task",
      task: initialTask,
    },
    disabled: isDragOverlay || showFullscreen,
  });

  const handleCompleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updatedTask = { ...task, completed: !task.completed };
    try {
      if (onUpdate) {
        await onUpdate(updatedTask);
      }
      setTask(updatedTask);
      toast.success(
        `Task marked as ${updatedTask.completed ? "completed" : "incomplete"}`
      );
    } catch (error) {
      toast.error("Failed to update task completion status");
      console.error("Error updating task:", error);
    }
  };

  const handleStartPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isStarted) {
      setShowFullscreen(true);
    }
    setIsStarted(!isStarted);
  };

  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
    setIsStarted(false);
  };

  const handleCompleteFromFullscreen = async () => {
    const updatedTask = { ...task, completed: true };
    try {
      if (onUpdate) {
        await onUpdate(updatedTask);
      }
      setTask(updatedTask);
      setShowFullscreen(false);
      setIsStarted(false);
      toast.success("Task marked as completed");
    } catch (error) {
      toast.error("Failed to complete task");
      console.error("Error completing task:", error);
    }
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging || task.completed ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Don't apply drag styles to the overlay
  const cardStyle = isDragOverlay ? { opacity: 1 } : style;

  const handleCardClick = () => {
    if (!showFullscreen && onEdit) {
      onEdit();
    }
  };

  return (
    <Card
      ref={isDragOverlay ? undefined : setNodeRef}
      onClick={handleCardClick}
      style={cardStyle}
      className={`mb-5 pt-6 pb-2 ${showFullscreen ? 'cursor-default' : 'cursor-pointer'} transition-all shadow-none hover:shadow-md dark:hover:border-blue-900 ${
        isDragOverlay ? "shadow-lg rotate-3" : ""
      } ${isDragging ? "shadow-lg" : ""}`}
      {...(!isDragOverlay && !showFullscreen ? attributes : {})}
      {...(!isDragOverlay && !showFullscreen ? listeners : {})}
    >
      <CardContent className="px-4 py-0">
        {/* First row: Title only */}
        <div className="mb-2">
          <div className="text-sm font-medium">
            {task.completed ? (
              <span className="line-through opacity-70">{task.title}</span>
            ) : (
              task.title
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pt-0 flex flex-col gap-2">
        {/* Second row: Time and Action Buttons */}
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              className={`rounded-full ${
                task.completed ? "text-green-600" : "text-muted-foreground"
              }`}
              onClick={handleCompleteTask}
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`rounded-full ${
                isStarted ? "text-green-600" : "text-muted-foreground"
              }`}
              onClick={handleStartPause}
            >
              {isStarted ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
              {Math.floor(task.estimatedTime / 60)}h {task.estimatedTime % 60}m
            </div>
            <div className="flex flex-wrap gap-1">
              {task.projects?.map((p) => (
                <span key={p.id} className="text-xs text-primary">
                  #{p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardFooter>
      
      <FullscreenTaskView
        task={task}
        isVisible={showFullscreen}
        onClose={handleCloseFullscreen}
        onComplete={handleCompleteFromFullscreen}
      />
    </Card>
  );
};

export default TaskCard;
