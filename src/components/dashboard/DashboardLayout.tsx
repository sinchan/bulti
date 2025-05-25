import React, { ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { ChatMessage, PreviewData } from "@/components/dashboard/types";
import { Task } from "@/types";

interface DashboardLayoutProps {
  children: ReactNode;
  chatMessages: ChatMessage[];
  chatInput: string;
  isAiLoading: boolean;
  setChatInput: (input: string) => void;
  sendChatMessage: () => void;
  onProjectSelect: (projectId: number | null) => void;
  selectedProjectId: number | null;

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

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  chatMessages,
  chatInput,
  isAiLoading,
  setChatInput,
  sendChatMessage,
  onProjectSelect,
  selectedProjectId,
  pendingSuggestions,
  preparePreviewData,
  handleApplySuggestions,
  isApplyingAI,
  projectsData,
  onCancelSuggestions,
}) => {
  return (
    <div className="flex flex-grow h-full bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar
        chatMessages={chatMessages}
        chatInput={chatInput}
        isAiLoading={isAiLoading}
        setChatInput={setChatInput}
        sendChatMessage={sendChatMessage}
        onProjectSelect={onProjectSelect}
        selectedProjectId={selectedProjectId}
        pendingSuggestions={pendingSuggestions}
        preparePreviewData={preparePreviewData}
        handleApplySuggestions={handleApplySuggestions}
        isApplyingAI={isApplyingAI}
        projectsData={projectsData}
        onCancelSuggestions={onCancelSuggestions}
      />
      <div className="flex flex-col flex-grow h-full text-foreground">
        {children}
      </div>
    </div>
  );
};
