
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKOUT_TYPES, WorkoutType } from './WorkoutTypeIcon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const EnterOneOffWorkout = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('one_off'); // Default to one_off
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const workoutData: any = {
        title,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        rating,
        workout_type: workoutType
      };
      
      if (workoutType === 'cardio') {
        workoutData.distance = distance.trim() || undefined;
        workoutData.duration = duration.trim() || undefined;
        workoutData.location = location || undefined;
      }
      
      await createOneOffWorkoutCompletion(workoutData);
      
      toast.success('Workout logged successfully!');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDurationInput = (value: string): string => {
    let cleaned = value.replace(/[^\d:]/g, '');
    
    const parts = cleaned.split(':');
    
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }
    
    return cleaned;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mb-4 border border-gray-200 hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
      </div>
      
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle>Log a Custom Workout</CardTitle>
          <CardDescription>
            Record a workout you've completed that wasn't in your assigned program
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-left block">
                Workout Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Run, Gym Session, Home Workout"
                required
                className="text-left border border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="workoutType" className="text-sm font-medium text-left block">
                Workout Type <span className="text-red-500">*</span>
              </label>
              <Select 
                value={workoutType} 
                onValueChange={(value) => setWorkoutType(value as WorkoutType)}
              >
                <SelectTrigger className="text-left border border-gray-200">
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
            
            {workoutType === 'cardio' && (
              <div className="space-y-4 border rounded-md p-3 bg-blue-50/30 border-blue-100">
                <div className="space-y-2">
                  <label htmlFor="distance" className="text-sm font-medium text-left block">
                    Distance (miles)
                  </label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="text-left border border-gray-200"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-left">Enter distance in miles</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="duration" className="text-sm font-medium text-left block">
                    Duration (hh:mm:ss)
                  </label>
                  <Input
                    id="duration"
                    placeholder="00:00:00"
                    value={duration}
                    onChange={(e) => setDuration(formatDurationInput(e.target.value))}
                    className="text-left border border-gray-200"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-left">Format: hours:minutes:seconds</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-left block">
                    Location
                  </label>
                  <ToggleGroup 
                    type="single" 
                    className="justify-start"
                    value={location}
                    onValueChange={(value) => {
                      if (value) setLocation(value);
                    }}
                  >
                    <ToggleGroupItem 
                      value="indoor" 
                      className="text-sm border border-gray-300 hover:border-client data-[state=on]:border-client"
                    >
                      Indoor
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="outdoor" 
                      className="text-sm border border-gray-300 hover:border-client data-[state=on]:border-client"
                    >
                      Outdoor
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-left block">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your workout"
                rows={3}
                className="text-left border border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-left block">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go? How did you feel?"
                rows={4}
                className="text-left border border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="rating" className="text-sm font-medium text-left block">
                Rating (Optional)
              </label>
              <Select 
                value={rating?.toString()} 
                onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="text-left border border-gray-200">
                  <SelectValue placeholder="How would you rate this workout?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Poor</SelectItem>
                  <SelectItem value="2">2 - Poor</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim()}
              className="w-full sm:w-auto border-2 border-client"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Log Workout
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EnterOneOffWorkout;
