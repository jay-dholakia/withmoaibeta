
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientProfile } from '@/services/client-service';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface ProfileBuilderStepTwoProps {
  profile: Partial<ClientProfile>;
  onUpdate: (data: Partial<ClientProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

const fitnessGoals = [
  { id: 'weight-loss', label: 'Weight Loss' },
  { id: 'muscle-gain', label: 'Muscle Gain' },
  { id: 'strength', label: 'Increase Strength' },
  { id: 'endurance', label: 'Improve Endurance' },
  { id: 'flexibility', label: 'Improve Flexibility' },
  { id: 'overall-health', label: 'Better Overall Health' },
  { id: 'athletic-performance', label: 'Athletic Performance' },
  { id: 'post-injury', label: 'Post-Injury Recovery' },
  { id: 'mental-health', label: 'Mental Health Benefits' },
  { id: 'stress-reduction', label: 'Stress Reduction' }
];

export const ProfileBuilderStepTwo: React.FC<ProfileBuilderStepTwoProps> = ({
  profile,
  onUpdate,
  onNext,
  onBack
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile.fitness_goals || []);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(current => 
      current.includes(goalId)
        ? current.filter(id => id !== goalId)
        : [...current, goalId]
    );
  };

  const handleNext = () => {
    onUpdate({ fitness_goals: selectedGoals });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-client mb-2">What Are Your Fitness Goals?</h1>
        <p className="text-muted-foreground">Select all that apply to you</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fitnessGoals.map(goal => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all
              ${selectedGoals.includes(goal.id) 
                ? 'border-client bg-client/10 text-client' 
                : 'border-border hover:border-client/50 hover:bg-muted'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border
                flex items-center justify-center
                ${selectedGoals.includes(goal.id) 
                  ? 'border-client bg-client text-white' 
                  : 'border-muted-foreground'} 
              `}>
                {selectedGoals.includes(goal.id) && <Check className="h-3 w-3" />}
              </div>
              <span className="font-medium">{goal.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={selectedGoals.length === 0}
          className="bg-client hover:bg-client/90"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
