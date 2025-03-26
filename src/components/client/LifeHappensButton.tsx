
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Umbrella, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRemainingPasses, createLifeHappensCompletion } from '@/services/life-happens-service';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const LifeHappensButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: remainingPasses, isLoading: isLoadingPasses } = useQuery({
    queryKey: ['life-happens-passes', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      console.log("Fetching remaining passes for user:", user.id);
      const passes = await getRemainingPasses(user.id);
      console.log("Remaining passes:", passes);
      return passes;
    },
    enabled: !!user?.id,
  });

  const lifeHappensMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        console.error("No user ID available");
        return false;
      }
      
      console.log("Starting life happens mutation for user:", user.id);
      
      const completionId = await createLifeHappensCompletion(user.id, "Life happens pass used");
      console.log("Completion ID from mutation:", completionId);
      return !!completionId;
    },
    onSuccess: () => {
      toast.success('Life happens pass used successfully!');
      
      queryClient.invalidateQueries({ queryKey: ['life-happens-passes'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['client-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });
      queryClient.invalidateQueries({ queryKey: ['client-group-data'] });
      
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error using life happens pass:', error);
      toast.error('Failed to use life happens pass');
      setDialogOpen(false);
    },
  });

  const handleLifeHappensClick = () => {
    if (!remainingPasses || remainingPasses <= 0) {
      toast.error("You don't have any Life Happens passes remaining this month");
      return;
    }
    
    setDialogOpen(true);
  };

  const handleConfirmUsePass = () => {
    console.log("Confirming use of life happens pass");
    lifeHappensMutation.mutate();
  };

  return (
    <>
      <div className="mt-8 border-t pt-6">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={handleLifeHappensClick}
        >
          <Umbrella className="h-4 w-4" />
          Use Life Happens {remainingPasses !== undefined && `(${remainingPasses} remaining)`}
        </Button>
        <p className="text-xs text-center mt-2 text-muted-foreground">
          When workouts get in the way of life, use a pass to get credit for a workout.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Umbrella className="h-5 w-5 text-blue-600" />
              Use Life Happens
            </DialogTitle>
            <DialogDescription>
              This will mark a workout as complete without actually doing one.
              You have {remainingPasses} pass{remainingPasses !== 1 ? 'es' : ''} remaining this month.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Life happens, and sometimes we miss workouts. 
              Using a Life Happens pass will count towards your workout streak and completion goals.
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUsePass}
              disabled={lifeHappensMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white sm:w-auto w-full"
            >
              {lifeHappensMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Umbrella className="mr-2 h-4 w-4" />
                  Use Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LifeHappensButton;
