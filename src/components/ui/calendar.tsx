
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
// CustomComponents might be deprecated or changed, ensure it's the correct import for v9 if issues arise.
// For v9, DayPickerProps might be a more direct type import if needed.
import { DayPicker, type DayPickerProps, type CustomComponents } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Using DayPickerProps directly might be more explicit for v9
export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components, // Destructure components from props to merge later
  ...props
}: CalendarProps) {
  // Define the custom Chevron component based on v9 guide
  const customComponents  = {
    Chevron: ({ orientation, ...rest }) =>
      orientation === 'left' ? (
        <ChevronLeft className="h-4 w-4" {...rest} />
      ) : (
        <ChevronRight className="h-4 w-4" {...rest} />
      ),
    ...components, // Merge with any components passed via props
  }

  return (
    <DayPicker
      mode="single"
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        // months already uses flex
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        // Keep caption relative for positioning context, center label
        caption: "flex justify-center items-center pt-1 mb-4 relative", // Removed justify-between, added justify-center
        caption_label: "text-sm font-medium dark:text-gray-100", // No change needed
        // Position nav absolutely to the right
        nav: "flex items-center space-x-1 absolute right-1", // Added absolute right-1
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        ),
        nav_button_previous: "", // Keep empty
        nav_button_next: "", // Keep empty
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] dark:text-gray-400",
        row: "flex w-full mt-2",
        // Updated class names for v9
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:text-gray-100",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 dark:hover:bg-gray-700 dark:hover:text-white"
        ),
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
        today: "bg-accent text-accent-foreground dark:bg-gray-600 dark:text-gray-100",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30 dark:text-gray-500",
        disabled: "text-muted-foreground opacity-50 dark:text-gray-600",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100",
        hidden: "invisible",
        ...classNames,
      }}
      components={customComponents} // Use the updated components object
      {...props} // Pass remaining props, ensure parent passes onSelect if using selected
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
