
import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Search } from 'lucide-react';
import { fetchExercisesByCategory } from '@/services/workout-service';

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ 
  onSelectExercise,
  buttonText = "Add Exercise",
  buttonVariant = "outline"
}) => {
  const [open, setOpen] = useState(false);
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, Exercise[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Record<string, Exercise[]>>({});
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercisesByCategory();
        setExercisesByCategory(data);
        setFilteredExercises(data);
        
        // Set active tab to the first category
        if (Object.keys(data).length > 0) {
          setActiveTab(Object.keys(data)[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setIsLoading(false);
      }
    };

    loadExercises();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercisesByCategory);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered: Record<string, Exercise[]> = {};

    Object.entries(exercisesByCategory).forEach(([category, exercises]) => {
      const matchingExercises = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(query) || 
        exercise.description?.toLowerCase().includes(query)
      );

      if (matchingExercises.length > 0) {
        filtered[category] = matchingExercises;
      }
    });

    setFilteredExercises(filtered);
    
    // Set active tab to the first category that has matches
    if (Object.keys(filtered).length > 0 && !filtered[activeTab]) {
      setActiveTab(Object.keys(filtered)[0]);
    }
  }, [searchQuery, exercisesByCategory, activeTab]);

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setOpen(false);
  };

  const categories = Object.keys(filteredExercises);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant as any} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Exercise</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Loading exercises...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No exercises match your search</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="flex overflow-x-auto hide-scrollbar">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(category => (
              <TabsContent key={category} value={category} className="flex-1 mt-0">
                <ScrollArea className="h-[350px] pr-3">
                  <div className="space-y-1">
                    {filteredExercises[category].map(exercise => (
                      <div
                        key={exercise.id}
                        className="p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectExercise(exercise)}
                      >
                        <h4 className="font-medium">{exercise.name}</h4>
                        {exercise.description && (
                          <p className="text-sm text-muted-foreground">{exercise.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
