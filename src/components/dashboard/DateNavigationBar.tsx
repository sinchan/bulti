import { format, isToday } from "date-fns";

interface DateNavigationBarProps {
  centerDate: Date;
  setCenterDate: (date: Date) => void;
}

export const DateNavigationBar: React.FC<DateNavigationBarProps> = ({
  centerDate,
}) => {
  return (
    <div className="p-3">
      <h2 className="text-lg text-center flex items-center justify-center relative">
        <span
          className={`font-medium ${
            isToday(centerDate) ? "text-emerald-500" : ""
          }`}
        >
          {format(centerDate, "EEEE")}
        </span>
        <span
          className={`font-light ml-1.5 ${
            isToday(centerDate) ? "text-emerald-500" : "text-slate-600"
          }`}
        >
          {format(centerDate, "MMM d")}
        </span>
      </h2>
    </div>
  );
};
