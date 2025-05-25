import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

interface DateNavigationProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

export function DateNavigation({
  currentDate,
  setCurrentDate,
}: DateNavigationProps) {
  const goToPreviousDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex items-center gap-4 justify-between">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousDay}
        aria-label="Previous Day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        onClick={goToToday}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        <span className="font-medium">
          {format(currentDate, "EEEE, MMMM d")}
        </span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextDay}
        aria-label="Next Day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
