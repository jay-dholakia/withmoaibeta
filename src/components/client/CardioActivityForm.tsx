
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logCardioActivity } from '@/services/run-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CardioActivityFormProps {
  onSuccess: () => void;
}

const CARDIO_TYPES = [
  'Cycling',
  'Elliptical',
  'Swimming',
  'Rowing',
  'Stair Climber',
  'HIIT Workout',
  'Jump Rope',
  'Dancing',
  'Aerobics',
  'Other'
];

const CardioActivityForm: React.FC<CardioActivityFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [activityType, setActivityType] = useState(CARDIO_TYPES[0]);
  const [otherActivity, setOtherActivity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to log cardio activities');
      return;
    }
    
    if (!minutes || parseInt(minutes) <= 0) {
      toast.error('Please enter a valid duration in minutes');
      return;
    }
    
    const finalActivityType = activityType === 'Other' && otherActivity
      ? otherActivity.trim()
      : activityType;
      
    if (!finalActivityType) {
      toast.error('Please specify the activity type');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await logCardioActivity({
        user_id: user.id,
        minutes: parseInt(minutes),
        activity_type: finalActivityType,
        notes: notes.trim() || undefined,
        completed_at: new Date().toISOString()
      });
      
      if (result) {
        toast.success('Cardio activity logged successfully!');
        setMinutes('');
        setNotes('');
        if (activityType === 'Other') {
          setOtherActivity('');
        }
        onSuccess();
      } else {
        toast.error('Failed to log cardio activity');
      }
    } catch (error) {
      console.error('Error logging cardio activity:', error);
      toast.error('An error occurred while logging your cardio activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minutes">Duration (minutes)</Label>
          <Input
            id="minutes"
            type="number"
            min="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="30"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="activity-type">Activity Type</Label>
          <Select 
            value={activityType} 
            onValueChange={setActivityType}
          >
            <SelectTrigger id="activity-type">
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              {CARDIO_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {activityType === 'Other' && (
        <div className="space-y-2">
          <Label htmlFor="other-activity">Specify Activity</Label>
          <Input
            id="other-activity"
            value={otherActivity}
            onChange={(e) => setOtherActivity(e.target.value)}
            placeholder="Enter activity type"
            required
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any challenges or achievements?"
          rows={3}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging Activity...
          </>
        ) : 'Log Cardio Activity'}
      </Button>
    </form>
  );
};

export default CardioActivityForm;
