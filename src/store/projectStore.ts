// src/store/projectStore.ts
import { create } from "zustand";
import { createProject, fetchProjects, searchProjectByName } from "@/lib/api";
import { Project } from "@/types";

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  searchByName: (name: string) => Promise<Project | null>;

  // Selectors
  getProjectByName: (name: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await fetchProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      set({
        error:
          error instanceof Error
            ? error
            : new Error("Failed to fetch projects"),
        isLoading: false,
      });
    }
  },

  createProject: async (name: string) => {
    try {
      const newProject = await createProject(name);
      set((state) => ({
        projects: [...state.projects, newProject],
      }));
      return newProject;
    } catch (error) {
      console.error("Failed to create project:", error);
      set({
        error:
          error instanceof Error
            ? error
            : new Error("Failed to create project"),
      });
      throw error;
    }
  },

  searchByName: async (name: string) => {
    try {
      return await searchProjectByName(name);
    } catch (error) {
      console.error("Failed to search project:", error);
      return null;
    }
  },

  getProjectByName: (name: string) => {
    return get().projects.find((project) => project.name === name);
  },
}));
