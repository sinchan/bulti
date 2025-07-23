// QuickAddTask.tsx
"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Task } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { format } from "date-fns";

interface QuickAddTaskProps {
  date: Date;
  onSave: (task: Omit<Task, "id">) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
  existingTasks?: Task[];
}

export default function QuickAddTask({
  date,
  onSave,
  onCancel,
  isVisible,
  existingTasks = [],
}: QuickAddTaskProps) {
  const [title, setTitle] = useState("");
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: projects = [] } = useProjects();

  // Ensure "Personal" is the default project, or use the first available project
  const personalProject = projects.find(p => p.name === "Personal");
  const otherProjects = projects.filter(p => p.name !== "Personal");
  
  const availableProjects = personalProject 
    ? [personalProject, ...otherProjects]
    : projects.length > 0 
    ? projects 
    : [{ id: 1, name: "Personal" }]; // Fallback if no projects exist

  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVisible]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      setSelectedProjectIndex((prev) => 
        (prev + 1) % availableProjects.length
      );
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selectedProject = availableProjects[selectedProjectIndex];
      
      // Calculate order to place at the top (lowest order value)
      const minOrder = existingTasks.length > 0 
        ? Math.min(...existingTasks.map(task => task.order || 0))
        : 0;
      const newOrder = minOrder <= 0 ? minOrder - 1 : -1;
      
      const newTask: Omit<Task, "id"> = {
        title: title.trim(),
        description: "",
        notes: "",
        date: format(date, "yyyy-MM-dd"),
        completed: false,
        estimatedTime: 30, // Default 30 minutes
        order: newOrder,
        userId: "", // Will be set by the API
        projects: selectedProject ? [{ id: selectedProject.id || 0, name: selectedProject.name }] : [],
      };

      await onSave(newTask);
      setTitle("");
      setSelectedProjectIndex(0);
      onCancel();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mx-3 mb-3">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border shadow-sm">
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter task title..."
          className="w-full resize-none border-none outline-none bg-transparent text-sm placeholder:text-muted-foreground"
          rows={2}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border overflow-x-auto">
          {availableProjects.map((project, index) => (
            <span
              key={project.id || project.name}
              className={`text-xs px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
                index === selectedProjectIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => setSelectedProjectIndex(index)}
            >
              #{project.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}