import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchExercisesByCategory } from '@/services/workout-service';
import { Exercise } from '@/types/workout';
import { Plus } from 'lucide-react';

type ExerciseSelectorProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  buttonText?: string;
};

export const ExerciseSelector = ({ 
  isOpen: propIsOpen, 
  onClose, 
  onSelectExercise, 
  buttonText = "Add Exercise" 
}: ExerciseSelectorProps) => {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [filteredExercisesByCategory, setFilteredExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        const data = await fetchExercisesByCategory();
        setExercisesByCategory(data);
        setFilteredExercisesByCategory(data);
        
        // Set default category to the first available one or 'all'
        const categories = Object.keys(data);
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (error) {
        console.error("Error loading exercises:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredExercisesByCategory(exercisesByCategory);
      return;
    }
    
    const filtered: Record<string, Exercise[]> = {};
    
    Object.entries(exercisesByCategory).forEach(([category, exercises]) => {
      const filteredExercises = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredExercises.length > 0) {
        filtered[category] = filteredExercises;
      }
    });
    
    setFilteredExercisesByCategory(filtered);
  }, [searchTerm, exercisesByCategory]);

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    handleClose();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };
  
  const handleOpen = () => {
    setIsOpen(true);
  };
  
  const categories = Object.keys(filteredExercisesByCategory);
  
  // If we don't have an explicit isOpen prop, render with a trigger button
  if (propIsOpen === undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpen} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Exercise</DialogTitle>
            <DialogDescription>
              Browse or search for exercises to add to your workout.
            </DialogDescription>
          </DialogHeader>
          
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    );
  }
  
  // Otherwise, render just the dialog without a trigger
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Exercise</DialogTitle>
          <DialogDescription>
            Browse or search for exercises to add to your workout.
          </DialogDescription>
        </DialogHeader>
        
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
  
  function renderDialogContent() {
    return (
      <>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search exercises..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 px-3"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading exercises...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No exercises found</p>
          </div>
        ) : (
          <Tabs
            defaultValue={selectedCategory}
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid grid-flow-col auto-cols-max overflow-x-auto py-1 px-0 justify-start gap-2 h-auto">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="whitespace-nowrap"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map((category) => (
              <TabsContent
                key={category}
                value={category}
                className="flex-1 overflow-hidden flex flex-col mt-0 pt-4 px-1"
              >
                <ScrollArea className="flex-1">
                  <div className="space-y-1">
                    {filteredExercisesByCategory[category].map((exercise) => (
                      <Button
                        key={exercise.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => handleSelectExercise(exercise)}
                      >
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          {exercise.description && (
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {exercise.description}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </>
    );
  }
};
