import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AIPlannerWithPreview } from "@/components/dashboard/AIPlannerWithPreview";
import { ChatMessage, PreviewData } from "@/components/dashboard/types";
import { Task } from "@/types";

interface DashboardSidebarProps {
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

const DashboardSidebar = ({
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
}: DashboardSidebarProps) => {
  const { data: projects = [] } = useProjects();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

  // Check if there are pending suggestions to determine width
  const hasPendingSuggestions =
    pendingSuggestions &&
    ((pendingSuggestions.create?.length || 0) > 0 ||
      (pendingSuggestions.update?.length || 0) > 0 ||
      (pendingSuggestions.delete?.length || 0) > 0);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full w-64 p-4 space-y-6">
      {/* Logo and dropdown */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Bulti</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* AI Planner Button */}
      <div>
        <Sheet open={isPlannerOpen} onOpenChange={setIsPlannerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Planner
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className={`${
              hasPendingSuggestions
                ? "w-[90vw] max-w-[1200px] min-w-[800px]"
                : "w-[400px]"
            } p-0`}
            showClose={false}
          >
            <AIPlannerWithPreview
              chatMessages={chatMessages}
              chatInput={chatInput}
              isAiLoading={isAiLoading}
              setChatInput={setChatInput}
              sendChatMessage={sendChatMessage}
              onClose={() => setIsPlannerOpen(false)}
              pendingSuggestions={pendingSuggestions}
              preparePreviewData={preparePreviewData}
              handleApplySuggestions={handleApplySuggestions}
              isApplyingAI={isApplyingAI}
              projectsData={projectsData}
              onCancelSuggestions={onCancelSuggestions}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-auto">
        <h2 className="font-medium mb-2 text-sm text-muted-foreground">
          PROJECTS
        </h2>
        <div className="space-y-1">
          <Button
            variant={selectedProjectId === null ? "secondary" : "ghost"}
            className="w-full justify-start text-sm font-normal"
            onClick={() => onProjectSelect(null)}
          >
            All Projects
          </Button>
          {projects.map((project) => (
            <Button
              key={project.id}
              variant="ghost"
              className={`w-full justify-start text-sm font-normal ${
                selectedProjectId === project.id
                  ? "bg-white dark:bg-slate-950 shadow-inner border border-slate-200 dark:border-slate-800"
                  : ""
              }`}
              onClick={() => onProjectSelect(project.id)}
            >
              {project.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
