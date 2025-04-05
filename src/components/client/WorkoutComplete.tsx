
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import WorkoutSetCompletions from './WorkoutSetCompletions';

const WorkoutComplete = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  
  const { data: workoutCompletion, isLoading: isLoadingCompletion, error: completionError } = useQuery({
    queryKey: ['workout-completion', workoutCompletionId],
    queryFn: async () => {
      if (!workoutCompletionId) throw new Error('No workout completion ID provided');
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout:workout_id (
            id,
            title,
            description,
            workout_type
          )
        `)
        .eq('id', workoutCompletionId)
        .single();
      
      if (error) throw error;
      setNotes(data.notes || '');
      setRating(data.rating || 0);
      return data;
    },
    enabled: !!workoutCompletionId,
  });
  
  const { data: workoutExercises, isLoading: isLoadingExercises, error: exercisesError } = useQuery({
    queryKey: ['workout-exercises', workoutCompletion?.workout_id],
    queryFn: async () => {
      if (!workoutCompletion?.workout_id) return [];
      
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercise_id (
            id,
            name,
            description,
            category
          )
        `)
        .eq('workout_id', workoutCompletion.workout_id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutCompletion?.workout_id,
  });
  
  const handleBackClick = () => {
    navigate('/client-dashboard/workouts');
  };
  
  const handleSaveNotes = async () => {
    if (!workoutCompletionId || !user?.id) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('workout_completions')
        .update({
          notes,
          rating,
          workout_type: workoutCompletion?.workout?.workout_type || workoutCompletion?.workout_type || 'strength'
        })
        .eq('id', workoutCompletionId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error saving workout notes:', error);
        toast.error('Failed to save notes');
        setLoading(false);
        return;
      }
      
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['weekly-run-progress'] });
      queryClient.invalidateQueries({ queryKey: ['client-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['client-workouts-week-progress'] });
      queryClient.invalidateQueries({ queryKey: ['client-workouts-leaderboard'] });
      
      toast.success('Workout notes saved!');
      navigate('/client-dashboard/workouts');
    } catch (err) {
      console.error('Error in handleSaveNotes:', err);
      toast.error('Failed to save notes');
      setLoading(false);
    }
  };
  
  if (isLoadingCompletion || isLoadingExercises) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading workout summary...</p>
      </div>
    );
  }
  
  if (completionError || exercisesError || !workoutCompletion) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading workout</p>
        <Button onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
        </Button>
      </div>
    );
  }
  
  const workoutTitle = workoutCompletion.workout?.title || workoutCompletion.title || 'Workout Complete';
  
  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={handleBackClick}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
      </Button>
      
      <Card>
        <CardHeader className="bg-green-50 border-b border-green-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-green-800">{workoutTitle}</CardTitle>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Completed
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Your Workout Results</h3>
            
            <WorkoutSetCompletions 
              workoutCompletionId={workoutCompletionId!}
              workoutExercises={workoutExercises || []}
              readOnly={true}
            />
          </div>
          
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-medium">Rate this workout</h3>
            
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 rounded-full transition-all ${
                    rating >= star 
                      ? 'text-yellow-400 hover:text-yellow-500' 
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Workout notes</h3>
              <Textarea
                placeholder="How did this workout feel? Any achievements or challenges?"
                className="h-32 resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button
            disabled={loading}
            onClick={handleSaveNotes}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save and Finish
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WorkoutComplete;
