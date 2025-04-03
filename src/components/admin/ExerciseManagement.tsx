
import React, { useState, useEffect } from 'react';
import { fetchExercises } from '@/services/workout-service';
import { EditExerciseForm } from '@/components/coach/EditExerciseForm';
import { Exercise } from '@/types/workout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ExerciseGifViewer } from '@/components/client/ExerciseGifViewer';
import { Pencil, Search, FilterX } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EXERCISE_CATEGORIES = [
  'All Categories',
  'Abs',
  'Back',
  'Biceps',
  'Cardio',
  'Chest',
  'Core',
  'Full Body',
  'Legs',
  'Shoulders',
  'Triceps',
  'Upper Body',
  'Lower Body',
  'Olympic',
  'Plyometrics',
  'Other'
];

export const ExerciseManagement = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showOnlyWithGifs, setShowOnlyWithGifs] = useState(false);
  const [showOnlyWithoutGifs, setShowOnlyWithoutGifs] = useState(false);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        const data = await fetchExercises();
        setExercises(data);
        setFilteredExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  useEffect(() => {
    let filtered = [...exercises];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }
    
    // Filter for GIFs
    if (showOnlyWithGifs) {
      filtered = filtered.filter(exercise => !!exercise.gif_url);
    } else if (showOnlyWithoutGifs) {
      filtered = filtered.filter(exercise => !exercise.gif_url);
    }
    
    setFilteredExercises(filtered);
  }, [exercises, searchTerm, selectedCategory, showOnlyWithGifs, showOnlyWithoutGifs]);

  const handleExerciseUpdated = (updatedExercise: Exercise) => {
    setExercises(prev => 
      prev.map(exercise => 
        exercise.id === updatedExercise.id ? updatedExercise : exercise
      )
    );
  };

  const handleEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsEditDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setShowOnlyWithGifs(false);
    setShowOnlyWithoutGifs(false);
  };

  const toggleGifFilter = (type: 'with' | 'without') => {
    if (type === 'with') {
      setShowOnlyWithGifs(!showOnlyWithGifs);
      if (!showOnlyWithGifs) {
        setShowOnlyWithoutGifs(false);
      }
    } else {
      setShowOnlyWithoutGifs(!showOnlyWithoutGifs);
      if (!showOnlyWithoutGifs) {
        setShowOnlyWithGifs(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Management</CardTitle>
        <CardDescription>
          Manage exercises and their demonstration GIFs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search exercises..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex-1 sm:max-w-[200px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={showOnlyWithGifs ? "default" : "outline"} 
              size="sm"
              onClick={() => toggleGifFilter('with')}
            >
              With GIFs
            </Button>
            
            <Button 
              variant={showOnlyWithoutGifs ? "default" : "outline"} 
              size="sm"
              onClick={() => toggleGifFilter('without')}
            >
              Without GIFs
            </Button>
            
            {(searchTerm || selectedCategory !== 'All Categories' || showOnlyWithGifs || showOnlyWithoutGifs) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetFilters}
                className="ml-auto"
              >
                <FilterX className="h-4 w-4 mr-1" />
                Reset Filters
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-8">Loading exercises...</div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exercises found matching your filters
            </div>
          ) : (
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Demonstration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExercises.map(exercise => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell>{exercise.category}</TableCell>
                      <TableCell>{exercise.exercise_type}</TableCell>
                      <TableCell>
                        {exercise.gif_url ? (
                          <ExerciseGifViewer
                            exerciseId={exercise.id}
                            exerciseName={exercise.name}
                            gifUrl={exercise.gif_url}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No GIF</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditExercise(exercise)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      {selectedExercise && (
        <EditExerciseForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          exercise={selectedExercise}
          onExerciseUpdated={handleExerciseUpdated}
        />
      )}
    </Card>
  );
};
