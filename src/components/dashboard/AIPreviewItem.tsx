import React from "react";
import { Task } from "@/types";
import { ProjectBadge } from "./ProjectBadge";

interface AIPreviewTaskProps {
  task: Omit<Task, "id"> | Task;
  type: "create" | "update" | "delete";
  original?: Task;
  allProjects: any[]; // All existing projects
}

export function AIPreviewItem({
  task,
  type,
  original,
  allProjects,
}: AIPreviewTaskProps) {
  const getBgColor = () => {
    switch (type) {
      case "create":
        return "border-green-600 bg-card/80 text-green-700 dark:text-green-400 border-dashed border";
      case "update":
        return "border-amber-200 bg-card/60 text-amber-700 dark:text-amber-400 border-dashed border";
      case "delete":
        return "border-red-200 bg-card/60 text-red-700 dark:text-red-400 border-dashed border";
    }
  };

  const isProjectNew = (projectName: string) => {
    return !allProjects.some(
      (p) => p.name.toLowerCase() === projectName.toLowerCase()
    );
  };

  const isProjectNewlyAssigned = (projectName: string) => {
    if (!original || !original.projects) return true;

    return !original.projects.some(
      (p) => p.name.toLowerCase() === projectName.toLowerCase()
    );
  };

  return (
    <div className={`p-4 rounded-lg border ${getBgColor()}`}>
      {/* Title */}
      <div className="font-medium text-sm">
        {type === "update" && original && (
          <>
            <span
              className={
                original.title !== task.title
                  ? "line-through text-muted-foreground"
                  : ""
              }
            >
              {original.title}
            </span>
            {original.title !== task.title && (
              <span className="text-amber-700 dark:text-amber-400"> → {task.title}</span>
            )}
          </>
        )}
        {type !== "update" && (
          <span className={type === "delete" ? "line-through" : ""}>
            {task.title}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <div className="text-xs font-light text-muted-foreground mt-1">
          {type === "update" && original && (
            <>
              <span
                className={
                  original.notes !== task.description
                    ? "line-through text-muted-foreground"
                    : ""
                }
              >
                {original.notes}
              </span>
              {original.notes !== task.description && (
                <span className="text-amber-700 dark:text-amber-400"> → {task.description}</span>
              )}
            </>
          )}
          {type !== "update" && (
            <span
              className={type === "delete" ? "line-through text-muted-foreground" : ""}
            >
              {task.description}
            </span>
          )}
        </div>
      )}

      {/* Estimated Time */}
      {task.estimatedTime > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {type === "update" && original && (
            <>
              <span
                className={
                  original.estimatedTime !== task.estimatedTime
                    ? "line-through"
                    : ""
                }
              >
                {original.estimatedTime} min
              </span>
              {original.estimatedTime !== task.estimatedTime && (
                <span className="text-amber-700 dark:text-amber-400">
                  {" "}
                  → {task.estimatedTime} min
                </span>
              )}
            </>
          )}
          {type !== "update" && (
            <span
              className={type === "delete" ? "line-through text-muted-foreground" : ""}
            >
              {task.estimatedTime} min
            </span>
          )}
        </div>
      )}

      {/* Projects */}
      {task.projects && task.projects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.projects.map((project, i) => {
            const projectName =
              typeof project === "string" ? project : project.name;
            const isNew = isProjectNew(projectName);
            const isNewlyAssigned =
              type === "update" && !isNew
                ? isProjectNewlyAssigned(projectName)
                : false;

            return (
              <ProjectBadge
                key={i}
                projectName={projectName}
                isNewProject={isNew}
                isNewlyAssigned={isNewlyAssigned}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
