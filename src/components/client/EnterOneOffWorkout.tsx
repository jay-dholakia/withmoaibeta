import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { WORKOUT_TYPES, WorkoutType } from './WorkoutTypeIcon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const EnterOneOffWorkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('one_off'); // Default to one_off
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  
  // Parse date from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    
    if (dateParam) {
      try {
        // Parse the date from yyyy-MM-dd format
        const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      } catch (error) {
        console.error('Error parsing date from URL:', error);
      }
    }
  }, [location.search]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const workoutData = {
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        rating,
        workout_type: workoutType,
        completed_at: date ? date.toISOString() : new Date().toISOString()
      };
      
      if (workoutType === 'cardio') {
        workoutData.distance = distance.trim() || undefined;
        workoutData.duration = duration.trim() || undefined;
        workoutData.location = location.trim() || undefined;
      }
      
      await createOneOffWorkoutCompletion(workoutData);
      
      toast.success('Workout logged successfully!');
      
      // Refresh the workout history if we're coming from there
      const refreshButton = document.getElementById('refresh-workout-history');
      if (refreshButton) {
        refreshButton.click();
      }
      
      // Navigate back
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/client-dashboard/workouts');
  };
  
  const handleRatingChange = (newRating: string) => {
    setRating(parseInt(newRating));
  };
  
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-4">
        <Button
          variant="ghost" 
          size="sm"
          className="text-muted-foreground"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Workouts
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Enter Custom Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-left block">
                Workout Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Morning Run, Gym Session"
                required
                className="text-left border border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-left block">
                Date <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border border-gray-200",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-left block">
                Workout Type
              </label>
              <Select 
                defaultValue="one_off" 
                onValueChange={(value) => setWorkoutType(value as WorkoutType)}
              >
                <SelectTrigger className="w-full border border-gray-200">
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKOUT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {workoutType === 'cardio' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="distance" className="text-sm font-medium text-left block">
                    Distance
                  </label>
                  <Input
                    id="distance"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="E.g., 5 km, 3 miles"
                    className="text-left border border-gray-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="duration" className="text-sm font-medium text-left block">
                    Duration
                  </label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="E.g., 30 minutes, 1 hour"
                    className="text-left border border-gray-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-left block">
                    Location
                  </label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="E.g., City Park, Gym"
                    className="text-left border border-gray-200"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-left block">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this workout"
                className="text-left border border-gray-200"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-left block">
                Notes
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go? Any achievements or struggles?"
                className="text-left border border-gray-200"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-left block">
                Rate Your Workout
              </label>
              <ToggleGroup 
                type="single" 
                className="flex justify-start" 
                value={rating?.toString()} 
                onValueChange={handleRatingChange}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <ToggleGroupItem 
                    key={value} 
                    value={value.toString()}
                    className={cn(
                      "w-10 h-10 data-[state=on]:text-white",
                      value === 1 && "data-[state=on]:bg-red-600 hover:bg-red-500/20",
                      value === 2 && "data-[state=on]:bg-orange-600 hover:bg-orange-500/20",
                      value === 3 && "data-[state=on]:bg-yellow-600 hover:bg-yellow-500/20",
                      value === 4 && "data-[state=on]:bg-lime-600 hover:bg-lime-500/20",
                      value === 5 && "data-[state=on]:bg-green-600 hover:bg-green-500/20"
                    )}
                  >
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Workout
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterOneOffWorkout;
