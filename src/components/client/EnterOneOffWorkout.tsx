import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { getWorkoutDraft, saveWorkoutDraft, deleteWorkoutDraft } from '@/services/workout-draft-service';
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { WORKOUT_TYPES, WorkoutType } from './WorkoutTypeIcon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/contexts/AuthContext';

const EnterOneOffWorkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') 
    ? new Date(searchParams.get('date') as string) 
    : new Date();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState<string>('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  
  const { user } = useAuth();
  const workoutDraftId = 'one-off-workout-draft';

  useEffect(() => {
    const loadDraft = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingDraft(true);
        console.log('Attempting to load one-off workout draft');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const draft = await getWorkoutDraft(workoutDraftId);
        
        if (draft && draft.draft_data) {
          console.log('Retrieved draft data:', draft.draft_data);
          
          if (draft.draft_data.title) setTitle(draft.draft_data.title);
          if (draft.draft_data.description) setDescription(draft.draft_data.description);
          if (draft.draft_data.notes) setNotes(draft.draft_data.notes);
          if (draft.draft_data.workoutType) setWorkoutType(draft.draft_data.workoutType as WorkoutType);
          
          if (draft.draft_data.date) {
            const draftDate = new Date(draft.draft_data.date);
            if (!isNaN(draftDate.getTime())) {
              setDate(draftDate);
            }
          }
          
          if (draft.draft_data.distance) setDistance(draft.draft_data.distance);
          if (draft.draft_data.duration) setDuration(draft.draft_data.duration);
          if (draft.draft_data.location) setLocation(draft.draft_data.location);
          
          toast.success('Recovered your workout draft');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setDraftLoaded(true);
        setIsLoadingDraft(false);
      }
    };
    
    loadDraft();
  }, [user]);

  useEffect(() => {
    if (!draftLoaded || !user?.id) return;
    
    const draftTimer = setTimeout(async () => {
      try {
        const draftData = {
          title,
          description,
          notes,
          workoutType,
          date: date?.toISOString(),
          distance,
          duration,
          location
        };
        
        await saveWorkoutDraft(workoutDraftId, 'one-off', draftData);
        console.log('Autosaved workout draft');
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }, 2000);
    
    return () => clearTimeout(draftTimer);
  }, [title, description, notes, workoutType, date, distance, duration, location, draftLoaded, user]);

  const addToJournal = async (workoutTitle: string, notes: string, journalDate: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !notes.trim()) return;
      
      const journalContent = `🏋️‍♀️ ${workoutTitle}:\n\n${notes}`;
      
      const { error } = await supabase
        .from('client_notes')
        .insert({
          user_id: user.id,
          content: journalContent,
          entry_date: journalDate.toISOString()
        });
        
      if (error) throw error;
      
      console.log('Workout notes added to journal successfully');
    } catch (error) {
      console.error('Error adding workout notes to journal:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workoutData: any = {
        title,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        workout_type: workoutType,
        completed_at: date ? date.toISOString() : new Date().toISOString()
      };
      
      if (workoutType === 'cardio') {
        workoutData.distance = distance.trim() || undefined;
        workoutData.duration = duration.trim() || undefined;
        workoutData.location = location || undefined;
      }
      
      if (notes.trim()) {
        await addToJournal(title, notes, date || new Date());
      }
      
      await createOneOffWorkoutCompletion(workoutData);
      
      await deleteWorkoutDraft(workoutDraftId);
      
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

  if (isLoadingDraft) {
    return (
      <div className="max-w-3xl mx-auto pt-8">
        <Card className="border border-gray-200">
          <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-client" />
              <p className="text-muted-foreground">Loading your workout draft...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                placeholder="How did it go? How did you feel? These notes will be saved to your journal."
                rows={4}
                className="text-left border border-gray-200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your notes will be saved to your journal with this workout's title.
              </p>
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
