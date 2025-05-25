"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  onCreateNew?: (value: string) => void | Promise<void>;
  createNewPlaceholder?: string;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options",
  className,
  onCreateNew,
  createNewPlaceholder = "Create new...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newItemValue, setNewItemValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Ensure options is always an array to prevent iteration errors
  const safeOptions = Array.isArray(options) ? options : [];

  // Filter options based on search query
  const filteredOptions = safeOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleCreateNew = () => {
    if (!newItemValue.trim() || !onCreateNew) return;

    onCreateNew(newItemValue.trim());
    setNewItemValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateNew();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between px-3 py-2 h-auto min-h-10"
          >
            <div className="flex flex-wrap gap-1 mr-2">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((value) => {
                  const option = safeOptions.find((o) => o.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {option?.label || value}
                    </Badge>
                  );
                })
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-2"
          align="start"
        >
          <div className="space-y-2">
            <Input
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <ScrollArea className="h-60">
              <div className="space-y-1 pt-1">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No options found.
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center px-2 py-2 rounded-md cursor-pointer text-sm",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                        onClick={() => handleSelect(option.value)}
                      >
                        <div className="flex-1">{option.label}</div>
                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-primary-foreground flex items-center justify-center">
                            <X className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {onCreateNew && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    placeholder={createNewPlaceholder}
                    className="flex-1"
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNew}
                    disabled={!newItemValue.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MultiSelect;
