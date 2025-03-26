
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchExercisesByCategory } from '@/services/workout-service';
import { Exercise } from '@/types/workout';
import { Search, Plus, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  onSelectMultipleExercises?: (exercises: Exercise[]) => void;
  buttonText?: string;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelectExercise,
  onSelectMultipleExercises,
  buttonText = "Add Exercise"
}) => {
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercisesByCategory();
        setExercisesByCategory(data);
        
        // Set default tab to first category
        if (Object.keys(data).length > 0) {
          setSelectedTab(Object.keys(data)[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setLoading(false);
      }
    };
    
    loadExercises();
  }, []);

  const handleSingleSelect = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setOpen(false);
  };

  const handleExerciseSelection = (exercise: Exercise) => {
    if (!multiSelectMode) {
      handleSingleSelect(exercise);
      return;
    }
    
    setSelectedExercises(prev => {
      const isSelected = prev.some(e => e.id === exercise.id);
      
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleAddSelected = () => {
    if (selectedExercises.length > 0 && onSelectMultipleExercises) {
      onSelectMultipleExercises(selectedExercises);
      setSelectedExercises([]);
      setMultiSelectMode(false);
      setOpen(false);
    }
  };

  const toggleMultiSelectMode = () => {
    if (multiSelectMode) {
      setSelectedExercises([]);
    }
    setMultiSelectMode(!multiSelectMode);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
    setSelectedExercises([]);
    setMultiSelectMode(false);
  };

  const filteredExercises = searchTerm.trim() 
    ? Object.entries(exercisesByCategory).reduce((filtered, [category, exercises]) => {
        const matchingExercises = exercises.filter(exercise => 
          exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingExercises.length > 0) {
          filtered[category] = matchingExercises;
        }
        
        return filtered;
      }, {} as Record<string, Exercise[]>)
    : exercisesByCategory;

  const isExerciseSelected = (exercise: Exercise) => {
    return selectedExercises.some(e => e.id === exercise.id);
  };

  if (loading) {
    return (
      <Button disabled variant="outline">
        Loading exercises...
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <div className="flex items-center mt-4 space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant={multiSelectMode ? "default" : "outline"}
              size="sm"
              onClick={toggleMultiSelectMode}
            >
              {multiSelectMode ? "Cancel Multi-Select" : "Select Multiple"}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4 flex overflow-auto">
              {Object.keys(filteredExercises).map((category) => (
                <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(filteredExercises).map(([category, exercises]) => (
              <TabsContent key={category} value={category}>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-1">
                    {exercises.map((exercise) => (
                      <div 
                        key={exercise.id}
                        className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${isExerciseSelected(exercise) ? 'bg-muted' : ''}`}
                        onClick={() => handleExerciseSelection(exercise)}
                      >
                        {multiSelectMode ? (
                          <Checkbox 
                            checked={isExerciseSelected(exercise)}
                            className="mr-2" 
                            onCheckedChange={() => handleExerciseSelection(exercise)}
                          />
                        ) : (
                          <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-sm text-muted-foreground">{exercise.category}</p>
                        </div>
                        {isExerciseSelected(exercise) && !multiSelectMode && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        {multiSelectMode && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddSelected}
                disabled={selectedExercises.length === 0}
              >
                Add Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
