
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ClientProfile } from '@/services/client-service';
import { Activity } from 'lucide-react';

interface ProfileBuilderStepThreeProps {
  profile: Partial<ClientProfile>;
  onUpdate: (data: Partial<ClientProfile>) => void;
  onComplete: () => void;
  onBack: () => void;
}

interface MovementOption {
  label: string;
  emoji: string;
}

export const ProfileBuilderStepThree: React.FC<ProfileBuilderStepThreeProps> = ({
  profile,
  onUpdate,
  onComplete,
  onBack
}) => {
  const [movements, setMovements] = useState<string[]>(profile.favorite_movements || []);

  // Update movements when profile changes
  useEffect(() => {
    setMovements(profile.favorite_movements || []);
  }, [profile]);

  const movementOptions: MovementOption[] = [
    { label: 'Walking', emoji: '🚶' },
    { label: 'Running', emoji: '🏃' },
    { label: 'Swimming', emoji: '🏊' },
    { label: 'Cycling', emoji: '🚴' },
    { label: 'Weight Training', emoji: '🏋️' },
    { label: 'Yoga', emoji: '🧘' },
    { label: 'Dance', emoji: '💃' },
    { label: 'Hiking', emoji: '🥾' },
    { label: 'Basketball', emoji: '🏀' },
    { label: 'Soccer', emoji: '⚽' },
    { label: 'Tennis', emoji: '🎾' },
    { label: 'Volleyball', emoji: '🏐' },
    { label: 'Pilates', emoji: '🤸' },
    { label: 'CrossFit', emoji: '💪' },
    { label: 'Martial Arts', emoji: '🥋' },
    { label: 'Rock Climbing', emoji: '🧗' },
    { label: 'Skating', emoji: '⛸️' },
    { label: 'Skiing', emoji: '⛷️' },
    { label: 'Snowboarding', emoji: '🏂' },
    { label: 'Rowing', emoji: '🚣' },
    { label: 'Surfing', emoji: '🏄' },
    { label: 'Golf', emoji: '🏌️' },
    { label: 'Boxing', emoji: '🥊' },
    { label: 'Paddleboarding', emoji: '🏄‍♂️' },
    { label: 'Trail Running', emoji: '🏞️' },
    // Additional movement options
    { label: 'Badminton', emoji: '🏸' },
    { label: 'Table Tennis', emoji: '🏓' },
    { label: 'Baseball', emoji: '⚾' },
    { label: 'Cricket', emoji: '🏏' },
    { label: 'Rugby', emoji: '🏉' },
    { label: 'Football', emoji: '🏈' },
    { label: 'Archery', emoji: '🏹' },
    { label: 'Horseback Riding', emoji: '🏇' },
    { label: 'Gymnastics', emoji: '🤸‍♀️' },
    { label: 'Parkour', emoji: '🧱' },
    { label: 'Skateboarding', emoji: '🛹' },
    { label: 'Ice Hockey', emoji: '🏒' },
    { label: 'Handball', emoji: '🤾' },
    { label: 'Diving', emoji: '🤿' },
    { label: 'Fencing', emoji: '🤺' },
  ];

  const toggleMovement = (movement: string) => {
    if (movements.includes(movement)) {
      setMovements(movements.filter(m => m !== movement));
    } else {
      setMovements([...movements, movement]);
    }
  };

  const handleComplete = () => {
    onUpdate({ 
      favorite_movements: movements,
      profile_completed: true
    });
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-6 w-6 text-client" />
          <h1 className="text-2xl font-bold text-client">Favorite Ways to Move</h1>
        </div>
        <p className="text-muted-foreground">Select your favorite ways to move and be active</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {movementOptions.map((option) => (
            <div
              key={option.label}
              onClick={() => toggleMovement(option.label)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all
                ${movements.includes(option.label) 
                  ? 'bg-client/10 border-client text-client font-medium' 
                  : 'bg-background border-input hover:bg-muted/50'}
              `}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className="text-sm whitespace-nowrap truncate">{option.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleComplete} 
          className="bg-client hover:bg-client/90"
          disabled={movements.length === 0}
        >
          Complete Profile
        </Button>
      </div>
    </div>
  );
};
