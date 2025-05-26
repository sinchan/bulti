import { create } from "zustand";
import { Task } from "@/types";
import { format } from "date-fns";

// This store focuses exclusively on UI state management
// All data operations should be handled by useTaskManager hook
interface TaskState {
  // UI state
  activeTaskId: number | null;
  draggedTaskId: number | null;
  dragOverTaskId: number | null;

  // AI state
  isApplyingAI: boolean;
  aiSuggestions: AITaskSuggestion | null;

  // UI State Methods
  setActiveTask: (id: number | null) => void;
  setDraggedTask: (id: number | null) => void;
  setDragOverTask: (id: number | null) => void;

  // AI Planning related
  setIsApplyingAI: (isApplying: boolean) => void;
  setAISuggestions: (suggestions: AITaskSuggestion | null) => void;
  getTasksForAI: (tasks: Task[]) => Record<string, TaskForAI[]>;
}

export interface AITaskSuggestion {
  create?: Omit<Task, "id">[];
  update?: Task[];
  delete?: number[];
}

// Type for task objects formatted for AI processing
interface TaskForAI {
  id: number;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  completed: boolean;
  projects: string[];
}

export const useTaskStore = create<TaskState>((set) => ({
  // UI state
  activeTaskId: null,
  draggedTaskId: null,
  dragOverTaskId: null,

  // AI state
  isApplyingAI: false,
  aiSuggestions: null,

  // UI state setters
  setActiveTask: (id) => {
    console.log("taskStore: Setting active task ID:", id);
    set({ activeTaskId: id });
  },
  setDraggedTask: (id) => {
    console.log("taskStore: Setting dragged task ID:", id);
    set({ draggedTaskId: id });
  },
  setDragOverTask: (id) => {
    console.log("taskStore: Setting drag over task ID:", id);
    set({ dragOverTaskId: id });
  },

  // AI state setters
  setIsApplyingAI: (isApplying) => {
    console.log("taskStore: Setting isApplyingAI:", isApplying);
    set({ isApplyingAI: isApplying });
  },
  setAISuggestions: (suggestions) => {
    console.log(
      "taskStore: Setting AI suggestions:",
      suggestions ? "suggestions present" : "null"
    );
    set({ aiSuggestions: suggestions });
  },

  // Format tasks for AI processing
  getTasksForAI: (tasks) => {
    // Group by date
    const tasksByDate: Record<string, TaskForAI[]> = {};

    tasks.forEach((task) => {
      const date = format(new Date(task.date), "yyyy-MM-dd");
      if (!tasksByDate[date]) tasksByDate[date] = [];

      tasksByDate[date].push({
        id: task.id,
        title: task.title,
        description: task.notes || task.description || "",
        estimatedTimeMinutes: task.estimatedTime,
        completed: task.completed,
        projects: task.projects?.map((p) => p.name) || [],
      });
    });

    return tasksByDate;
  },
}));
