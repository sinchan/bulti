// FullscreenTaskView.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@radix-ui/react-icons";

interface FullscreenTaskViewProps {
  task: Task;
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const FullscreenTaskView: React.FC<FullscreenTaskViewProps> = ({
  task,
  isVisible,
  onClose,
  onComplete,
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && isVisible) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isVisible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isVisible, onClose]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 transition-all duration-500 ease-out cursor-default ${
        isVisible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
      style={{
        backdropFilter: isVisible ? "blur(0px)" : "blur(8px)",
      }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-6 right-6 rounded-full hover:bg-muted transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
        style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
        onClick={onClose}
      >
        <XMarkIcon className="h-5 w-5" />
      </Button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-8">
        {/* Task title */}
        <h1
          className={`text-6xl md:text-7xl lg:text-8xl font-thin text-foreground leading-tight transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
        >
          {task.title}
        </h1>

        {/* Timer */}
        <div
          className={`text-2xl md:text-3xl font-light text-muted-foreground tabular-nums transition-all duration-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
        >
          {formatTime(timeElapsed)}
        </div>

        {/* Done button */}
        <Button
          variant="outline"
          size="lg"
          className={`px-8 py-3 text-lg rounded-full transition-all duration-500 ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95"
          }`}
          style={{ transitionDelay: isVisible ? "500ms" : "0ms" }}
          onClick={onComplete}
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
};

export default FullscreenTaskView;
