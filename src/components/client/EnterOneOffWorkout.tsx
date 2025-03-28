
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

const EnterOneOffWorkout = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('one_off'); // Default to one_off
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createOneOffWorkoutCompletion({
        title,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        rating,
        workout_type: workoutType // This is now always defined
      });
      
      toast.success('Workout logged successfully!');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Log a Custom Workout</CardTitle>
          <CardDescription>
            Record a workout you've completed that wasn't in your assigned program
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Workout Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Run, Gym Session, Home Workout"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="workoutType" className="text-sm font-medium">
                Workout Type <span className="text-red-500">*</span>
              </label>
              <Select 
                value={workoutType} 
                onValueChange={(value) => setWorkoutType(value as WorkoutType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your workout"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go? How did you feel?"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="rating" className="text-sm font-medium">
                Rating (Optional)
              </label>
              <Select 
                value={rating?.toString()} 
                onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
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
              className="w-full sm:w-auto"
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
