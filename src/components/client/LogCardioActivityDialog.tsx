
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Timer, Activity } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CardioLog, logCardioActivity } from "@/services/activity-logging-service";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const CARDIO_TYPES = [
  'Cycling',
  'Swimming',
  'Elliptical',
  'Rowing',
  'Stair Climber',
  'HIIT',
  'Dancing',
  'Walking',
  'Other'
];

interface LogCardioActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LogCardioActivityDialog: React.FC<LogCardioActivityDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [activityType, setActivityType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityType || !duration) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const parsedDuration = parseInt(duration, 10);
      
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        toast.error("Please enter a valid duration");
        setIsSubmitting(false);
        return;
      }
      
      const cardioData: CardioLog = {
        log_date: date,
        activity_type: activityType,
        duration: parsedDuration,
        notes,
        workout_type: 'cardio'
      };
      
      console.log("Submitting cardio data from dialog:", cardioData);
      const result = await logCardioActivity(cardioData);
      
      if (result) {
        console.log("Cardio activity logged successfully:", result);
        toast.success("Cardio activity logged successfully!");
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to log cardio activity");
      }
    } catch (error) {
      console.error('Error logging cardio activity:', error);
      toast.error("An error occurred while saving your activity");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setDate(new Date());
    setActivityType("");
    setDuration("");
    setNotes("");
    setTempSelectedDate(new Date());
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

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
  
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <Activity className="h-5 w-5" />
            <span>Log Cardio Activity</span>
          </DialogTitle>
          <DialogDescription>
            Record your cardio workout details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cardio-date">Date</Label>
              <Popover 
                open={datePickerOpen} 
                onOpenChange={setDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="cardio-date"
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
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select
                value={activityType}
                onValueChange={setActivityType}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {CARDIO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How was your workout?"
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
              className="outline-none focus:outline-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 outline-none focus:outline-none"
            >
              {isSubmitting ? "Saving..." : "Save Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
