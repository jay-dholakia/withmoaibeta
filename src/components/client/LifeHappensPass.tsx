
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Umbrella, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getRemainingPasses, MAX_MONTHLY_PASSES } from '@/services/life-happens-service';

interface LifeHappensPassProps {
  onUsePass: () => void;
  isLoading: boolean;
}

const LifeHappensPass: React.FC<LifeHappensPassProps> = ({ onUsePass, isLoading }) => {
  const { user } = useAuth();
  
  const { data: remainingPasses, isLoading: isLoadingPasses } = useQuery({
    queryKey: ['life-happens-passes', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return await getRemainingPasses(user.id);
    },
    enabled: !!user?.id,
  });
  
  const hasRemaining = (remainingPasses ?? 0) > 0;
  
  return (
    <Card className={`w-full ${hasRemaining ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Umbrella className={`h-5 w-5 mr-2 ${hasRemaining ? 'text-blue-600' : 'text-gray-400'}`} />
          Life Happens
        </CardTitle>
        <CardDescription>
          {hasRemaining 
            ? `You have ${remainingPasses} of ${MAX_MONTHLY_PASSES} passes remaining this month` 
            : "You've used all your passes this month"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            When workouts get in the way of life, use a pass to get credit for a workout.
          </p>
          
          <Button
            variant="outline"
            className={`w-full ${hasRemaining ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'text-gray-400'}`}
            disabled={!hasRemaining || isLoading || isLoadingPasses}
            onClick={onUsePass}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
            ) : !hasRemaining ? (
              <><AlertCircle className="mr-2 h-4 w-4" /> No passes remaining</>
            ) : (
              <><Umbrella className="mr-2 h-4 w-4" /> Use Life Happens</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LifeHappensPass;
