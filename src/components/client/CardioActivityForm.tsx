
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CardioActivity } from '@/types/workout';
import { logCardioActivity } from '@/services/run-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CardioActivityFormProps {
  onSuccess?: () => void;
}

const CARDIO_TYPES = [
  { value: 'cycling', label: 'Cycling' },
  { value: 'elliptical', label: 'Elliptical' },
  { value: 'rowing', label: 'Rowing' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'stair_climber', label: 'Stair Climber' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'walking', label: 'Walking' },
  { value: 'other', label: 'Other' },
];

const CardioActivityForm: React.FC<CardioActivityFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cardioActivity, setCardioActivity] = useState<Partial<CardioActivity>>({
    minutes: undefined,
    activity_type: undefined,
    notes: '',
    completed_at: new Date().toISOString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCardioActivity(prev => ({ 
      ...prev, 
      [name]: name === 'minutes' ? parseInt(value) || '' : value 
    }));
  };

  const handleActivityTypeChange = (value: string) => {
    setCardioActivity(prev => ({ ...prev, activity_type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to log cardio activity');
      return;
    }
    
    if (!cardioActivity.minutes || cardioActivity.minutes <= 0) {
      toast.error('Please enter a valid duration in minutes');
      return;
    }
    
    if (!cardioActivity.activity_type) {
      toast.error('Please select an activity type');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const activity: Omit<CardioActivity, 'id' | 'created_at'> = {
        user_id: user.id,
        minutes: cardioActivity.minutes as number,
        activity_type: cardioActivity.activity_type as string,
        notes: cardioActivity.notes || '',
        completed_at: cardioActivity.completed_at || new Date().toISOString(),
      };
      
      const result = await logCardioActivity(activity);
      
      if (result) {
        toast.success('Cardio activity logged successfully!');
        setCardioActivity({
          minutes: undefined,
          activity_type: undefined,
          notes: '',
          completed_at: new Date().toISOString(),
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to log cardio activity');
      }
    } catch (error) {
      console.error('Error logging cardio activity:', error);
      toast.error('An error occurred while logging cardio activity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="minutes">Duration (minutes)</Label>
        <Input
          id="minutes"
          name="minutes"
          type="number"
          min="1"
          placeholder="Enter duration in minutes"
          value={cardioActivity.minutes || ''}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="activity_type">Activity Type</Label>
        <Select 
          value={cardioActivity.activity_type} 
          onValueChange={handleActivityTypeChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {CARDIO_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Add any notes about your cardio activity"
          value={cardioActivity.notes || ''}
          onChange={handleChange}
          rows={3}
        />
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging...
          </>
        ) : (
          'Log Cardio'
        )}
      </Button>
    </form>
  );
};

export default CardioActivityForm;
