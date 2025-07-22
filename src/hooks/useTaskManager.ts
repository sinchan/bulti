// hooks/useTaskManager.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { useAuth } from "./useAuth";
import { apiService } from "@/lib/api";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

// Comprehensive hook that combines useTasks and useDashboardTasks functionality
export const useTaskManager = (
  displayDates?: Date[],
  selectedProjectId: number | null = null
) => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  // Local task state for dashboard view
  const [localTasks, setLocalTasks] = useState<{ [key: string]: Task[] }>({});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Fetch all tasks with React Query
  const {
    data: tasks,
    error,
    isLoading: tasksLoading,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: apiService.getTasks,
    enabled: !!user && !authLoading,
  });

  // Memoize the fetchAllTasks function to prevent infinite loop
  const fetchAllTasks = useCallback(() => {
    console.log("Fetching all tasks...");
    return refetch();
  }, [refetch]);

  // Helper function to format date to YYYY-MM-DD string
  const formatDateString = useCallback((date: Date | string): string => {
    if (date instanceof Date) {
      return format(date, "yyyy-MM-dd");
    }
    // If it's already a string, extract the date part (before 'T' if ISO format)
    if (typeof date === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date; // Already in YYYY-MM-DD format
      }
      // Try to extract date part from ISO string
      return date.split("T")[0];
    }

    // Default to today if we can't parse the date
    return format(new Date(), "yyyy-MM-dd");
  }, []);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: apiService.createTask,
    onSuccess: (result) => {
      queryClient.setQueryData<Task[]>(["tasks"], (old) => [
        result,
        ...(old || []),
      ]);
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to create task:", error.message);
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Task): Promise<Task> => {
      console.log("useTaskManager - updateTask mutation called with:", {
        taskId: updatedTask.id,
        date: updatedTask.date,
        dateType: typeof updatedTask.date,
      });

      // Ensure task date is properly formatted
      const taskToUpdate = {
        ...updatedTask,
        date: formatDateString(updatedTask.date),
      };

      console.log("Sending to API service:", {
        taskId: taskToUpdate.id,
        finalDate: taskToUpdate.date,
      });

      return await apiService.updateTask(taskToUpdate);
    },
    onMutate: async (updatedTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return [updatedTask];

        const updated = old.map((task) =>
          task.id === updatedTask.id
            ? { ...updatedTask, date: formatDateString(updatedTask.date) }
            : task
        );

        console.log("Cache updated, new task state:", {
          taskId: updatedTask.id,
          updatedDate: formatDateString(updatedTask.date),
        });

        return updated;
      });

      // Return a context object with the previous tasks
      return { previousTasks };
    },
    onError: (error: Error, _variables, context) => {
      console.error("Failed to update task:", error.message);
      toast.error(`Failed to update task: ${error.message}`);

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: () => {
      toast.success("Task updated successfully");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: apiService.deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueryData<Task[]>(["tasks"], (old) =>
        (old || []).filter((task) => task.id !== id)
      );
      return { previousTasks };
    },
    onError: (error: Error, _variables, context) => {
      console.error("Failed to delete task:", error.message);
      toast.error(`Failed to delete task: ${error.message}`);
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Filter tasks based on selected project
  const filterTasksByProject = useCallback(
    (tasksToFilter: Task[]): Task[] => {
      if (!selectedProjectId) return tasksToFilter;

      return tasksToFilter.filter((task) => {
        // Make sure projects exists and is an array
        if (!task.projects || !Array.isArray(task.projects)) return false;

        // In our API, projects is an array of objects with id property
        return task.projects.some(
          (project) => project.id === selectedProjectId
        );
      });
    },
    [selectedProjectId]
  );

  // Get tasks for a specific date
  const getTasksForDate = useCallback(
    (date: Date) => {
      if (!tasks || tasks.length === 0) return [];

      // Format the target date as YYYY-MM-DD for comparison
      const targetDateStr = format(date, "yyyy-MM-dd");

      return tasks.filter((task) => {
        // Get the date string regardless of whether task.date is Date or string
        const taskDateStr = formatDateString(task.date);
        // Compare date strings directly
        return taskDateStr === targetDateStr;
      });
    },
    [tasks, formatDateString]
  );

  // Get tasks for a week
  const getTasksForWeek = useCallback(
    (date: Date) => {
      if (!tasks || tasks.length === 0) return [];

      const start = startOfWeek(date, { weekStartsOn: 1 }); // Assuming Monday as the start of the week
      const end = endOfWeek(date, { weekStartsOn: 1 });

      // Format start and end dates as YYYY-MM-DD for comparison
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      return tasks.filter((task) => {
        // Get the date string regardless of whether task.date is Date or string
        const taskDateStr = formatDateString(task.date);
        // Compare date strings to check if task date is within week range
        return taskDateStr >= startStr && taskDateStr <= endStr;
      });
    },
    [tasks, formatDateString]
  );

  // Update local tasks when dates or project filter changes
  useEffect(() => {
    if (!displayDates) return;

    if (tasks && tasks.length > 0) {
      const newLocalTasks: { [key: string]: Task[] } = {};
      displayDates.forEach((date) => {
        const formattedDate = format(date, "yyyy-MM-dd");
        const tasksForDate = getTasksForDate(date);
        const filteredTasks = filterTasksByProject(tasksForDate);

        newLocalTasks[formattedDate] = filteredTasks;
      });
      setLocalTasks(newLocalTasks);
    } else {
      const emptyTasks: { [key: string]: Task[] } = {};
      displayDates.forEach((date) => {
        const formattedDate = format(date, "yyyy-MM-dd");
        emptyTasks[formattedDate] = [];
      });
      setLocalTasks(emptyTasks);
    }
  }, [
    tasks,
    getTasksForDate,
    displayDates,
    selectedProjectId,
    filterTasksByProject,
  ]);

  // Handle task changes
  const handleTaskChange = useCallback(
    (taskId: number, changes: Partial<Task>) => {
      // Find the task across all dates
      let foundTask: Task | null = null;

      if (tasks) {
        foundTask = tasks.find((t) => t.id === taskId) || null;
      } else {
        Object.entries(localTasks).some(([, tasksForDate]) => {
          const task = tasksForDate.find((t) => t.id === taskId);
          if (task) {
            foundTask = task;
            return true;
          }
          return false;
        });
      }

      if (foundTask) {
        updateTaskMutation.mutate({ ...foundTask, ...changes });
      } else {
        console.error(`Task with ID ${taskId} not found for update`);
      }
    },
    [tasks, localTasks, updateTaskMutation]
  );

  // Handle task deletion
  const handleTaskDelete = useCallback(
    (taskId: number) => {
      deleteTaskMutation.mutate(taskId);
    },
    [deleteTaskMutation]
  );

  // Handle task editing
  const handleTaskEdit = useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  }, []);

  // Handle task saving
  const handleSaveTask = useCallback(
    async (taskData: Task | Omit<Task, "id">) => {
      try {
        console.log("Saving task:", {
          taskId: "id" in taskData ? taskData.id : "new task",
          date: taskData.date,
          dateType: typeof taskData.date,
        });

        if ("id" in taskData) {
          // Update existing task
          await updateTaskMutation.mutateAsync(taskData as Task);
        } else {
          // Create new task
          await createTaskMutation.mutateAsync(taskData);
        }

        setIsTaskModalOpen(false);
        setTaskToEdit(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(`Failed to save task: ${errorMessage}`);
        console.error("Save task error:", error);
        // Keep modal open so user can retry
      }
    },
    [updateTaskMutation, createTaskMutation]
  );

  // Add new task
  const handleAddTask = useCallback((date?: Date) => {
    setTaskToEdit(null);
    // If a date is provided, set it as the default for the new task
    if (date) {
      const emptyTask = {
        id: 0, // Temporary ID for new task
        title: "",
        description: "",
        date: format(date, "yyyy-MM-dd"),
        estimatedTime: 30,
        projects: [],
        completed: false,
        order: 0,
        userId: "", // Will be set when creating
      };
      setTaskToEdit(emptyTask as Task);
    }
    setIsTaskModalOpen(true);
  }, []);

  return {
    // Basic data
    tasks,
    error,
    isLoading: tasksLoading || authLoading,

    // Dashboard view specific
    localTasks,
    setLocalTasks,
    isTaskModalOpen,
    setIsTaskModalOpen,
    taskToEdit,

    // Actions
    fetchAllTasks,
    createTask: (task: Omit<Task, "id">) => createTaskMutation.mutate(task),
    updateTask: (task: Task) => updateTaskMutation.mutate(task),
    deleteTask: (id: number) => deleteTaskMutation.mutate(id),

    // Helper methods
    getTasksForDate,
    getTasksForWeek,
    formatDateString,

    // Dashboard specific handlers
    handleTaskChange,
    handleTaskDelete,
    handleTaskEdit,
    handleSaveTask,
    handleAddTask,
  };
};
