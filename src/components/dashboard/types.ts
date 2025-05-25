import { Task } from "@/types";

// Shared types for dashboard components
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: {
    create?: Omit<Task, "id">[];
    update?: Task[];
    delete?: number[];
  };
}

export interface PreviewData {
  creates: Omit<Task, "id">[];
  updates: {
    original: Task;
    updated: Task;
  }[];
  deletes: Task[];
}

export interface ProjectPreviewProps {
  projectName: string;
  isNewProject: boolean;
  isNewlyAssigned?: boolean;
}
