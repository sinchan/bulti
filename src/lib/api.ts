// lib/api.ts
import { Task, Project } from "@/types";
import { supabase } from "./supabase";

// Task API functions
export const apiService = {
  // Fetch all tasks for the authenticated user
  getTasks: async (): Promise<Task[]> => {
    const { data: tasksData, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        projects:tasks_projects(
          project:projects(id, name)
        )
      `
      )
      .order("order");

    if (error) throw error;

    // Transform data to match our Task type
    return tasksData.map(
      (task: TaskRecord): Task => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        notes: task.notes || "",
        date: task.date,
        completed: task.completed || false,
        estimatedTime: task.estimated_time || 0,
        order: task.order || 0,
        userId: task.user_id,
        projects:
          task.projects?.map((p) => ({
            id: p.project.id,
            name: p.project.name,
          })) || [],
      })
    );
  },

  // Create a new task
  createTask: async (task: Omit<Task, "id">): Promise<Task> => {
    // Get the current user first
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Failed to get user:", userError);
      throw new Error("Authentication error: Failed to get current user");
    }

    if (!userData.user?.id) {
      throw new Error("Authentication required: Please log in to create tasks");
    }

    // Create the task
    try {
      const { data: createdTask, error } = await supabase
        .from("tasks")
        .insert({
          title: task.title,
          description: task.description,
          notes: task.notes,
          date:
            typeof task.date === "string" ? task.date : task.date.toISOString(),
          completed: task.completed || false,
          estimated_time: task.estimatedTime,
          order: task.order,
          user_id: userData.user.id, // Use the authenticated user ID
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create task:", error);
        throw error;
      }

      if (!createdTask) {
        throw new Error("Failed to create task: No task returned");
      }

      // Handle projects
      await handleProjectConnections(createdTask.id, task.projects || []);

      // Return the task with projects
      return {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description || "",
        notes: createdTask.notes || "",
        date: createdTask.date,
        completed: createdTask.completed || false,
        estimatedTime: createdTask.estimated_time || 0,
        order: createdTask.order || 0,
        userId: createdTask.user_id,
        projects: task.projects || [],
      };
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error;
    }
  },

  // Update a task
  updateTask: async (task: Task): Promise<Task> => {
    // Check that we have a valid task ID
    if (!task.id || typeof task.id !== "number") {
      throw new Error("Invalid task ID: Task ID must be a valid number");
    }

    console.log("API Service - updateTask called with task:", {
      taskId: task.id,
      date: task.date,
      dateType: typeof task.date,
      fullTask: task,
    });

    // Safely handle date value
    let dateValue = task.date;
    const originalDateValue = task.date; // Keep for comparison

    // Ensure we have a valid date string
    if (dateValue === undefined || dateValue === null) {
      // Default to today if date is missing
      dateValue = new Date().toISOString().split("T")[0];
      console.warn(
        `Task ${task.id} had undefined date, defaulting to today: ${dateValue}`
      );
    } else if (typeof dateValue === "string") {
      console.log(`Task ${task.id} date is string type: "${dateValue}"`);
      // Use the string as-is if it's already a string
      // But ensure it's in YYYY-MM-DD format if possible
      if (dateValue.includes("T")) {
        // If it's an ISO string, extract just the date part
        const originalValue = dateValue;
        dateValue = dateValue.split("T")[0];
        console.log(
          `Task ${task.id} date converted from ISO string: "${originalValue}" -> "${dateValue}"`
        );
      } else {
        console.log(
          `Task ${task.id} date appears to be in YYYY-MM-DD format already: "${dateValue}"`
        );
      }
      // No additional processing needed if it's already YYYY-MM-DD format
    } else if (dateValue instanceof Date) {
      // Convert Date object to ISO string and extract date part
      const originalValue = dateValue;
      dateValue = dateValue.toISOString().split("T")[0];
      console.log(
        `Task ${task.id} date converted from Date object: "${originalValue}" -> "${dateValue}"`
      );
    } else {
      // For any other case, try to convert to a Date and format it
      try {
        console.log(
          `Task ${
            task.id
          } date is of type ${typeof dateValue}, attempting to parse:`,
          dateValue
        );
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          const originalValue = dateValue;
          dateValue = parsedDate.toISOString().split("T")[0];
          console.log(
            `Task ${
              task.id
            } date successfully parsed from ${typeof originalValue}: "${originalValue}" -> "${dateValue}"`
          );
        } else {
          // If parsing fails, default to today
          const originalValue = dateValue;
          dateValue = new Date().toISOString().split("T")[0];
          console.warn(
            `Task ${task.id} had invalid date: "${originalValue}", defaulting to today: "${dateValue}"`
          );
        }
      } catch (error) {
        // Last resort, default to today
        const originalValue = dateValue;
        dateValue = new Date().toISOString().split("T")[0];
        console.warn(
          `Task ${task.id} date parsing error for "${originalValue}", defaulting to today: "${dateValue}"`,
          error
        );
      }
    }

    console.log(
      `Final formatted date for task ${task.id}: "${dateValue}" (original: "${originalDateValue}")`
    );
    console.log(
      `Date transformation: ${
        originalDateValue === dateValue ? "NO CHANGE" : "CHANGED"
      }`
    );

    // Prepare update payload
    const updatePayload = {
      title: task.title,
      description: task.description,
      notes: task.notes,
      date: dateValue, // Use our safely processed date value
      completed: task.completed,
      estimated_time: task.estimatedTime,
      order: task.order,
      updated_at: new Date().toISOString(), // Explicitly update timestamp
    };

    console.log("API Service - Sending update to Supabase:", {
      taskId: task.id,
      finalDate: dateValue,
      payload: updatePayload,
    });

    // Update task
    const { data, error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", task.id)
      .select("*"); // Explicitly request all fields

    if (error) {
      console.error("Failed to update task:", {
        taskId: task.id,
        error: error.message,
        code: error.code,
        details: error.details,
      });
      throw error;
    }

    console.log("Supabase update response:", {
      success: !!data,
      dataLength: data?.length,
      returnedDate: data?.[0]?.date,
      dateMatch: data?.[0]?.date === dateValue ? "MATCH" : "MISMATCH",
    });

    // Update project connections if provided
    if (task.projects) {
      // First remove existing connections
      const { error: deleteError } = await supabase
        .from("tasks_projects")
        .delete()
        .eq("task_id", task.id);

      if (deleteError) {
        console.error(
          "Failed to delete existing project connections:",
          deleteError
        );
        throw deleteError;
      }

      // Then create new connections
      if (task.projects.length > 0) {
        const projectConnections = task.projects.map((project) => ({
          task_id: task.id,
          project_id: project.id,
        }));

        const { error: insertError } = await supabase
          .from("tasks_projects")
          .insert(projectConnections);

        if (insertError) {
          console.error(
            "Failed to insert new project connections:",
            insertError
          );
          throw insertError;
        }
      }
    }

    // Return a task with the safely processed date value
    const finalTask = {
      ...task,
      date: dateValue,
    };

    console.log("Returning updated task from API service:", {
      taskId: task.id,
      returnedDate: finalTask.date,
      originalTaskDate: task.date,
      dateChanged: task.date !== finalTask.date ? "YES" : "NO",
    });

    return finalTask;
  },

  // Delete a task
  deleteTask: async (id: number): Promise<void> => {
    // Delete task (will cascade delete entries in tasks_projects)
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;
  },

  // Specialized method to only update task order
  updateTaskOrder: async ({
    id,
    order,
  }: {
    id: number;
    order: number;
  }): Promise<void> => {
    if (!id || typeof id !== "number") {
      throw new Error("Invalid task ID: Task ID must be a valid number");
    }

    console.log("Updating task order:", { taskId: id, newOrder: order });

    // Only update the order field
    const { error, data } = await supabase
      .from("tasks")
      .update({ order, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, order, date");

    if (error) {
      console.error("Failed to update task order:", {
        taskId: id,
        error: error.message,
        code: error.code,
      });
      throw error;
    }

    console.log("Task order updated successfully:", {
      taskId: id,
      newOrder: order,
      returnedTask: data?.[0],
    });
  },

  // Batch update multiple tasks (order and/or date) in a single operation
  batchUpdateTasks: async (
    updates: { id: number; order: number; date: string }[]
  ): Promise<void> => {
    if (!updates.length) return;

    console.log("Starting batch update of tasks:", {
      taskCount: updates.length,
      tasks: updates.map((u) => ({ id: u.id, order: u.order, date: u.date })),
    });

    // Get the current user first
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Failed to get user:", userError);
      throw new Error("Authentication error: Failed to get current user");
    }

    if (!userData.user?.id) {
      throw new Error("Authentication required: Please log in to update tasks");
    }

    // Create update promises for all tasks (all now include date)
    const updatePromises = updates.map(({ id, order, date }) => {
      console.log(
        `Creating update promise for task ${id} with order ${order} and date ${date}`
      );
      return supabase
        .from("tasks")
        .update({
          order,
          date: date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userData.user.id)
        .select("id, order, date");
    });

    console.log(
      "Executing batch updates for tasks:",
      updates.map((u) => ({ id: u.id, order: u.order, date: u.date }))
    );

    // Execute all updates in parallel
    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Failed to batch update tasks:", {
        error: errors[0].error,
        errorMessage: errors[0].error?.message,
        affectedTask: updates.find(
          (u) => u.id.toString() === errors[0].error?.details?.split(" ").pop()
        ),
      });
      throw errors[0].error;
    }

    // Log successful updates
    const successfulUpdates = results
      .filter((result) => !result.error && result.data)
      .map((result, index) => ({
        taskId: updates[index].id,
        order: updates[index].order,
        date: result.data?.[0]?.date,
        updatedDate: updates[index].date,
      }));

    console.log("Batch update completed successfully:", {
      taskCount: updates.length,
      successCount: successfulUpdates.length,
      updatedTasks: successfulUpdates,
    });
  },
};

// Project API functions
export const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
};

export const createProject = async (name: string): Promise<Project> => {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const searchProjectByName = async (
  name: string
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .ilike("name", name)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows returned
    throw error;
  }
  return data;
};

// Alias for backward compatibility
export const findProjectByName = searchProjectByName;

// Helper function to handle project connections
const handleProjectConnections = async (
  taskId: number,
  projects: Project[]
) => {
  if (!projects || projects.length === 0) return;

  const projectConnections = projects.map((project) => ({
    task_id: taskId,
    project_id: project.id,
  }));

  const { error: projectError } = await supabase
    .from("tasks_projects")
    .insert(projectConnections);

  if (projectError) throw projectError;
};

// Define a type for TaskRecord from database
interface TaskRecord {
  id: number;
  title: string;
  description?: string;
  notes?: string;
  date: string;
  completed: boolean;
  estimated_time?: number;
  order?: number;
  user_id: string;
  projects?: { project: { id: number; name: string } }[];
}
