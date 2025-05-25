"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/useProjects";
import { Task } from "@/types";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Circle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TaskEditingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, "id">) => void | Promise<void>;
  task?: Partial<Task>;
  onDelete?: (id: number) => void;
}

const TaskEditingModal: React.FC<TaskEditingModalProps> = ({
  visible,
  onClose,
  onSave,
  task,
  onDelete,
}) => {
  // Form state
  const [form, setForm] = useState({
    id: task?.id as number | undefined,
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    estimatedTime: 30,
    notes: "",
    completed: false,
  });

  // Date state for the calendar
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Projects management
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Fetch projects data
  const {
    data: projectsData = [], // Default to empty array to avoid undefined errors
    createProject,
    refetch: refetchProjects,
  } = useProjects();

  // Convert projects to options format for MultiSelect
  const projectOptions: Option[] = React.useMemo(() => {
    return Array.isArray(projectsData) && projectsData.length > 0
      ? projectsData.map((p) => ({ value: p.name, label: p.name }))
      : [];
  }, [projectsData]);

  // Reset form to defaults
  const resetForm = React.useCallback(() => {
    setForm({
      id: undefined,
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      estimatedTime: 30,
      notes: "",
      completed: false,
    });
    setSelectedProjects([]);
  }, []);

  // Initialize form with task data when editing
  useEffect(() => {
    if (!visible) return;

    if (task?.id) {
      // Editing existing task
      try {
        let taskDate: Date;

        if (task.date) {
          if (typeof task.date === "string") {
            // Parse the date string and preserve UTC
            const [datePart] = task.date.split("T");
            taskDate = new Date(datePart + "T12:00:00Z");
          } else {
            taskDate = task.date as Date;
          }
        } else {
          taskDate = new Date();
        }

        setForm({
          id: task.id,
          title: task.title || "",
          date: format(taskDate, "yyyy-MM-dd"),
          estimatedTime: task.estimatedTime || 30,
          notes: task.notes || (task.description as string) || "",
          completed: !!task.completed,
        });

        // Set calendar date
        setDate(taskDate);

        // Set selected projects
        setSelectedProjects(
          Array.isArray(task.projects) ? task.projects.map((p) => p.name) : []
        );
      } catch (error) {
        console.error("Error setting form data:", error);
        resetForm();
      }
    } else {
      // Creating new task
      resetForm();
      setDate(new Date());
    }
  }, [task, visible]);

  // Update date from calendar selection
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;

    setDate(newDate);
    setForm({
      ...form,
      date: format(newDate, "yyyy-MM-dd"),
    });
  };

  // Handle creating a new project
  const handleCreateProject = React.useCallback(
    async (name: string) => {
      if (!name) return;

      // Check if already selected
      if (selectedProjects.includes(name)) {
        toast.error(`Project "${name}" already selected`);
        return;
      }

      try {
        // Check if project exists
        const exists = projectOptions.some(
          (p) => p.value.toLowerCase() === name.toLowerCase()
        );

        if (!exists) {
          // Create new project in database
          await createProject(name);
          await refetchProjects();
          toast.success(`Created project: ${name}`);
        }

        // Add to selected projects
        setSelectedProjects((prev) => [...prev, name]);
      } catch (error) {
        toast.error("Failed to create project");
        console.error(error);
      }
    },
    [selectedProjects, projectOptions, createProject, refetchProjects]
  );

  // Handle save
  const handleSave = React.useCallback(async () => {
    // Validate form
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (selectedProjects.length === 0) {
      toast.error("At least one project is required");
      return;
    }

    // Format date properly to preserve UTC
    const dateStr = form.date;
    let formattedDate: Date;

    try {
      // Create a UTC date at noon to avoid timezone issues
      const [year, month, day] = dateStr.split("-").map(Number);
      formattedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } catch (e) {
      console.error("Error parsing date:", e);
      formattedDate = new Date();
    }

    // Map projects to correct format
    const mappedProjects = selectedProjects.map((name) => {
      const existingProject = projectsData.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );

      return existingProject && typeof existingProject.id === "number"
        ? { id: existingProject.id, name }
        : { id: -1, name };
    });

    try {
      // For new tasks, remove the ID property completely
      if (typeof form.id === "undefined") {
        const newTaskData = {
          title: form.title,
          date: formattedDate,
          notes: form.notes,
          completed: form.completed,
          estimatedTime: form.estimatedTime,
          order: 0,
          userId: "",
          projects: mappedProjects,
        };

        await onSave(newTaskData);
      } else {
        // For existing tasks, include the ID
        const updateTaskData: Task = {
          id: form.id,
          title: form.title,
          date: formattedDate,
          notes: form.notes,
          completed: form.completed,
          estimatedTime: form.estimatedTime,
          order: 0,
          userId: "",
          projects: mappedProjects,
        };

        await onSave(updateTaskData);
      }

      toast.success(`Task ${form.id ? "updated" : "created"}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error saving task: ${errorMessage}`);
      console.error("Save task error:", error);
    }
  }, [form, selectedProjects, projectsData, onSave]);

  // Handle delete
  const handleDelete = React.useCallback(async () => {
    if (!form.id || !onDelete) return;

    try {
      await onDelete(form.id);
      onClose();
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
      console.error("Error deleting task:", error);
    }
  }, [form.id, onDelete]);

  console.log(onDelete);

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <Input
            id="title"
            className="w-full text-lg"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
          />

          {/* Description */}
          <Textarea
            id="notes"
            className="w-full min-h-[180px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add task details here..."
          />

          {/* Date and Duration Row */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      handleDateChange(newDate);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 relative">
              <Input
                id="estimatedTime"
                className="w-full pr-12"
                type="number"
                min="5"
                step="5"
                value={form.estimatedTime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimatedTime: parseInt(e.target.value) || 30,
                  })
                }
                placeholder="Duration"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                mins
              </span>
            </div>

            <Button
              type="button"
              variant={form.completed ? "default" : "outline"}
              onClick={() => setForm({ ...form, completed: !form.completed })}
              className="whitespace-nowrap flex items-center gap-2"
            >
              {form.completed ? (
                <>
                  <Check className="h-4 w-4" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  Incomplete
                </>
              )}
            </Button>
          </div>

          {/* Projects */}
          <MultiSelect
            options={projectOptions}
            selected={selectedProjects}
            onChange={setSelectedProjects}
            placeholder="Select projects"
            onCreateNew={handleCreateProject}
            createNewPlaceholder="Enter project name"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {form.id && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="default" onClick={handleSave}>
            {form.id ? "Update" : "Create"} Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditingModal;
