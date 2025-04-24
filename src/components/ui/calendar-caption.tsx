
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { CaptionProps } from "react-day-picker";

export function CalendarCaption({ 
  displayMonth,
  goToMonth,
  className,
}: CaptionProps) {
  const handlePrevious = () => {
    const prevMonth = new Date(displayMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    goToMonth(prevMonth);
  };

  const handleNext = () => {
    const nextMonth = new Date(displayMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    goToMonth(nextMonth);
  };

  return (
    <div className={cn("flex justify-between pt-1 relative items-center", className)}>
      <Button
        variant="outline"
        className={cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        )}
        onClick={handlePrevious}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="text-sm font-medium">
        {displayMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </span>
      <Button
        variant="outline"
        className={cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        )}
        onClick={handleNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
