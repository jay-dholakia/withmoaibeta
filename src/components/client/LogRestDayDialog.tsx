
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(new Date());

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
    setNotes("");
    setTempSelectedDate(new Date());
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      setTempSelectedDate(selected);
    }
  };

  const confirmDateSelection = () => {
    if (tempSelectedDate) {
      setDate(tempSelectedDate);
      setCalendarOpen(false);
    }
  };
  
  // Stop propagation to prevent the dialog from closing the calendar popup
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
              <Popover
                open={calendarOpen}
                onOpenChange={setCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="rest-date"
                    variant="outline"
                    type="button"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  onClick={handleCalendarClick}
                >
                  <div className="p-0">
                    <Calendar
                      mode="single"
                      selected={tempSelectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={(date) => date > new Date()}
                      className="pointer-events-auto"
                    />
                    <div className="flex justify-end gap-2 p-2 border-t">
                      <Button
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCalendarOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={confirmDateSelection}
                      >
                        Confirm
                      </Button>
                    </div>
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
