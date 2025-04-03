import React, { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
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
import { CreateExerciseForm } from '@/components/coach/CreateExerciseForm';
import { toast } from 'sonner';

export type ExerciseSelectorProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  buttonText?: string;
  onSelect?: (exerciseId: string, data: any) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export const ExerciseSelector = ({ 
  isOpen: propIsOpen, 
  onClose, 
  onSelectExercise, 
  buttonText = "Add Exercise",
  onSelect,
  onCancel,
  isSubmitting
}: ExerciseSelectorProps) => {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [filteredExercisesByCategory, setFilteredExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
        
        setSelectedCategory('All');
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
    
    filtered['All'] = exercisesByCategory['All']?.filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
    
    Object.entries(exercisesByCategory).forEach(([category, exercises]) => {
      if (category === 'All') return;
      
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
    if (onSelect) {
      onSelect(exercise.id, {
        sets: 3,
        reps: '10',
        rest_seconds: 60,
        notes: ''
      });
    } else {
      onSelectExercise(exercise);
      handleClose();
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };
  
  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleExerciseCreated = (exercise: Exercise) => {
    fetchExercisesByCategory().then(data => {
      setExercisesByCategory(data);
      setFilteredExercisesByCategory(data);
      
      setSelectedCategory(exercise.category);
      
      toast.success(`Exercise "${exercise.name}" added to database!`);
    });
    
    setShowCreateForm(false);
  };
  
  const categories = Object.keys(filteredExercisesByCategory);
  
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
            <DialogDescription className="flex justify-between items-center">
              <span>Browse or search for exercises to add to your workout.</span>
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Create New
              </Button>
            </DialogDescription>
          </DialogHeader>
          
          {renderDialogContent()}
        </DialogContent>
        
        <CreateExerciseForm 
          open={showCreateForm} 
          onOpenChange={setShowCreateForm} 
          onExerciseCreated={handleExerciseCreated} 
        />
      </Dialog>
    );
  }
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Exercise</DialogTitle>
            <DialogDescription className="flex justify-between items-center">
              <span>Browse or search for exercises to add to your workout.</span>
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Create New
              </Button>
            </DialogDescription>
          </DialogHeader>
          
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
      
      <CreateExerciseForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
        onExerciseCreated={handleExerciseCreated} 
      />
    </>
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
            <div className="border-b mb-4 overflow-x-auto">
              <ScrollArea className="w-full">
                <div className="pb-0.5 pt-0.5">
                  <TabsList className="inline-flex h-10 items-center justify-start px-1 mb-0 w-auto gap-1">
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category}
                        value={category || "unknown"}
                        className="px-3 py-1.5 whitespace-nowrap"
                      >
                        {category || "Unknown"}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </ScrollArea>
            </div>
            
            {categories.map((category) => (
              <TabsContent
                key={category}
                value={category || "unknown"}
                className="flex-1 overflow-hidden mt-0 pt-0"
              >
                <ScrollArea className="flex-1 h-[340px]">
                  <div className="space-y-1 p-1">
                    {filteredExercisesByCategory[category]?.map((exercise) => (
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
