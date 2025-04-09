import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { completeWorkout, fetchPersonalRecords } from '@/services/client-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Share2, ArrowLeft, AlertCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteWorkoutDraft, getWorkoutDraft, saveWorkoutDraft } from '@/services/workout-draft-service';
import { useAutosave } from '@/hooks/useAutosave';
import Stopwatch from './Stopwatch';

const WorkoutComplete = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [authStateChanged, setAuthStateChanged] = useState(0);

  useEffect(() => {
    if (user) {
      console.log("Auth state detected in WorkoutComplete, user:", user.id);
      setAuthStateChanged(prev => prev + 1);
      setDraftLoaded(false);
    }
  }, [user]);

  const { saveStatus } = useAutosave({
    data: { notes, rating },
    onSave: async (data) => {
      if (!workoutCompletionId || !user?.id) return false;
      console.log("Saving workout completion draft with data:", data);
      return await saveWorkoutDraft(
        workoutCompletionId || null, 
        'completion', 
        data
      );
    },
    debounce: 1000,
    disabled: !workoutCompletionId || !user?.id
  });

  const { data: workoutData, isLoading } = useQuery({
    queryKey: ['complete-workout', workoutCompletionId],
    queryFn: async () => {
      console.log("Fetching workout completion data for ID:", workoutCompletionId);
      
      try {
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
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching workout completion data:", error);
          return null;
        }
        
        if (data) {
          console.log("Fetched workout completion data:", data);
          return data;
        }
        
        const { data: byWorkoutData, error: byWorkoutError } = await supabase
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
          .eq('workout_id', workoutCompletionId || '')
          .eq('user_id', user?.id)
          .maybeSingle();
            
        if (byWorkoutError) {
          console.error("Error fetching by workout_id:", byWorkoutError);
        }
        
        if (byWorkoutData) {
          console.log("Found workout completion by workout_id:", byWorkoutData);
          return byWorkoutData;
        }
        
        const { data: workoutOnly, error: workoutError } = await supabase
          .from('workouts')
          .select(`
            *,
            workout_exercises (
              *,
              exercise:exercise_id (*)
            )
          `)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();
          
        if (workoutError) {
          console.error("Error fetching workout data:", workoutError);
        }
        
        if (workoutOnly) {
          console.log("Fetched workout data directly:", workoutOnly);
          return {
            id: null,
            user_id: user?.id,
            workout_id: workoutCompletionId,
            completed_at: new Date().toISOString(),
            notes: null,
            rating: null,
            workout: workoutOnly,
            workout_set_completions: []
          };
        }
        
        const { data: standaloneWorkout, error: standaloneError } = await supabase
          .from('standalone_workouts')
          .select(`
            *,
            standalone_workout_exercises (
              *,
              exercise:exercise_id (*)
            )
          `)
          .eq('id', workoutCompletionId || '')
          .maybeSingle();
          
        if (standaloneError) {
          console.error("Error fetching standalone workout:", standaloneError);
        }
        
        if (standaloneWorkout) {
          console.log("Fetched standalone workout:", standaloneWorkout);
          return {
            id: null,
            user_id: user?.id,
            standalone_workout_id: workoutCompletionId,
            completed_at: new Date().toISOString(),
            notes: null,
            rating: null,
            workout: {
              ...standaloneWorkout,
              workout_exercises: standaloneWorkout.standalone_workout_exercises
            },
            workout_set_completions: []
          };
        }
        
        return null;
      } catch (error) {
        console.error("Error in workout completion data query:", error);
        throw error;
      }
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

  useEffect(() => {
    let mounted = true;
    let loadAttemptTimeout: NodeJS.Timeout | null = null;
    
    const loadDraftData = async () => {
      if (!workoutCompletionId || !user?.id || !mounted) return;
      
      try {
        console.log(`Loading draft data for workout completion ${workoutCompletionId}`);
        
        console.log(`Auth state changes detected: ${authStateChanged}`);
        
        const { getWorkoutDraft } = await import('@/services/workout-draft-service');
        
        const draft = await getWorkoutDraft(workoutCompletionId, 7, 500);
        
        if (!mounted) return;
        
        if (draft && draft.draft_data) {
          console.log("Workout completion draft data received:", draft.draft_data);
          
          if (draft.draft_data.notes !== undefined) {
            console.log(`Setting notes from draft: "${draft.draft_data.notes}"`);
            setNotes(draft.draft_data.notes);
          } else {
            console.log("No notes found in draft data");
          }
          
          if (draft.draft_data.rating !== undefined) {
            console.log(`Setting rating from draft: ${draft.draft_data.rating}`);
            setRating(draft.draft_data.rating);
          } else {
            console.log("No rating found in draft data");
          }
          
          if ((draft.draft_data.notes !== undefined && draft.draft_data.notes !== "") || 
              (draft.draft_data.rating !== undefined && draft.draft_data.rating !== null)) {
            toast.success('Recovered unsaved workout notes');
          }
        } else {
          console.log("No valid draft data found for this workout completion");
        }
        
        setDraftLoaded(true);
      } catch (error) {
        console.error("Error loading workout completion draft data:", error);
        setDraftLoaded(true);
      }
    };
    
    if (user && workoutCompletionId && !draftLoaded) {
      console.log("User authenticated, loading workout completion draft data");
      loadDraftData();
    } else if (!user && workoutCompletionId && !draftLoaded) {
      console.log("User not authenticated yet, scheduling retry");
      loadAttemptTimeout = setTimeout(() => {
        if (mounted && !draftLoaded) {
          console.log("Retrying workout completion draft load after timeout");
          loadDraftData();
        }
      }, 1500);
    }
    
    return () => {
      mounted = false;
      if (loadAttemptTimeout) {
        clearTimeout(loadAttemptTimeout);
      }
    };
  }, [workoutCompletionId, user, draftLoaded, authStateChanged]);

  useEffect(() => {
    if (workoutData && !shareMessage) {
      let message = `I just finished my workout: ${workoutData?.workout?.title || 'Workout'}! 💪\n\n`;
      
      if (personalRecords && personalRecords.length > 0) {
        message += "🏆 New personal records:\n";
        personalRecords.forEach((pr: any) => {
          message += `- ${pr.exercise.name}: ${pr.weight} lbs × ${pr.reps} reps\n`;
        });
        message += "\n";
      }
      
      message += "#FitnessJourney #PersonalBest";
      
      setShareMessage(message);
    }
  }, [workoutData, personalRecords, shareMessage]);

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
      
      let completionId = workoutData?.id || workoutCompletionId;
      let isNewCompletion = !workoutData?.id;
      
      if (isNewCompletion) {
        try {
          const { data: newCompletion, error } = await supabase
            .from('workout_completions')
            .insert({
              workout_id: workoutData?.workout_id || workoutCompletionId,
              standalone_workout_id: workoutData?.standalone_workout_id,
              user_id: user?.id,
              completed_at: new Date().toISOString(),
              rating,
              notes
            })
            .select('id')
            .maybeSingle();
          
          if (error) {
            console.error("Error creating new workout completion:", error);
            throw error;
          }
          
          if (!newCompletion) {
            throw new Error("Failed to create workout completion record");
          }
          
          completionId = newCompletion.id;
        } catch (error) {
          console.error("Error in workout completion mutation:", error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('workout_completions')
          .update({
            rating,
            notes,
            completed_at: new Date().toISOString()
          })
          .eq('id', completionId);
          
        if (error) {
          console.error("Error updating workout completion:", error);
          throw error;
        }
      }
      
      return completionId;
    },
    onSuccess: (completionId) => {
      if (completionId) {
        deleteWorkoutDraft(workoutCompletionId);
        queryClient.invalidateQueries({ queryKey: ['assigned-workouts'] });
        queryClient.invalidateQueries({ queryKey: ['client-workouts'] });
        setShowShareDialog(true);
      } else {
        toast.error('Failed to complete workout');
      }
    },
    onError: (error) => {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout');
    },
  });

  const handleShareWorkout = () => {
    navigator.clipboard.writeText(shareMessage)
      .then(() => {
        toast.success('Copied to clipboard! Ready to share.');
      })
      .catch(() => {
        toast.error('Could not copy text');
      });
  };

  const handleCloseShareDialog = () => {
    setShowShareDialog(false);
    navigate('/client-dashboard/moai');
  };

  const toggleEditMessage = () => {
    setIsEditingMessage(!isEditingMessage);
  };

  const isStrengthWorkout = workoutData?.workout?.workout_type === 'strength';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-medium mb-2">Workout Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The workout you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/client-dashboard/workouts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
        </Button>
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
          <div className="relative">
            <Textarea
              placeholder="How did this workout feel? What went well? What was challenging?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="border border-gray-200"
            />
            <div className="absolute right-2 top-2 text-xs text-muted-foreground">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'success' && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Your notes will be saved to your journal with this workout's title.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        {isStrengthWorkout && (
          <Stopwatch className="mb-2" />
        )}
        
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
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Your Workout Achievement
            </DialogTitle>
            <DialogDescription>
              Great job completing your workout! Would you like to share your results?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-lg p-4 my-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Ready to share:</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleEditMessage}
                className="h-8 px-2 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                {isEditingMessage ? "Preview" : "Edit"}
              </Button>
            </div>
            
            {isEditingMessage ? (
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="min-h-[150px] text-sm"
                placeholder="Write your custom message here..."
              />
            ) : (
              <div className="bg-white p-3 rounded border text-sm whitespace-pre-line">
                {shareMessage}
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleCloseShareDialog}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                handleShareWorkout();
                handleCloseShareDialog();
              }}
              className="bg-primary hover:bg-primary/90 flex-1"
            >
              <Share2 className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutComplete;
