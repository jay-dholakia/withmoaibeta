
import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types/workout';
import { fetchExercisesByCategory } from '@/services/workout-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  excludeIds?: string[];
  buttonText?: string;
  // Add optional props for StandaloneWorkoutForm and WorkoutDayForm
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Change the type of state to handle the exercises correctly
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  // Get all exercises on initial load
  useEffect(() => {
    const getExercises = async () => {
      setIsLoading(true);
      try {
        const exercises = await fetchExercisesByCategory();
        
        // Group exercises by category
        const categorized: Record<string, Exercise[]> = {};
        exercises.forEach(exercise => {
          if (!categorized[exercise.category]) {
            categorized[exercise.category] = [];
          }
          categorized[exercise.category].push(exercise);
        });
        
        setExercisesByCategory(categorized);
        updateFilteredExercises(categorized, selectedCategory, searchQuery, excludeIds);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getExercises();
  }, [excludeIds]);

  // Update filtered exercises when category or search query changes
  useEffect(() => {
    updateFilteredExercises(exercisesByCategory, selectedCategory, searchQuery, excludeIds);
  }, [selectedCategory, searchQuery, excludeIds]);

  // Helper function to update filtered exercises
  const updateFilteredExercises = (
    allExercises: Record<string, Exercise[]>,
    category: string,
    query: string,
    excluded: string[]
  ) => {
    let filtered: Exercise[] = [];

    // Get exercises based on category
    if (category === 'All') {
      filtered = Object.values(allExercises).flat();
    } else if (allExercises[category]) {
      filtered = [...allExercises[category]];
    }

    // Filter by search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(lowerQuery)
      );
    }

    // Exclude specified IDs
    if (excluded.length > 0) {
      filtered = filtered.filter(exercise => !excluded.includes(exercise.id));
    }

    setFilteredExercises(filtered);
  };

  const categories = ['All', ...Object.keys(exercisesByCategory).sort()];

  return (
    <div className="w-full">
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="All" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-4 flex flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-0">
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
                  onClick={() => onSelectExercise(exercise)}
                >
                  <div className="text-left">
                    <div className="font-medium">{exercise.name}</div>
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
      
      {/* Add buttons for the onSelect/onCancel flow */}
      {onSelect && onCancel && (
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {/* This button would be used in some implementation */}
          {buttonText && (
            <Button disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : buttonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
