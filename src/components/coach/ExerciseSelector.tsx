import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exercise } from '@/types/workout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkoutExerciseForm } from '@/components/coach/WorkoutExerciseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchMuscleGroups, fetchExercisesByMuscleGroup } from '@/services/exercise-service';

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  excludeIds?: string[];
  buttonText?: string;
  // Legacy props - maintained for compatibility
  onSelect?: (exerciseId: string, data: any) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const ExerciseSelector = ({ 
  onSelectExercise, 
  excludeIds = [], 
  buttonText,
  onSelect,
  onCancel,
  isSubmitting
}: ExerciseSelectorProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedExerciseForForm, setSelectedExerciseForForm] = useState<Exercise | null>(null);
  const [showExerciseForm, setShowExerciseForm] = useState<boolean>(false);
  
  const dataFetchedRef = useRef(false);
  const excludeIdsRef = useRef(excludeIds);

  useEffect(() => {
    excludeIdsRef.current = excludeIds;
  }, [excludeIds]);
  
  const filterExercises = useCallback((
    exercises: Exercise[],
    query: string
  ): Exercise[] => {
    let filtered: Exercise[] = [...exercises];
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (excludeIdsRef.current.length > 0) {
      filtered = filtered.filter(exercise => !excludeIdsRef.current.includes(exercise.id));
    }
    
    return filtered;
  }, []);

  useEffect(() => {
    if (dataFetchedRef.current) return;
    
    const loadMuscleGroupsAndExercises = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const groups = await fetchMuscleGroups();
        setMuscleGroups(groups);
        
        // Initially load all exercises
        const allExercises: Exercise[] = [];
        for (const group of groups) {
          const groupExercises = await fetchExercisesByMuscleGroup(group);
          allExercises.push(...groupExercises);
        }
        
        setExercises(allExercises);
        setFilteredExercises(allExercises.filter(ex => !excludeIds.includes(ex.id)));
        dataFetchedRef.current = true;
      } catch (error) {
        console.error('Error loading muscle groups and exercises:', error);
        setError('Failed to load exercises. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMuscleGroupsAndExercises();
  }, [excludeIds]);

  const handleMuscleGroupChange = async (muscleGroup: string) => {
    setIsLoading(true);
    setSelectedMuscleGroup(muscleGroup);
    
    try {
      let filtered: Exercise[];
      if (muscleGroup === 'all') {
        filtered = exercises;
      } else {
        const groupExercises = await fetchExercisesByMuscleGroup(muscleGroup);
        filtered = groupExercises;
      }
      
      // Apply search filter if exists
      if (searchQuery) {
        filtered = filtered.filter(ex => 
          ex.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter out excluded IDs
      filtered = filtered.filter(ex => !excludeIds.includes(ex.id));
      
      setFilteredExercises(filtered);
    } catch (error) {
      console.error('Error fetching exercises for muscle group:', error);
      setError('Failed to load exercises for this muscle group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // Apply search filter to the current exercises
    const newFiltered = filterExercises(exercises, query);
    setFilteredExercises(newFiltered);
  };

  const handleExerciseClick = (exercise: Exercise) => {
    console.log("Exercise clicked:", exercise);
    if (onSelect) {
      setSelectedExerciseForForm(exercise);
      setShowExerciseForm(true);
    } else {
      onSelectExercise(exercise);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (selectedExerciseForForm && onSelect) {
      await onSelect(selectedExerciseForForm.id, formData);
      setShowExerciseForm(false);
      setSelectedExerciseForForm(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => {
            dataFetchedRef.current = false;
          }} variant="outline">
            Retry
          </Button>
        </div>
      ) : (
        <Tabs value={selectedMuscleGroup} onValueChange={handleMuscleGroupChange}>
          <TabsList className="mb-4 flex flex-wrap h-auto">
            <TabsTrigger value="all" className="text-xs">
              All Exercises
            </TabsTrigger>
            {muscleGroups.map((group) => (
              <TabsTrigger key={group} value={group} className="text-xs">
                {group}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedMuscleGroup} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                {filteredExercises.map((exercise) => (
                  <Button
                    key={exercise.id}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handleExerciseClick(exercise as Exercise)}
                  >
                    <div className="text-left flex-1">
                      <div className="font-medium flex items-center">
                        {exercise.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {exercise.category} • {exercise.exercise_type}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No exercises found. Try a different category or search term.
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {onSelect && onCancel && !showExerciseForm && (
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      )}

      <Dialog open={showExerciseForm} onOpenChange={(open) => !open && setShowExerciseForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedExerciseForForm?.name || 'Configure Exercise'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedExerciseForForm && (
            <WorkoutExerciseForm
              initialData={{ exercise: selectedExerciseForForm }}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />
          )}
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowExerciseForm(false);
                setSelectedExerciseForForm(null);
                if (onCancel) onCancel();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
