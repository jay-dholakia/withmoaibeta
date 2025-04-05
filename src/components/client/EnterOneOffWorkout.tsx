
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { saveOneOffWorkout } from '@/services/client-workout-history-service';
import { useAuth } from '@/contexts/AuthContext';

const EnterOneOffWorkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const initialWorkoutType = searchParams.get('type') || 'strength';
  
  const [title, setTitle] = useState('');
  const [workoutType, setWorkoutType] = useState(initialWorkoutType);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set defaults based on workout type when it changes
    if (workoutType === 'run') {
      if (!title) setTitle('Running');
    } else if (workoutType === 'cardio') {
      if (!title) setTitle('Cardio Session');
    } else if (workoutType === 'strength') {
      if (!title) setTitle('Strength Training');
    }
  }, [workoutType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title for your workout');
      return;
    }
    
    if (!user?.id) {
      toast.error('User ID is missing');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const workoutData = {
        title,
        workout_type: workoutType,
        description,
        duration,
        distance: workoutType === 'run' ? distance : undefined,
        user_id: user.id,
      };
      
      const { data, error } = await saveOneOffWorkout(workoutData);
      
      if (error) throw error;
      
      toast.success('Workout logged successfully!');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to log workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Log a Workout</CardTitle>
          <CardDescription>Record your workout details below</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout-type">Workout Type</Label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger>
                <SelectValue placeholder="Select workout type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">
                  <div className="flex items-center">
                    <span className="text-lg mr-2" role="img" aria-label="Strength">💪</span>
                    Strength/Mobility
                  </div>
                </SelectItem>
                <SelectItem value="run">
                  <div className="flex items-center">
                    <span className="text-lg mr-2" role="img" aria-label="Running">🏃‍♂️</span>
                    Run
                  </div>
                </SelectItem>
                <SelectItem value="cardio">
                  <div className="flex items-center">
                    <span className="text-lg mr-2" role="img" aria-label="Cardio">❤️</span>
                    Cardio
                  </div>
                </SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              placeholder="What did you do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="How was your workout?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Optional)</Label>
            <Input
              id="duration"
              placeholder="e.g. 30 minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          
          {workoutType === 'run' && (
            <div className="space-y-2">
              <Label htmlFor="distance">Distance in Miles</Label>
              <Input
                id="distance"
                placeholder="e.g. 3.1"
                type="number"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/client-dashboard/workouts')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Workout'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EnterOneOffWorkout;
