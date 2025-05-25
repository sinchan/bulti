// TaskPreview.tsx
import React from "react";
import { DragOverlay } from "@dnd-kit/core";
import TaskCard from "@/components/TaskCard";
import { Task } from "@/types";

interface TaskPreviewProps {
  activeTask: Task | null;
}

export const TaskPreview: React.FC<TaskPreviewProps> = ({ activeTask }) => {
  return (
    <DragOverlay>
      {activeTask ? <TaskCard task={activeTask} isDragOverlay={true} /> : null}
    </DragOverlay>
  );
};
