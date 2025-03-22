
import React from 'react';
import { Button } from '@/components/ui/button';
import { Umbrella } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRemainingPasses } from '@/services/life-happens-service';
import { toast } from 'sonner';

const LifeHappensButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: remainingPasses } = useQuery({
    queryKey: ['life-happens-passes', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return await getRemainingPasses(user.id);
    },
    enabled: !!user?.id,
  });

  const handleLifeHappensClick = () => {
    if (!remainingPasses || remainingPasses <= 0) {
      toast.error("You don't have any Life Happens passes remaining this month");
      return;
    }
    
    // Navigate to a new page where the user can select which workout to use the pass for
    navigate('/client-dashboard/workouts/create');
    toast.info("Create a workout to use with your Life Happens pass");
  };

  return (
    <div className="mt-8 border-t pt-6">
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        onClick={handleLifeHappensClick}
      >
        <Umbrella className="h-4 w-4" />
        Use Life Happens Pass
        {typeof remainingPasses === 'number' && (
          <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">
            {remainingPasses} remaining
          </span>
        )}
      </Button>
      <p className="text-xs text-center mt-2 text-muted-foreground">
        Sometimes life gets in the way. Use a pass to get credit for a missed workout.
      </p>
    </div>
  );
};

export default LifeHappensButton;
