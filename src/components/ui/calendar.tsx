import React, { useState, useEffect } from "react";
import { isMobile } from "react-device-detect"; // npm install react-device-detect
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";

export const DatePicker = ({
  date,
  setDate
}: {
  date: Date;
  setDate: (date: Date) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseISO(e.target.value);
    setDate(newDate);
  };

  if (isMobile) {
    // Native HTML5 date input on mobile
    return (
      <input
        type="date"
        value={format(date, "yyyy-MM-dd")}
        onChange={handleNativeChange}
        className="w-full rounded-md border px-3 py-2 text-sm"
        max={format(new Date(), "yyyy-MM-dd")}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false} trapFocus={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" forceMount>
        <div onMouseDown={(e) => e.preventDefault()}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selected) => {
              if (selected) {
                setDate(selected);
                setOpen(false);
              }
            }}
            initialFocus
            disabled={(d) => d > new Date()}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
