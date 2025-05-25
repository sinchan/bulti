// DEPRECATED: Use useTaskManager instead for consistent task management
// This hook is kept for backwards compatibility
import { useCallback, useState, useEffect } from "react";
import { format } from "date-fns";
import { Task } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

export const useDashboardTasks = (displayDates: Date[], selectedProjectId: number | null) => {
  const {
    tasks,
    isLoading,
    refetch: fetchAllTasksOriginal,
    createTask,
    updateTask,
    deleteTask,
    getTasksForDate,
  } = useTasks();

  const [localTasks, setLocalTasks] = useState<{ [key: string]: Task[] }>({});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Memoize the fetchAllTasks function to prevent infinite loop
  const fetchAllTasks = useCallback(() => {
    return fetchAllTasksOriginal();
  }, [fetchAllTasksOriginal]);

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

  // Update local tasks when dates change or project filter changes
  useEffect(() => {
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
  const handleTaskChange = (taskId: number, changes: Partial<Task>) => {
    // Find the task across all dates
    let foundTask: Task | null = null;

    Object.entries(localTasks).some(([, tasksForDate]) => {
      const task = tasksForDate.find((t) => t.id === taskId);
      if (task) {
        foundTask = task;
        return true;
      }
      return false;
    });

    if (foundTask) {
      updateTask({ ...foundTask, ...changes });
    }
  };

  // Handle task deletion
  const handleTaskDelete = (taskId: number) => {
    deleteTask(taskId);
  };

  // Handle task editing
  const handleTaskEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  // Handle task saving
  const handleSaveTask = async (taskData: Task | Omit<Task, "id">) => {
    try {
      console.log("Saving task:", {
        taskId: "id" in taskData ? taskData.id : "new task",
        date: taskData.date,
        dateType: typeof taskData.date,
      });

      if ("id" in taskData) {
        // Update existing task
        console.log("Updating existing task with date:", taskData.date);
        await updateTask(taskData);
      } else {
        // Create new task
        console.log("Creating new task with date:", taskData.date);
        await createTask(taskData);
      }

      setIsTaskModalOpen(false);
      setTaskToEdit(null);
      toast.success(
        `Task ${"id" in taskData ? "updated" : "created"} successfully`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to save task: ${errorMessage}`);
      console.error("Save task error:", error);
      // Keep modal open so user can retry
    }
  };

  // Add new task
  const handleAddTask = (date?: Date) => {
    setTaskToEdit(null);
    // If a date is provided, set it as the default for the new task
    if (date) {
      const emptyTask = {
        title: "",
        description: "",
        date: format(date, "yyyy-MM-dd"),
        estimatedTime: 30,
        projects: [],
        completed: false,
        order: 0,
      };
      setTaskToEdit(emptyTask as Task);
    }
    setIsTaskModalOpen(true);
  };

  return {
    localTasks,
    setLocalTasks,
    isTaskModalOpen,
    setIsTaskModalOpen,
    taskToEdit,
    isLoading,
    handleTaskChange,
    handleTaskDelete,
    handleTaskEdit,
    handleSaveTask,
    handleAddTask,
    fetchAllTasks,
    updateTask,
  };
};