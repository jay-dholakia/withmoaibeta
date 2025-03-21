
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientProfile } from '@/services/client-service';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProfileBuilderStepThreeProps {
  profile: Partial<ClientProfile>;
  onUpdate: (data: Partial<ClientProfile>) => void;
  onComplete: () => void;
  onBack: () => void;
}

const suggestedMovements = [
  'Running', 'Swimming', 'Cycling', 'Yoga', 'Pilates', 
  'Weight Training', 'HIIT', 'Boxing', 'Dancing', 'Hiking',
  'Basketball', 'Soccer', 'Tennis', 'CrossFit', 'Climbing',
  'Martial Arts', 'Rowing', 'Spinning', 'Bodyweight Training'
];

export const ProfileBuilderStepThree: React.FC<ProfileBuilderStepThreeProps> = ({
  profile,
  onUpdate,
  onComplete,
  onBack
}) => {
  const [movements, setMovements] = useState<string[]>(profile.favorite_movements || []);
  const [newMovement, setNewMovement] = useState('');

  const addMovement = (movement: string) => {
    const trimmed = movement.trim();
    if (trimmed && !movements.includes(trimmed)) {
      setMovements([...movements, trimmed]);
      setNewMovement('');
    }
  };

  const removeMovement = (movement: string) => {
    setMovements(movements.filter(m => m !== movement));
  };

  const handleAddSuggested = (movement: string) => {
    if (!movements.includes(movement)) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMovement(newMovement);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-client mb-2">How Do You Like to Move?</h1>
        <p className="text-muted-foreground">Tell us your favorite ways to move and be active</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={newMovement}
              onChange={(e) => setNewMovement(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter an activity (e.g. Running)"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addMovement(newMovement)}
              disabled={!newMovement.trim()}
              size="icon"
              className="bg-client hover:bg-client/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {movements.map(movement => (
              <Badge
                key={movement}
                variant="secondary"
                className="group flex items-center gap-1 px-3 py-1.5"
              >
                {movement}
                <button 
                  onClick={() => removeMovement(movement)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {movements.length === 0 && (
              <div className="text-sm text-muted-foreground italic">
                No activities added yet
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Suggested Activities</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedMovements
              .filter(m => !movements.includes(m))
              .slice(0, 12)
              .map(movement => (
                <Badge
                  key={movement}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleAddSuggested(movement)}
                >
                  {movement}
                </Badge>
              ))}
          </div>
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
        >
          Complete Profile
        </Button>
      </div>
    </div>
  );
};
