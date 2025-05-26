import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./types";
import { X } from "lucide-react";

interface AIPlannerProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  isAiLoading: boolean;
  setChatInput: (value: string) => void;
  sendChatMessage: () => void;
  onClose?: () => void;
}

export function AIPlanner({
  chatMessages,
  chatInput,
  isAiLoading,
  setChatInput,
  sendChatMessage,
  onClose,
}: AIPlannerProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-medium">AI Planner</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-grow overflow-auto">
        <div className="space-y-6 py-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ask the AI to help you plan your tasks!</p>
              <p className="text-sm mt-2">Try saying something like:</p>
              <p className="text-sm italic mt-1">
                "Create 3 tasks for my website project"
              </p>
              <p className="text-sm italic">
                "Help me plan my day for tomorrow"
              </p>
            </div>
          )}

          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`py-4 px-5 ${
                message.role === "user"
                  ? "bg-primary/5 rounded-lg ml-6"
                  : "bg-muted/50 rounded-lg mr-6"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.role === "user" ? (
                  <div className="font-bold text-xs text-primary mb-1">You</div>
                ) : (
                  <div className="font-bold text-xs text-primary mb-1">
                    Assistant
                  </div>
                )}
                {message.content}
              </div>
            </div>
          ))}

          {isAiLoading && (
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>
      </ScrollArea>

      {/* Chat input */}
      <div className="p-4 border-t border-border">
        <div className="flex">
          <Textarea
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 min-h-[80px] mr-2 bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
          />
          <Button
            onClick={sendChatMessage}
            disabled={!chatInput.trim() || isAiLoading}
            className="self-end"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
