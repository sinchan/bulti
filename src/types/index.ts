// types/index.ts

export interface User {
  id: string;
  firebaseId?: string | null;
  email: string;
  name?: string;
  tasks?: Task[];
}

export interface Task {
  id: number;
  title: string;
  date: Date | string;
  description?: string;
  order: number;
  estimatedTime: number;
  notes?: string | null;
  completed: boolean;
  userId: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    firebaseId?: string;
  };
  projects?: {
    id: number;
    name: string;
  }[];
}

export interface Project {
  id?: number;
  name: string;
  tasks?: Task[];
}

export const ItemTypes = {
  TASK: "task",
};
