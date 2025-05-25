"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/projectStore";

export function useProjects() {
  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    searchByName,
    getProjectByName,
  } = useProjectStore();

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refetch = () => {
    return fetchProjects();
  };

  return {
    data: projects || [],
    isLoading,
    error,
    refetch,
    createProject,
    searchByName,
    getProjectByName,
  };
}
