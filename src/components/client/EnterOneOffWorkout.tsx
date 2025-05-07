
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, Timer, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { WORKOUT_TYPES } from './WorkoutTypeIcon';

const EnterOneOffWorkout = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutType, setWorkoutType] = useState('strength');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const workoutData = {
        title,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        workout_type: workoutType,
        completed_at: date.toISOString()
      };
      
      const result = await createOneOffWorkoutCompletion(workoutData);
      toast.success('Workout logged successfully!');
      
      // Dispatch workout-completed event to update the UI immediately
      document.dispatchEvent(new CustomEvent('workout-completed'));
      
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout. Please try again.');
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
          <h1 className="text-2xl font-bold">Log Custom Workout</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="workout-date">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="workout-date"
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
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Strength Training, Yoga Session"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="workoutType">Workout Type</Label>
            <Select 
              value={workoutType} 
              onValueChange={setWorkoutType}
            >
              <SelectTrigger className="text-left">
                <SelectValue placeholder="Select workout type" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {typeof type.icon === 'string' ? 
                        <span>{type.icon}</span> : 
                        type.icon
                      }
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your workout"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? How did you feel?"
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
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? "Saving..." : "Log Workout"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnterOneOffWorkout;
