// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.17.0";
import { format } from "npm:date-fns@2.30.0";
import { corsHeaders } from "../_shared/cors.ts";

// Task and project types
interface Task {
  id: string;
  title: string;
  notes: string | null;
  estimatedTime: number;
  date: string;
  completed: boolean;
  order: number;
  userId: string;
  projects?: Project[];
}

interface Project {
  id: string;
  name: string;
}

// Task representation for AI
interface TaskForAI {
  id: string;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  completed: boolean;
  projects: string[];
}

// Prepare tasks for Claude
const prepareTasksForAI = (tasks: Task[]): Record<string, TaskForAI[]> => {
  // Group by date
  const tasksByDate: Record<string, TaskForAI[]> = {};

  tasks.forEach((task) => {
    const date = format(new Date(task.date), "yyyy-MM-dd");
    if (!tasksByDate[date]) tasksByDate[date] = [];

    tasksByDate[date].push({
      id: task.id,
      title: task.title,
      description: task.notes || "",
      estimatedTimeMinutes: task.estimatedTime,
      completed: task.completed,
      projects: task.projects?.map((p) => p.name) || [],
    });
  });

  return tasksByDate;
};

Deno.serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request data
    const { message, date, currentSuggestions } = await req.json();

    // Initialize Supabase client with auth context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the user
    const { data: userData, error: authError } = await supabase.auth.getUser(
      token
    );
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create a new client with the auth context
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Fetch tasks from database with RLS enforced
    const { data: tasksData, error: tasksError } = await authClient
      .from("tasks")
      .select(
        `
        id, 
        title, 
        notes, 
        estimated_time, 
        date, 
        completed, 
        order,
        user_id,
        projects (
          id, 
          name
        )
      `
      )
      .order("order", { ascending: true });

    if (tasksError) {
      console.error("Failed to fetch tasks:", tasksError);
      return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Convert from snake_case to camelCase for our code
    const tasks: Task[] = tasksData.map((task) => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      estimatedTime: task.estimated_time || 0,
      date: task.date,
      completed: task.completed || false,
      order: task.order || 0,
      userId: task.user_id,
      projects: task.projects,
    }));

    // Format tasks for Claude
    const tasksDataForClaude = prepareTasksForAI(tasks);

    // Determine which date we're planning for
    const targetDate = date
      ? typeof date === "string"
        ? date
        : format(new Date(date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    // Create the prompt for Claude
    const systemPrompt = `
      You are an AI task planning assistant for people with ADHD. 
      Your goal is to help the user plan and organize their day effectively.
      
      The user's tasks are organized by date. Here's their current task data:
      ${JSON.stringify(tasksDataForClaude, null, 2)}
      
      The user is currently planning for date: ${targetDate}
      
      ${
        currentSuggestions
          ? `
      IMPORTANT: The user already has pending suggestions that have not been applied yet:
      ${JSON.stringify(currentSuggestions, null, 2)}
      
      They are asking you to modify these pending suggestions. Your response should INCLUDE these suggestions
      with any modifications the user requested. Do not lose any pending suggestions unless explicitly asked to.
      `
          : ""
      }

      When suggesting changes, use the following JSON structure:
      {
        "explanation": "Human-readable explanation of your suggestions",
        "changes": {
          "create": [
            {
              "title": "New task name",
              "description": "Description",
              "estimatedTime": 30,
              "date": "YYYY-MM-DD",
              "projects": ["Project 1", "Project 2"]
            }
          ],
          "update": [
            {
              "id": 123,
              "title": "Updated task name",
              "description": "Updated description",
              "estimatedTime": 45,
              "date": "YYYY-MM-DD", 
              "projects": ["Project 1", "Project 2"]
            }
          ],
          "delete": [123, 456]
        }
      }
      
      IMPORTANT INSTRUCTIONS FOR DATE HANDLING:
      1. You can suggest tasks for any date, not just ${targetDate}
      2. ALL dates MUST use the format "YYYY-MM-DD" (e.g., "${targetDate}")
      3. When updating tasks, you MUST ALWAYS include the date field with a valid date
      4. If you're not changing the date of a task, still include its current date in the update
      5. NEVER omit the date field in an update, as this can cause errors
      
      CRITICAL UPDATE RULES:
      1. When updating a task, ALWAYS include the id and ALL fields you want to change
      2. If you're only changing one property (like estimated time), you must still include the other properties
      3. If you omit a property in an update, the system will assume you want to delete that property
      4. Example: If updating just the time, include id, title, description, estimatedTime, date, and projects
      
      For people with ADHD:
      1. Suggest breaking large tasks into smaller ones
      2. Prioritize tasks based on importance and urgency
      3. Suggest realistic time estimates (often people with ADHD underestimate time)
      4. Group similar tasks together when possible
      5. Limit the number of tasks per day to avoid overwhelm
      
      Always respond with ONLY the structured JSON.
      
      IMPORTANT: Place the JSON inside a code block like this:
      \`\`\`json
      {
        "explanation": "Your explanation here",
        "changes": {
          "create": [],
          "update": [],
          "delete": []
        }
      }
      \`\`\`
    `;

    // Initialize Anthropic client
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Call Claude API
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: systemPrompt,
      max_tokens: 2000,
      messages: [{ role: "user", content: message }],
    });

    // Ensure we have a valid response
    const content = claudeResponse.content[0]?.text || "";

    return new Response(
      JSON.stringify({
        response: content,
        status: "success",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("AI planning error:", error);

    // More detailed error response
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process request",
        status: "error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/planning-copilot' \
    --header 'Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{"message":"Help me plan my day", "date":"2024-05-02"}'

*/
