
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUserRunGoals, setUserRunGoals } from '@/services/run-goals-service';
import { Loader2, Save } from 'lucide-react';

interface RunGoalsFormProps {
  userId: string;
  clientEmail?: string;
}

export const RunGoalsForm: React.FC<RunGoalsFormProps> = ({ userId, clientEmail }) => {
  const queryClient = useQueryClient();
  const [goals, setGoals] = useState({
    miles_goal: 10,
    exercises_goal: 20,
    cardio_minutes_goal: 60
  });

  // Fetch existing run goals
  const { data, isLoading, error } = useQuery({
    queryKey: ['run-goals', userId],
    queryFn: () => getUserRunGoals(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (data) {
      setGoals({
        miles_goal: data.miles_goal,
        exercises_goal: data.exercises_goal,
        cardio_minutes_goal: data.cardio_minutes_goal
      });
    }
  }, [data]);

  const updateGoalsMutation = useMutation({
    mutationFn: (updatedGoals: typeof goals) => 
      setUserRunGoals(userId, updatedGoals),
    onSuccess: () => {
      toast.success('Run goals updated successfully');
      queryClient.invalidateQueries({ queryKey: ['run-goals', userId] });
    },
    onError: (error) => {
      console.error('Failed to update run goals:', error);
      toast.error('Failed to update run goals');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoals(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateGoalsMutation.mutate(goals);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive">Error loading run goals</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Run Goals</CardTitle>
        <CardDescription>
          {clientEmail 
            ? `Set weekly performance goals for ${clientEmail}`
            : "Set your weekly performance goals"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="miles_goal">Weekly Miles Goal</Label>
            <Input 
              id="miles_goal"
              name="miles_goal"
              type="number"
              value={goals.miles_goal}
              onChange={handleChange}
              step="0.1"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exercises_goal">Weekly Exercises Goal</Label>
            <Input 
              id="exercises_goal"
              name="exercises_goal"
              type="number"
              value={goals.exercises_goal}
              onChange={handleChange}
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cardio_minutes_goal">Weekly Cardio Minutes Goal</Label>
            <Input 
              id="cardio_minutes_goal"
              name="cardio_minutes_goal"
              type="number"
              value={goals.cardio_minutes_goal}
              onChange={handleChange}
              min="0"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={updateGoalsMutation.isPending}
          >
            {updateGoalsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Goals
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
