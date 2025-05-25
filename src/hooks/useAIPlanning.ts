import { useState } from "react";
import { useAITaskPlanning } from "@/hooks/useAITaskPlanning";
import { Task } from "@/types";
import { ChatMessage, PreviewData } from "@/components/dashboard/types";

export const useAIPlanning = (
  centerDate: Date,
  tasks: Task[] | undefined,
  fetchAllTasks: () => Promise<unknown>
  // getTasksForDate: (date: Date) => Task[] // Currently unused
) => {
  const {
    isApplyingAI,
    applyAISuggestions,
    fetchAISuggestions,
    parseAIResponse,
  } = useAITaskPlanning();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Task suggestion preview state
  const [pendingSuggestions, setPendingSuggestions] = useState<{
    create?: Omit<Task, "id">[];
    update?: Task[];
    delete?: number[];
  } | null>(null);

  // Send message to AI
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      // Call the Supabase Edge Function using our hook
      const aiResponse = await fetchAISuggestions({
        message: chatInput,
        date: centerDate,
        currentSuggestions: pendingSuggestions,
      });

      if (!aiResponse) {
        throw new Error("Received empty response from AI");
      }

      console.log(
        "AI Response received:",
        typeof aiResponse,
        aiResponse.substring(0, 100) + "..."
      );

      // Try to extract JSON from the AI response
      const parsed = parseAIResponse(aiResponse);

      if (parsed) {
        const { suggestions, explanation } = parsed;
        setPendingSuggestions(suggestions);

        // Check if there are any actual suggestions to show
        const hasSuggestions =
          suggestions.create?.length > 0 ||
          suggestions.update?.length > 0 ||
          suggestions.delete?.length > 0;

        if (hasSuggestions) {
          setIsPreviewOpen(true);
        }

        // Add AI message with cleaned content to chat
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: explanation,
          timestamp: new Date(),
          suggestions,
        };

        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle case where no valid JSON was found
        const aiMessage: ChatMessage = {
          role: "assistant",
          content:
            "I couldn't process that request properly. Please try again. The AI response did not contain valid suggestions.",
          timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("AI error:", error);

      // Add error message to chat
      const errorMessage2: ChatMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, errorMessage2]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI suggestions
  const handleApplySuggestions = async () => {
    if (!pendingSuggestions) return;

    try {
      await applyAISuggestions(pendingSuggestions);

      // Force a refresh of the local tasks
      await fetchAllTasks();

      // Close preview and reset suggestions
      setIsPreviewOpen(false);
      setPendingSuggestions(null);
    } catch (error) {
      console.error("Error applying changes:", error);
    }
  };

  // Prepare preview data
  const preparePreviewData = (): PreviewData => {
    const creates = pendingSuggestions?.create || [];

    const updates =
      pendingSuggestions?.update?.map((updated) => {
        const original = tasks?.find((t) => t.id === updated.id);
        return {
          original: original || updated, // Fallback if original not found
          updated,
        };
      }) || [];

    const deletes =
      pendingSuggestions?.delete?.map((id) => {
        const task = tasks?.find((t) => t.id === id);
        return task || ({ id } as Task); // Fallback if task not found
      }) || [];

    return { creates, updates, deletes };
  };

  return {
    chatMessages,
    chatInput,
    isAiLoading,
    isPreviewOpen,
    pendingSuggestions,
    setIsPreviewOpen,
    setPendingSuggestions,
    setChatInput,
    sendChatMessage,
    handleApplySuggestions,
    preparePreviewData,
    isApplyingAI,
  };
};
