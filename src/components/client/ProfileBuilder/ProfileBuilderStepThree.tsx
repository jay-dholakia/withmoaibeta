import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientProfile } from '@/services/client-service';
import { 
  Activity, 
  User2, 
  UserRound, 
  Bike, 
  Dumbbell, 
  Music, 
  Mountain, 
  Waves,
  Snowflake, 
  Hammer, 
  Workflow,
  LifeBuoy,
  PenTool,
  Sailboat,
  Ship,
  Map,
  Footprints,
  Bird,
  Heart,
  Timer,
  Medal,
  Anchor,
  Mic2,
  Sword,
  Flame
} from 'lucide-react';

interface ProfileBuilderStepThreeProps {
  profile: Partial<ClientProfile>;
  onUpdate: (data: Partial<ClientProfile>) => void;
  onComplete: () => void;
  onBack: () => void;
}

interface MovementOption {
  label: string;
  icon: React.ReactNode;
}

export const ProfileBuilderStepThree: React.FC<ProfileBuilderStepThreeProps> = ({
  profile,
  onUpdate,
  onComplete,
  onBack
}) => {
  const [movements, setMovements] = useState<string[]>(profile.favorite_movements || []);

  const movementOptions: MovementOption[] = [
    { label: 'Walking', icon: <Footprints className="h-5 w-5" /> },
    { label: 'Running', icon: <User2 className="h-5 w-5" /> },
    { label: 'Swimming', icon: <Waves className="h-5 w-5" /> },
    { label: 'Cycling', icon: <Bike className="h-5 w-5" /> },
    { label: 'Weight Training', icon: <Dumbbell className="h-5 w-5" /> },
    { label: 'Yoga', icon: <Activity className="h-5 w-5 rotate-45" /> },
    { label: 'Dance', icon: <Music className="h-5 w-5" /> },
    { label: 'Hiking', icon: <Mountain className="h-5 w-5" /> },
    { label: 'Basketball', icon: <Timer className="h-5 w-5" /> },
    { label: 'Soccer', icon: <Flame className="h-5 w-5" /> },
    { label: 'Tennis', icon: <PenTool className="h-5 w-5" /> },
    { label: 'Volleyball', icon: <Medal className="h-5 w-5" /> },
    { label: 'Pilates', icon: <Heart className="h-5 w-5" /> },
    { label: 'CrossFit', icon: <Workflow className="h-5 w-5" /> },
    { label: 'Martial Arts', icon: <Sword className="h-5 w-5" /> },
    { label: 'Rock Climbing', icon: <Mountain className="h-5 w-5" /> },
    { label: 'Skating', icon: <PenTool className="h-5 w-5" /> },
    { label: 'Skiing', icon: <Bird className="h-5 w-5" /> },
    { label: 'Snowboarding', icon: <Snowflake className="h-5 w-5" /> },
    { label: 'Rowing', icon: <Ship className="h-5 w-5" /> },
    { label: 'Surfing', icon: <Waves className="h-5 w-5" /> },
    { label: 'Golf', icon: <Hammer className="h-5 w-5" /> },
    { label: 'Boxing', icon: <Hammer className="h-5 w-5" /> },
    { label: 'Paddleboarding', icon: <Sailboat className="h-5 w-5" /> },
    { label: 'Trail Running', icon: <Map className="h-5 w-5" /> },
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
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
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
              {option.icon}
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
