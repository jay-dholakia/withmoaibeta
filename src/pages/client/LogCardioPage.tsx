
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Timer, Activity, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CardioLog, logCardioActivity } from '@/services/activity-logging-service';
import { toast } from 'sonner';

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

const LogCardioPage: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [activityType, setActivityType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        workout_type: 'cardio' // Add workout_type
      };
      
      console.log("Submitting cardio data:", cardioData);
      const result = await logCardioActivity(cardioData);
      
      if (result) {
        toast.success("Cardio activity logged successfully!");
        navigate('/client-dashboard/workouts');
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
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setDatePickerOpen(false);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/client-dashboard/workouts')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Log Cardio Activity</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
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
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
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
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/client-dashboard/workouts')}
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
        </div>
      </form>
    </div>
  );
};

export default LogCardioPage;
