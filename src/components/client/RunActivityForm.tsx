
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logRunActivity } from '@/services/run-service';
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
import { format } from 'date-fns';

interface RunActivityFormProps {
  onSuccess: () => void;
}

const RunActivityForm: React.FC<RunActivityFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distance, setDistance] = useState('');
  const [runType, setRunType] = useState<'steady' | 'tempo' | 'long' | 'speed' | 'hill'>('steady');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to log runs');
      return;
    }
    
    if (!distance || parseFloat(distance) <= 0) {
      toast.error('Please enter a valid distance');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await logRunActivity({
        user_id: user.id,
        distance: parseFloat(distance),
        run_type: runType,
        notes: notes.trim() || undefined,
        completed_at: new Date().toISOString()
      });
      
      if (result) {
        toast.success('Run logged successfully!');
        setDistance('');
        setNotes('');
        onSuccess();
      } else {
        toast.error('Failed to log run');
      }
    } catch (error) {
      console.error('Error logging run:', error);
      toast.error('An error occurred while logging your run');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance">Distance (miles)</Label>
          <Input
            id="distance"
            type="number"
            step="0.01"
            min="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="3.1"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="run-type">Run Type</Label>
          <Select 
            value={runType} 
            onValueChange={(value: 'steady' | 'tempo' | 'long' | 'speed' | 'hill') => setRunType(value)}
          >
            <SelectTrigger id="run-type">
              <SelectValue placeholder="Select run type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="steady">Steady Run</SelectItem>
              <SelectItem value="tempo">Tempo Run</SelectItem>
              <SelectItem value="long">Long Run</SelectItem>
              <SelectItem value="speed">Speed Workout</SelectItem>
              <SelectItem value="hill">Hill Workout</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? What was the terrain like? Any challenges?"
          rows={3}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging Run...
          </>
        ) : 'Log Run'}
      </Button>
    </form>
  );
};

export default RunActivityForm;
