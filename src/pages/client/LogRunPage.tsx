import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, Timer, MapPin, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RunLog, logRunActivity } from '@/services/activity-logging-service';

const LogRunPage: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!distance || !duration) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const runData: RunLog = {
        log_date: date,
        distance: parseFloat(distance),
        duration: parseInt(duration, 10),
        location,
        notes
      };
      
      const result = await logRunActivity(runData);
      
      if (result) {
        navigate('/client-dashboard/workouts');
      }
    } catch (error) {
      console.error('Error logging run:', error);
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
          <h1 className="text-2xl font-bold">Log Run Activity</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="run-date">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="run-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(d) => d > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="distance">Distance (miles)</Label>
            <div className="relative">
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
              <span className="absolute left-3 top-2.5 text-muted-foreground">mi</span>
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
                placeholder="Park, trail, neighborhood, etc."
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
              placeholder="How was your run? How did you feel?"
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
        </div>
      </form>
    </div>
  );
};

export default LogRunPage;
