import { AIPlanner } from "./AIPlanner";
import { AIPreview } from "./AIPreview";
import { ChatMessage, PreviewData } from "./types";
import { Task } from "@/types";

interface AIPlannerWithPreviewProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  isAiLoading: boolean;
  setChatInput: (value: string) => void;
  sendChatMessage: () => void;
  onClose?: () => void;

  // AI Preview props
  pendingSuggestions: {
    create?: Omit<Task, "id">[];
    update?: Task[];
    delete?: number[];
  } | null;
  preparePreviewData: () => PreviewData;
  handleApplySuggestions: () => Promise<void>;
  isApplyingAI: boolean;
  projectsData: { id: number; name: string }[];
  onCancelSuggestions: () => void;
}

export function AIPlannerWithPreview({
  chatMessages,
  chatInput,
  isAiLoading,
  setChatInput,
  sendChatMessage,
  onClose,
  pendingSuggestions,
  preparePreviewData,
  handleApplySuggestions,
  isApplyingAI,
  projectsData,
  onCancelSuggestions,
}: AIPlannerWithPreviewProps) {
  const hasPendingSuggestions =
    pendingSuggestions &&
    ((pendingSuggestions.create?.length || 0) > 0 ||
      (pendingSuggestions.update?.length || 0) > 0 ||
      (pendingSuggestions.delete?.length || 0) > 0);

  return (
    <div className="flex h-full">
      {/* AI Planner - always visible */}
      <div
        className={`${
          hasPendingSuggestions ? "w-2/5 min-w-[350px]" : "w-full"
        } border-r border-border`}
      >
        <AIPlanner
          chatMessages={chatMessages}
          chatInput={chatInput}
          isAiLoading={isAiLoading}
          setChatInput={setChatInput}
          sendChatMessage={sendChatMessage}
          onClose={onClose}
        />
      </div>

      {/* AI Preview - only visible when there are pending suggestions */}
      {hasPendingSuggestions && (
        <div className="w-3/5 min-w-[400px]">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium">AI Suggested Changes</h2>
            </div>
            <div className="flex-1 p-4">
              <AIPreview
                previewData={preparePreviewData()}
                onApply={handleApplySuggestions}
                onCancel={onCancelSuggestions}
                isApplying={isApplyingAI}
                allProjects={projectsData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
