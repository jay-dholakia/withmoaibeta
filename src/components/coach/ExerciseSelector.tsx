import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exercise } from '@/types/workout';
import { fetchExercisesByCategory, ExtendedExercise } from '@/services/workout-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, ExtendedExercise[]>>({});
  const [filteredExercises, setFilteredExercises] = useState<ExtendedExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCompletedRef = useRef(false);
  const excludeIdsRef = useRef(excludeIds);
  useEffect(() => {
    excludeIdsRef.current = excludeIds;
  }, [excludeIds]);
  
  const filterExercises = useCallback((
    exercises: Record<string, ExtendedExercise[]>,
    category: string,
    query: string
  ): ExtendedExercise[] => {
    let filtered: ExtendedExercise[] = [];
    
    if (category === 'All') {
      filtered = Object.values(exercises).flat();
    } else if (exercises[category]) {
      filtered = [...exercises[category]];
    }
    
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
    const fetchExercises = async () => {
      if (fetchCompletedRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching exercises by category");
        const exercises = await fetchExercisesByCategory();
        console.log("Received exercises:", exercises);
        
        if (!exercises || exercises.length === 0) {
          setError("No exercises found. Please add exercises to the system first.");
          setExercisesByCategory({});
          setFilteredExercises([]);
          fetchCompletedRef.current = true;
          setIsLoading(false);
          return;
        }
        
        const categorized: Record<string, ExtendedExercise[]> = {};
        exercises.forEach(exercise => {
          const category = exercise.category || 'Uncategorized';
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(exercise as ExtendedExercise);
        });
        
        setExercisesByCategory(categorized);
        
        const initialFiltered = filterExercises(categorized, selectedCategory, searchQuery);
        setFilteredExercises(initialFiltered);
        
        fetchCompletedRef.current = true;
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setError("Failed to load exercises. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [filterExercises, selectedCategory, searchQuery]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const newFiltered = filterExercises(exercisesByCategory, category, searchQuery);
    setFilteredExercises(newFiltered);
  }, [exercisesByCategory, searchQuery, filterExercises]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    const newFiltered = filterExercises(exercisesByCategory, selectedCategory, query);
    setFilteredExercises(newFiltered);
  }, [exercisesByCategory, selectedCategory, filterExercises]);

  const hasAlternatives = (exercise: ExtendedExercise) => {
    return !!(exercise.alternative_exercise_1_id || 
              exercise.alternative_exercise_2_id || 
              exercise.alternative_exercise_3_id);
  };

  const handleRetry = () => {
    fetchCompletedRef.current = false;
    const fetchExercises = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const exercises = await fetchExercisesByCategory();
        
        if (!exercises || exercises.length === 0) {
          setError("No exercises found. Please add exercises to the system first.");
          setExercisesByCategory({});
          setFilteredExercises([]);
          return;
        }
        
        const categorized: Record<string, ExtendedExercise[]> = {};
        exercises.forEach(exercise => {
          const category = exercise.category || 'Uncategorized';
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(exercise as ExtendedExercise);
        });
        
        setExercisesByCategory(categorized);
        const initialFiltered = filterExercises(categorized, selectedCategory, searchQuery);
        setFilteredExercises(initialFiltered);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setError("Failed to load exercises. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExercises();
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
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            Retry
          </Button>
        </div>
      ) : (
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
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
                    onClick={() => onSelectExercise(exercise as Exercise)}
                  >
                    <div className="text-left flex-1">
                      <div className="font-medium flex items-center">
                        {exercise.name}
                        {hasAlternatives(exercise) && (
                          <Badge variant="outline" className="ml-2 flex items-center">
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            <span className="text-xs">Has alternatives</span>
                          </Badge>
                        )}
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
      
      {onSelect && onCancel && (
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
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
