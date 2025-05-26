import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIPreview } from "@/components/dashboard/AIPreview";
import { PreviewData } from "@/components/dashboard/types";
import { Task } from "@/types";

interface AIPreviewDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  pendingSuggestions: {
    create?: Omit<Task, "id">[];
    update?: Task[];
    delete?: number[];
  } | null;
  preparePreviewData: () => PreviewData;
  handleApplySuggestions: () => Promise<void>;
  isApplyingAI: boolean;
  projectsData: any[];
}

export const AIPreviewDialog: React.FC<AIPreviewDialogProps> = ({
  isOpen,
  setIsOpen,
  pendingSuggestions,
  preparePreviewData,
  handleApplySuggestions,
  isApplyingAI,
  projectsData,
}) => {
  return (
    <Dialog
      open={
        isOpen &&
        !!pendingSuggestions &&
        ((pendingSuggestions.create?.length ?? 0) > 0 ||
          (pendingSuggestions.update?.length ?? 0) > 0 ||
          (pendingSuggestions.delete?.length ?? 0) > 0)
      }
      onOpenChange={setIsOpen}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Suggested Changes</DialogTitle>
        </DialogHeader>
        {pendingSuggestions && (
          <AIPreview
            previewData={preparePreviewData()}
            onApply={handleApplySuggestions}
            onCancel={() => setIsOpen(false)}
            isApplying={isApplyingAI}
            allProjects={projectsData}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
