// Dashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { format, addDays, subDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import TaskEditingModal from "@/components/TaskEditingModal";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DatesNavigation } from "@/components/dashboard/DatesNavigation";
import { DragAndDropContext } from "@/components/dashboard/DragAndDropContext";
// import { AIPreviewDialog } from "@/components/dashboard/AIPreviewDialog";
import { TasksContainer } from "@/components/dashboard/TasksContainer";
import { useAIPlanning } from "@/hooks/useAIPlanning";
import { useTaskManager } from "@/hooks/useTaskManager";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: projectsData = [] } = useProjects();

  // State
  const [centerDate, setCenterDate] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Calculate the three days to display
  const displayDates = useMemo(() => {
    const prevDate = subDays(centerDate, 1);
    const nextDate = addDays(centerDate, 1);
    return [prevDate, centerDate, nextDate];
  }, [centerDate]);

  // Use the consolidated task manager hook
  const {
    tasks,
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
    // getTasksForDate, // Currently unused
  } = useTaskManager(displayDates, selectedProjectId);

  // AI Planning hook
  const {
    chatMessages,
    chatInput,
    isAiLoading,
    // isPreviewOpen, // No longer needed since preview is in sidebar
    pendingSuggestions,
    setIsPreviewOpen,
    setPendingSuggestions,
    setChatInput,
    sendChatMessage,
    handleApplySuggestions,
    preparePreviewData,
    isApplyingAI,
  } = useAIPlanning(centerDate, tasks, fetchAllTasks);

  // Handle canceling AI suggestions
  const handleCancelSuggestions = () => {
    setIsPreviewOpen(false);
    setPendingSuggestions(null); // Clear the pending suggestions
  };

  // Fetch tasks on mount or when user changes
  useEffect(() => {
    if (user && !isLoading) {
      fetchAllTasks();
    }
  }, [user, isLoading, fetchAllTasks]);

  // If tasks are loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      chatMessages={chatMessages}
      chatInput={chatInput}
      isAiLoading={isAiLoading}
      setChatInput={setChatInput}
      sendChatMessage={sendChatMessage}
      onProjectSelect={setSelectedProjectId}
      selectedProjectId={selectedProjectId}
      pendingSuggestions={pendingSuggestions}
      preparePreviewData={preparePreviewData}
      handleApplySuggestions={handleApplySuggestions}
      isApplyingAI={isApplyingAI}
      projectsData={projectsData}
      onCancelSuggestions={handleCancelSuggestions}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="relative py-2">
          <DatesNavigation
            centerDate={centerDate}
            setCenterDate={setCenterDate}
            displayDates={displayDates}
          />
        </div>

        <div className="flex flex-1 justify-start overflow-auto p-4 gap-1">
          <DragAndDropContext
            localTasks={localTasks}
            setLocalTasks={setLocalTasks}
            updateTask={updateTask}
            fetchAllTasks={fetchAllTasks}
          >
            {/* Render three days */}
            {displayDates.map((date) => {
              const formattedDate = format(date, "yyyy-MM-dd");
              return (
                <div
                  key={formattedDate}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-lg overflow-auto"
                >
                  <div>
                    <TasksContainer
                      localTasks={localTasks[formattedDate] || []}
                      containerId={formattedDate}
                      currentDate={date}
                      onTaskChange={handleTaskChange}
                      onTaskDelete={handleTaskDelete}
                      onTaskEdit={handleTaskEdit}
                      onAddTask={() => handleAddTask(date)}
                    />
                  </div>
                </div>
              );
            })}
          </DragAndDropContext>
        </div>
      </div>

      {/* Task editing modal */}
      {isTaskModalOpen && (
        <TaskEditingModal
          visible={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          task={taskToEdit || undefined}
          onDelete={handleTaskDelete}
        />
      )}

      {/* AI Preview Dialog - Now integrated into sidebar */}
      {/* <AIPreviewDialog
        isOpen={isPreviewOpen}
        setIsOpen={setIsPreviewOpen}
        pendingSuggestions={pendingSuggestions}
        preparePreviewData={preparePreviewData}
        handleApplySuggestions={handleApplySuggestions}
        isApplyingAI={isApplyingAI}
        projectsData={projectsData}
      /> */}
    </DashboardLayout>
  );
}
