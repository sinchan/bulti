import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { PreviewData } from "./types";
import { AIPreviewItem } from "./AIPreviewItem";

interface AIPreviewProps {
  previewData: PreviewData;
  onApply: () => void;
  onCancel: () => void;
  isApplying: boolean;
  allProjects: { id: number; name: string }[]; // All existing projects
}

export function AIPreview({
  previewData,
  onApply,
  onCancel,
  isApplying,
  allProjects,
}: AIPreviewProps) {
  const hasChanges =
    previewData.creates.length > 0 ||
    previewData.updates.length > 0 ||
    previewData.deletes.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="space-x-4 flex justify-end mt-4 gap-2">
          <Button
            onClick={onApply}
            disabled={isApplying || !hasChanges}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="h-4 w-4 mr-1" />
            Apply Changes
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isApplying}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {hasChanges ? (
          <div className="space-y-6">
            {/* New Tasks */}
            {previewData.creates.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">New Tasks</h3>
                <div className="space-y-3">
                  {previewData.creates.map((task, idx) => (
                    <AIPreviewItem
                      key={`create-${idx}`}
                      task={task}
                      type="create"
                      allProjects={allProjects}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Updated Tasks */}
            {previewData.updates.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Updated Tasks</h3>
                <div className="space-y-3">
                  {previewData.updates.map(({ original, updated }) => (
                    <AIPreviewItem
                      key={`update-${original.id}`}
                      task={updated}
                      type="update"
                      original={original}
                      allProjects={allProjects}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Deleted Tasks */}
            {previewData.deletes.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Deleted Tasks</h3>
                <div className="space-y-3">
                  {previewData.deletes.map((task) => (
                    <AIPreviewItem
                      key={`delete-${task.id}`}
                      task={task}
                      type="delete"
                      allProjects={allProjects}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No changes to preview</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
