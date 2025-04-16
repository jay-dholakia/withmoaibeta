
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Armchair } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RestLog, logRestDay } from "@/services/activity-logging-service";

interface LogRestDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LogRestDayDialog: React.FC<LogRestDayDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const restData: RestLog = {
      log_date: date,
      notes
    };

    try {
      const result = await logRestDay(restData);

      if (result) {
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDate(new Date());
    setTempSelectedDate(new Date());
    setNotes("");
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      setTempSelectedDate(selected); // do not commit yet
      setDate(selected); // Instead, commit right away
      setDatePickerOpen(false); // Close the popover
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Armchair className="h-5 w-5" />
            <span>Log Rest Day</span>
          </DialogTitle>
          <DialogDescription>
            Record your rest day and any notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rest-date">Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="rest-date"
                    variant="outline"
                    onClick={() => setDatePickerOpen((prev) => !prev)}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-3"
                  align="start"
                >
                  <div>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={(d) => d > new Date()}
                      className="pointer-events-auto"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="What did you do on your rest day? How are you feeling?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? "Saving..." : "Log Rest Day"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
