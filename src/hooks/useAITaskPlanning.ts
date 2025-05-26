"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTaskStore, AITaskSuggestion } from "@/store/taskStore";
import { findProjectByName } from "@/lib/api";
import { supabase, getEdgeFunctionUrl } from "@/lib/supabase";
import { format } from "date-fns";
import { useTaskManager } from "./useTaskManager";

interface GetAISuggestionsParams {
  message: string;
  date?: Date | string;
  currentSuggestions?: AITaskSuggestion | null;
}

export function useAITaskPlanning() {
  // Use the consolidated task manager hook
  const { tasks, createTask, updateTask, deleteTask } = useTaskManager();
  const queryClient = useQueryClient();

  const {
    isApplyingAI,
    setIsApplyingAI,
    getTasksForAI,
    setAISuggestions,
    aiSuggestions,
  } = useTaskStore();

  // New mutation for fetching AI suggestions from the Edge Function
  const fetchAISuggestionsMutation = useMutation({
    mutationFn: async ({
      message,
      date,
      currentSuggestions,
    }: GetAISuggestionsParams) => {
      // Get the session token from Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToken = sessionData?.session?.access_token;

      console.log(
        "Auth session:",
        sessionData?.session ? "Present" : "Missing"
      );

      // Check if we're in development on localhost
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // In production, we require authentication
      if (!sessionToken && !isLocalDev) {
        throw new Error("Authentication required");
      }

      // Format the date
      const formattedDate = date
        ? typeof date === "string"
          ? date
          : format(date, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      // Get the Edge Function URL using our utility
      const apiUrl = getEdgeFunctionUrl("planning-copilot");
      console.log("Using Edge Function URL:", apiUrl);

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add the authorization header if we have a token
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      // Call the Supabase Edge Function
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message,
            date: formattedDate,
            currentSuggestions: currentSuggestions || undefined,
          }),
        });

        if (!response.ok) {
          // Log more details about the error for debugging
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
          });

          let errorMessage = "Failed to get AI suggestions";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If we can't parse the error as JSON, use default message
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.response;
      } catch (error) {
        console.error("Network or parsing error:", error);

        // Improve error message based on the type of error
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error(
            `Connection error: Could not reach the AI service. Please check your network connection or try again later.`
          );
        }

        // Re-throw the error
        throw error;
      }
    },
  });

  const applyAISuggestionsMutation = useMutation({
    mutationFn: async (suggestions: AITaskSuggestion) => {
      setIsApplyingAI(true);
      setAISuggestions(suggestions);

      try {
        // Process creates
        if (suggestions.create && suggestions.create.length > 0) {
          for (const taskData of suggestions.create) {
            // Ensure the date is properly formatted and preserved
            // If the date is already in YYYY-MM-DD format, use it directly without conversion
            let formattedDate = taskData.date;

            // Only if it's not in the expected format, we'll format it (but this shouldn't happen)
            if (
              taskData.date &&
              !/^\d{4}-\d{2}-\d{2}$/.test(String(taskData.date))
            ) {
              const taskDate = new Date(taskData.date);
              formattedDate = format(taskDate, "yyyy-MM-dd");
              console.log(
                `Reformatted date from ${taskData.date} to ${formattedDate}`
              );
            } else {
              // Log that we're keeping the original date exactly as is
              console.log(`Using original date format: ${taskData.date}`);
            }

            // If date is undefined or null, default to today
            if (!formattedDate) {
              formattedDate = format(new Date(), "yyyy-MM-dd");
              console.log(
                `No date provided, defaulting to today: ${formattedDate}`
              );
            }

            // Handle projects for the task
            const projectsData = [];

            if (taskData.projects && taskData.projects.length > 0) {
              // Process each project
              for (const projectItem of taskData.projects) {
                // Extract the name regardless of whether it's a string or object
                const projectName =
                  typeof projectItem === "string"
                    ? projectItem
                    : projectItem.name;

                // Check if it's an existing project
                let project = await findProjectByName(projectName);

                if (!project) {
                  // Create the project first to get a valid ID
                  const { data: newProject, error } = await supabase
                    .from("projects")
                    .insert({ name: projectName })
                    .select()
                    .single();

                  if (error) {
                    console.error("Failed to create project:", error);
                    continue;
                  }

                  project = newProject;
                }

                // Now we have a valid project with a real ID
                if (project && project.id !== undefined) {
                  projectsData.push({
                    id: project.id,
                    name: project.name,
                  });
                }
              }
            }

            // Create task with proper project data
            await createTask({
              ...taskData,
              projects: projectsData,
              date: formattedDate,
            });
          }
        }

        // Process updates
        if (suggestions.update && suggestions.update.length > 0) {
          // First, gather all task IDs for batch fetching
          const taskIds = suggestions.update.map((task) => task.id);

          // Fetch original tasks to get missing data if needed
          const { data: originalTasks } = await supabase
            .from("tasks")
            .select("*")
            .in("id", taskIds);

          const originalTaskMap = new Map();
          if (originalTasks && originalTasks.length > 0) {
            originalTasks.forEach((task) => {
              originalTaskMap.set(task.id, task);
            });
          }

          for (const taskData of suggestions.update) {
            // Get the original task data if available
            const originalTask = originalTaskMap.get(taskData.id);

            // Format date for update operations, just like for create operations
            let formattedDate = taskData.date;

            // If date is missing in the update but exists in original task, use that
            if (!formattedDate && originalTask) {
              formattedDate = originalTask.date;
              console.log(`Using original task date: ${formattedDate}`);
            }

            // Only if it's not in the expected format, format it
            if (
              formattedDate &&
              !/^\d{4}-\d{2}-\d{2}$/.test(String(formattedDate))
            ) {
              try {
                const taskDate = new Date(formattedDate);
                formattedDate = format(taskDate, "yyyy-MM-dd");
                console.log(
                  `Reformatted date from ${taskData.date} to ${formattedDate}`
                );
              } catch (error) {
                console.error(`Error formatting date: ${formattedDate}`, error);
                // If date parsing fails, default to today
                formattedDate = format(new Date(), "yyyy-MM-dd");
                console.log(`Setting default date: ${formattedDate}`);
              }
            } else {
              console.log(`Using original date format: ${formattedDate}`);
            }

            // If date is still undefined or null after all attempts, default to today
            if (!formattedDate) {
              formattedDate = format(new Date(), "yyyy-MM-dd");
              console.log(
                `No date found, defaulting to today: ${formattedDate}`
              );
            }

            // Handle projects for updates, similar to creates
            let projectsData = taskData.projects;

            if (taskData.projects && taskData.projects.length > 0) {
              projectsData = [];

              // Process each project
              for (const projectItem of taskData.projects) {
                // Extract the name regardless of whether it's a string or object
                const projectName =
                  typeof projectItem === "string"
                    ? projectItem
                    : projectItem.name;

                // Check if it's an existing project
                let project = await findProjectByName(projectName);

                if (!project) {
                  // Create the project first to get a valid ID
                  const { data: newProject, error } = await supabase
                    .from("projects")
                    .insert({ name: projectName })
                    .select()
                    .single();

                  if (error) {
                    console.error("Failed to create project:", error);
                    continue;
                  }

                  project = newProject;
                }

                // Now we have a valid project with a real ID
                if (project && project.id !== undefined) {
                  projectsData.push({
                    id: project.id,
                    name: project.name,
                  });
                }
              }
            }

            // Make sure we're not losing original task data if the AI didn't include it
            const order =
              taskData.order !== undefined
                ? taskData.order
                : originalTask
                ? originalTask.order
                : 0;

            await updateTask({
              ...taskData,
              date: formattedDate,
              projects: projectsData,
              order: order,
            });
          }
        }

        // Process deletes
        if (suggestions.delete && suggestions.delete.length > 0) {
          for (const id of suggestions.delete) {
            await deleteTask(id);
          }
        }

        // After all operations are complete, manually invalidate the tasks query
        // to force a fresh fetch from the server
        queryClient.invalidateQueries({ queryKey: ["tasks"] });

        return true;
      } finally {
        setIsApplyingAI(false);
        setAISuggestions(null);
      }
    },
    onError: (error) => {
      console.error("Error applying AI suggestions:", error);
      setIsApplyingAI(false);
      setAISuggestions(null);
    },
  });

  const getTasksForAIProcessing = () => {
    if (!tasks) return {};
    return getTasksForAI(tasks);
  };

  // Parse AI response to extract JSON suggestions
  const parseAIResponse = (response: string) => {
    if (!response) {
      console.error("Received empty response from AI");
      return null;
    }

    try {
      // First try to find JSON in code blocks
      if (response.includes("```json")) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const cleanedJson = jsonMatch[1].trim();
          const json = JSON.parse(cleanedJson);
          if (json.changes) {
            return {
              suggestions: json.changes,
              explanation:
                json.explanation?.trim() || "AI suggestions ready to apply",
            };
          }
        }
      }

      // If we couldn't find a code block, try to find any JSON in the response
      const jsonRegex = /(\{[\s\S]*\})/g;
      const matches = response.match(jsonRegex);

      if (matches) {
        // Try each matched JSON block
        for (const match of matches) {
          try {
            const json = JSON.parse(match);
            if (json.changes) {
              return {
                suggestions: json.changes,
                explanation:
                  json.explanation?.trim() || "AI suggestions ready to apply",
              };
            }
          } catch {
            // Continue to next match if this one fails
            continue;
          }
        }
      }

      console.error("Failed to find valid JSON in AI response", response);
      return null;
    } catch (error) {
      console.error("Failed to parse JSON from AI response", error);
      return null;
    }
  };

  return {
    isApplyingAI,
    aiSuggestions,
    getTasksForAIProcessing,
    fetchAISuggestions: fetchAISuggestionsMutation.mutateAsync,
    isFetchingSuggestions: fetchAISuggestionsMutation.isPending,
    applyAISuggestions: applyAISuggestionsMutation.mutate,
    isApplying: applyAISuggestionsMutation.isPending,
    parseAIResponse,
  };
}
