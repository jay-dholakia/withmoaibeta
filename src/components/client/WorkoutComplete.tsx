
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { completeWorkout, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Share2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const WorkoutComplete = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  
  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['complete-workout', workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout:workout_id (
            *,
            workout_exercises (
              *,
              exercise:exercise_id (*)
            )
          ),
          workout_set_completions (*)
        `)
        .eq('id', workoutCompletionId || '')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user?.id,
  });

  const { data: personalRecords, isLoading: isLoadingPRs } = useQuery({
    queryKey: ['personal-records', user?.id, workoutCompletionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_records')
        .select(`
          *,
          exercise:exercise_id (*)
        `)
        .eq('workout_completion_id', workoutCompletionId || '')
        .eq('user_id', user?.id || '');

      if (error) throw error;
      return data;
    },
    enabled: !!workoutCompletionId && !!user?.id,
  });

  const addToJournal = async (notes: string) => {
    if (!user?.id || !notes.trim() || !workoutData) return;
    
    const workoutTitle = workoutData.workout?.title || 'Workout';
    const journalContent = `🏋️‍♀️ ${workoutTitle}:\n\n${notes}`;
    const completionDate = workoutData.completed_at ? new Date(workoutData.completed_at) : new Date();
    
    try {
      const { error } = await supabase
        .from('client_notes')
        .insert({
          user_id: user.id,
          content: journalContent,
          entry_date: completionDate.toISOString()
        });
        
      if (error) throw error;
      
      console.log('Workout notes added to journal successfully');
    } catch (error) {
      console.error('Error adding workout notes to journal:', error);
    }
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!workoutCompletionId) return null;
      console.log("Attempting to complete workout with ID:", workoutCompletionId);
      
      if (notes.trim()) {
        await addToJournal(notes);
      }
      
      // Call completeWorkout but don't show toast here - it's already shown in the service
      return completeWorkout(
        workoutCompletionId,
        rating,
        notes
      );
    },
    onSuccess: () => {
      // Navigate without showing toast - toast is shown in client-service.ts
      navigate('/client-dashboard/workouts');
    },
    onError: (error) => {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout');
    },
  });

  const handleShareWorkout = () => {
    let shareText = `I just finished my workout: ${workoutData?.workout?.title || 'Workout'}! 💪\n\n`;
    
    if (personalRecords && personalRecords.length > 0) {
      shareText += "🏆 New personal records:\n";
      personalRecords.forEach((pr: any) => {
        shareText += `- ${pr.exercise.name}: ${pr.weight} lbs × ${pr.reps} reps\n`;
      });
    }
    
    shareText += "\n#FitnessJourney #PersonalBest";
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        toast.success('Copied to clipboard! Ready to share.');
      })
      .catch(() => {
        toast.error('Could not copy text');
      });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }

  const feelingOptions = [
    { value: 1, emoji: "😫", label: "Exhausted" },
    { value: 2, emoji: "😓", label: "Tired" },
    { value: 3, emoji: "😌", label: "Chill" },
    { value: 4, emoji: "😊", label: "Energized" },
    { value: 5, emoji: "😤", label: "Fully Charged" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="border border-gray-200 hover:border-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{workoutData?.workout?.title || 'Workout'}</h1>
        </div>
      </div>

      <div className="flex justify-center py-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4 border border-green-200">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2 text-center">How do you feel after this workout?</h3>
          <div className="flex justify-center gap-2">
            {feelingOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRating(option.value)}
                className={cn(
                  "flex flex-col items-center rounded-lg p-2 transition-colors border-2",
                  rating === option.value 
                    ? "border-primary bg-primary/10" 
                    : "border-gray-200 hover:bg-gray-100"
                )}
                title={option.label}
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Add notes</h3>
          <Textarea
            placeholder="How did this workout feel? What went well? What was challenging?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="border border-gray-200"
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Your notes will be saved to your journal with this workout's title.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="bg-client hover:bg-client/90 border-2 border-client"
        >
          {completeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Workout
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleShareWorkout}
          className="border-2 border-gray-200 hover:border-gray-300"
        >
          <Share2 className="mr-2 h-4 w-4" /> Share Results
        </Button>
      </div>
    </div>
  );
};

export default WorkoutComplete;
