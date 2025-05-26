import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays } from "date-fns";
import { DateNavigationBar } from "./DateNavigationBar";

interface DatesNavigationProps {
  centerDate: Date;
  setCenterDate: (date: Date) => void;
  displayDates: Date[];
}

export const DatesNavigation: React.FC<DatesNavigationProps> = ({
  centerDate,
  setCenterDate,
  displayDates,
}) => {
  // Navigate between days
  const goToPreviousDays = () => {
    setCenterDate(subDays(centerDate, 1));
  };

  const goToNextDays = () => {
    setCenterDate(addDays(centerDate, 1));
  };

  return (
    <div className="flex items-center justify-around w-full">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 z-10"
        onClick={goToPreviousDays}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {displayDates.map((date) => (
        <DateNavigationBar
          key={format(date, "yyyy-MM-dd")}
          centerDate={date}
          setCenterDate={setCenterDate}
        />
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 z-10"
        onClick={goToNextDays}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
