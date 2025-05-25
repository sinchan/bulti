import React from "react";

interface ProjectBadgeProps {
  projectName: string;
  isNewProject: boolean;
  isNewlyAssigned?: boolean;
}

export function ProjectBadge({
  projectName,
  isNewProject,
  isNewlyAssigned = false,
}: ProjectBadgeProps) {
  const getClassNames = () => {
    if (isNewProject) {
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    } else if (isNewlyAssigned) {
      return "bg-amber-100 text-amber-800 border border-amber-200";
    } else {
      return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className={`px-2 py-0.5 text-xs rounded-full ${getClassNames()}`}>
      {projectName}
      {isNewProject && <span className="ml-1 text-emerald-600">+</span>}
      {!isNewProject && isNewlyAssigned && <span className="ml-1">+</span>}
    </div>
  );
}
