import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import StandaloneWorkoutForm from '@/components/coach/StandaloneWorkoutForm';
import { fetchStandaloneWorkouts, deleteStandaloneWorkout } from '@/services/workout-service';
import { StandaloneWorkout } from '@/types/workout';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const StandaloneWorkoutsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [workouts, setWorkouts] = useState<StandaloneWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!user?.id) return;
    
    const loadWorkouts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchStandaloneWorkouts(user.id);
        setWorkouts(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading workouts:', error);
        toast.error('Failed to load workouts');
        setIsLoading(false);
      }
    };
    
    loadWorkouts();
  }, [user]);
  
  const handleSaveWorkout = () => {
    if (!user?.id) return;
    
    fetchStandaloneWorkouts(user.id)
      .then(data => {
        setWorkouts(data);
        setIsCreating(false);
        setIsEditingId(null);
      })
      .catch(error => {
        console.error('Error refreshing workouts:', error);
      });
  };
  
  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutId) return;
    
    try {
      setIsDeleting(true);
      await deleteStandaloneWorkout(deleteWorkoutId);
      
      // Update the list
      if (user?.id) {
        const updatedWorkouts = await fetchStandaloneWorkouts(user.id);
        setWorkouts(updatedWorkouts);
      }
      
      toast.success('Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    } finally {
      setIsDeleting(false);
      setDeleteWorkoutId(null);
    }
  };
  
  const filteredWorkouts = searchTerm 
    ? workouts.filter(w => 
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (w.category && w.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : workouts;
  
  const sortedWorkouts = [...filteredWorkouts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return (
    <CoachLayout>
      <div className="w-full px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Workout Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage reusable workout templates to add to your programs
            </p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workout Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Workout Template</DialogTitle>
                <DialogDescription>
                  Create a reusable workout template that you can add to any program
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[80vh]">
                <StandaloneWorkoutForm />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workout templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse w-full">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedWorkouts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10 w-full">
            <h3 className="font-medium text-lg mb-2">No workout templates yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first workout template to get started
            </p>
            <Button 
              onClick={() => setIsCreating(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Workout Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {sortedWorkouts.map((workout) => (
              <Card key={workout.id} className="w-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{workout.title}</CardTitle>
                      {workout.category && (
                        <CardDescription>
                          Category: {workout.category}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Dialog 
                        open={isEditingId === workout.id} 
                        onOpenChange={(open) => setIsEditingId(open ? workout.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit workout</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Edit Workout Template</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[80vh]">
                            <StandaloneWorkoutForm />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteWorkoutId(workout.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete workout</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {workout.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {workout.description}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingId(workout.id)}
                    >
                      View & Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <AlertDialog 
          open={deleteWorkoutId !== null}
          onOpenChange={(open) => !open && setDeleteWorkoutId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workout template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteWorkout}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CoachLayout>
  );
};

export default StandaloneWorkoutsPage;
