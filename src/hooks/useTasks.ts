// hooks/useTasks.ts
// DEPRECATED: Use useTaskManager instead for consistent task management
// This hook is kept for backwards compatibility
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { useAuth } from "./useAuth"; // Custom hook to get auth state
import { apiService } from "@/lib/api";
import { useCallback } from "react";

interface TasksHookReturn {
  tasks: Task[] | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
  createTask: (task: Omit<Task, "id">) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: number) => void;
  getTasksForWeek: (date: Date) => Task[];
  getTasksForDate: (date: Date) => Task[];
}

export const useTasks = (): TasksHookReturn => {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth(); // Custom hook to get auth state

  const {
    data: tasks,
    error,
    isLoading,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: apiService.getTasks,
    // Only fetch when user is authenticated
    enabled: !!user && !loading,
  });

  const createTaskMutation = useMutation({
    mutationFn: apiService.createTask,
    onSuccess: (result) => {
      queryClient.setQueryData<Task[]>(["tasks"], (old) => [
        ...(old || []),
        result,
      ]);
    },
    onError: (error: Error) => {
      console.error("Failed to create task:", error.message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Task): Promise<Task> => {
      console.log('useTasks hook - updateTask mutation called with:', {
        taskId: updatedTask.id,
        date: updatedTask.date,
        dateType: typeof updatedTask.date,
        fullTask: updatedTask
      });
      
      // Ensure task date is properly formatted as a string before passing to API
      let taskToUpdate = {...updatedTask};
      
      // If date is a string in YYYY-MM-DD format, keep it as is
      if (typeof taskToUpdate.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(taskToUpdate.date)) {
        console.log('Task date is already properly formatted YYYY-MM-DD:', {
          taskId: taskToUpdate.id,
          date: taskToUpdate.date
        });
      } 
      // Otherwise, ensure it's formatted correctly
      else if (taskToUpdate.date) {
        try {
          console.log('Need to format task date:', {
            taskId: taskToUpdate.id,
            originalDate: taskToUpdate.date,
            dateType: typeof taskToUpdate.date
          });
          
          const dateValue = typeof taskToUpdate.date === 'string' 
            ? new Date(taskToUpdate.date)
            : taskToUpdate.date;
            
          const formattedDate = format(dateValue, 'yyyy-MM-dd');
          taskToUpdate.date = formattedDate;
          console.log(`Reformatted task date:`, {
            taskId: taskToUpdate.id,
            from: updatedTask.date,
            to: formattedDate
          });
        } catch (error) {
          console.error('Failed to format date:', {
            error,
            taskId: taskToUpdate.id,
            originalDate: taskToUpdate.date
          });
          // Default to today if parsing fails
          taskToUpdate.date = format(new Date(), 'yyyy-MM-dd');
          console.log('Using today as fallback date:', taskToUpdate.date);
        }
      } else {
        // Default to today if no date provided
        taskToUpdate.date = format(new Date(), 'yyyy-MM-dd');
        console.log('No date provided, using today:', {
          taskId: taskToUpdate.id,
          dateSet: taskToUpdate.date
        });
      }
      
      // Call the API service to persist the change
      console.log('Sending to API service:', {
        taskId: taskToUpdate.id,
        finalDate: taskToUpdate.date,
        dateType: typeof taskToUpdate.date
      });
      return await apiService.updateTask(taskToUpdate);
    },
    onMutate: async (updatedTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      
      // Find current task in cache to see what we're changing
      const currentCachedTask = previousTasks?.find(task => task.id === updatedTask.id);
      console.log('Current cached task before update:', {
        taskId: updatedTask.id,
        currentDate: currentCachedTask?.date,
        newDate: updatedTask.date,
        isDateChanging: currentCachedTask?.date !== updatedTask.date
      });
      
      // Log the task update operation
      console.log('Optimistically updating task in React Query cache:', {
        taskId: updatedTask.id,
        date: updatedTask.date,
        dateType: typeof updatedTask.date
      });
      
      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return [updatedTask];
        
        const updated = old.map((task) => 
          task.id === updatedTask.id ? updatedTask : task
        );
        
        console.log('Cache updated, new task state:', {
          taskId: updatedTask.id,
          updatedDate: updatedTask.date
        });
        
        return updated;
      });
      
      // Return a context object with the previous tasks
      return { previousTasks };
    },
    onError: (error: Error, variables, context) => {
      console.error("Failed to update task:", error.message);
      console.error("Task that failed to update:", variables);
      
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: (result, variables) => {
      console.log('Task updated successfully in Supabase:', {
        taskId: result.id,
        returnedDate: result.date,
        originalDate: variables.date,
        datesMatch: result.date === variables.date
      });
      
      // Update the cache with the result from the server to ensure consistency
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return [result];
        
        const updated = old.map((task) => 
          task.id === result.id ? result : task
        );
        
        console.log('Cache updated with server response:', {
          taskId: result.id,
          finalDate: result.date
        });
        
        return updated;
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure cache is in sync with server
      console.log('Re-fetching tasks after mutation settled', {
        taskId: variables.id,
        success: !!data,
        error: !!error,
        finalDate: data?.date
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

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
    onError: (error: Error, variables, context) => {
      console.error("Failed to delete task:", error.message);
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Helper function to format date to YYYY-MM-DD string
  const formatToDateString = useCallback((date: Date | string): string => {
    if (date instanceof Date) {
      return format(date, "yyyy-MM-dd");
    }
    // If it's already a string, extract the date part (before 'T' if ISO format)
    return typeof date === "string" ? date.split("T")[0] : "";
  }, []);

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
        const taskDateStr = formatToDateString(task.date);

        // Compare date strings to check if task date is within week range
        return taskDateStr >= startStr && taskDateStr <= endStr;
      });
    },
    [tasks, formatToDateString]
  );

  const getTasksForDate = useCallback(
    (date: Date) => {
      if (!tasks || tasks.length === 0) return [];

      // Format the target date as YYYY-MM-DD for comparison
      const targetDateStr = format(date, "yyyy-MM-dd");

      return tasks.filter((task) => {
        // Get the date string regardless of whether task.date is Date or string
        const taskDateStr = formatToDateString(task.date);

        // Compare date strings directly
        return taskDateStr === targetDateStr;
      });
    },
    [tasks, formatToDateString]
  );

  return {
    tasks,
    error,
    isLoading,
    refetch,
    createTask: (task: Omit<Task, "id">) =>
      createTaskMutation.mutate(task as Omit<Task, "id">),
    updateTask: (task: Task) => updateTaskMutation.mutate(task),
    deleteTask: (id: number) => deleteTaskMutation.mutate(id),
    getTasksForWeek,
    getTasksForDate,
  };
};
