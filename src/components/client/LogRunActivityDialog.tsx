
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Timer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RunLog, logRunActivity } from "@/services/activity-logging-service";
import { useIsMobile } from "@/hooks/use-mobile";

interface LogRunActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LogRunActivityDialog: React.FC<LogRunActivityDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!distance || !duration) {
      return;
    }
    
    setIsSubmitting(true);
    
    const runData: RunLog = {
      log_date: date,
      distance: parseFloat(distance),
      duration: parseInt(duration, 10),
      location,
      notes,
      workout_type: 'running'
    };
    
    try {
      const result = await logRunActivity(runData);
      
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
    setDistance("");
    setDuration("");
    setLocation("");
    setNotes("");
    setTempSelectedDate(new Date());
  };
  
  // Reset form when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Handle date selection safely
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setTempSelectedDate(selectedDate);
    }
  };
  
  const confirmDateSelection = () => {
    if (tempSelectedDate) {
      setDate(tempSelectedDate);
      setDatePickerOpen(false);
    }
  };
  
  // Stop propagation to prevent the dialog from closing the calendar popup
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <span role="img" aria-label="running" className="text-lg">🏃</span>
            <span>Log Running Activity</span>
          </DialogTitle>
          <DialogDescription>
            Record your running activity details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="run-date">Date</Label>
              <Popover 
                open={datePickerOpen} 
                onOpenChange={setDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="run-date"
                    type="button"
                    variant="outline"
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
                  sideOffset={4}
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
                        onClick={() => setDatePickerOpen(false)}
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
              <Label htmlFor="distance">Distance (miles)</Label>
              <div className="relative">
                <span role="img" aria-label="ruler" className="absolute left-3 top-2.5 text-muted-foreground text-sm">📏</span>
                <Input
                  id="distance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <div className="relative">
                <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Location (optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Park, trail, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How was your run?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Save Run"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
