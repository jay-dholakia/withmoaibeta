
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RunActivity } from '@/types/workout';
import { logRunActivity } from '@/services/run-service';
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

interface RunActivityFormProps {
  onSuccess?: () => void;
}

const RUN_TYPES = [
  { value: 'steady', label: 'Short & Steady' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'long', label: 'Long' },
  { value: 'speed', label: 'Speed' },
  { value: 'hill', label: 'Hill' },
];

const RunActivityForm: React.FC<RunActivityFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [runActivity, setRunActivity] = useState<Partial<RunActivity>>({
    distance: undefined,
    run_type: undefined,
    notes: '',
    completed_at: new Date().toISOString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRunActivity(prev => ({ ...prev, [name]: name === 'distance' ? parseFloat(value) || '' : value }));
  };

  const handleRunTypeChange = (value: string) => {
    setRunActivity(prev => ({ ...prev, run_type: value as RunActivity['run_type'] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to log a run');
      return;
    }
    
    if (!runActivity.distance || runActivity.distance <= 0) {
      toast.error('Please enter a valid distance');
      return;
    }
    
    if (!runActivity.run_type) {
      toast.error('Please select a run type');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const activity: Omit<RunActivity, 'id' | 'created_at'> = {
        user_id: user.id,
        distance: runActivity.distance as number,
        run_type: runActivity.run_type as RunActivity['run_type'],
        notes: runActivity.notes || '',
        completed_at: runActivity.completed_at || new Date().toISOString(),
      };
      
      const result = await logRunActivity(activity);
      
      if (result) {
        toast.success('Run activity logged successfully!');
        setRunActivity({
          distance: undefined,
          run_type: undefined,
          notes: '',
          completed_at: new Date().toISOString(),
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to log run activity');
      }
    } catch (error) {
      console.error('Error logging run activity:', error);
      toast.error('An error occurred while logging run activity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="distance">Distance (miles)</Label>
        <Input
          id="distance"
          name="distance"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Enter distance in miles"
          value={runActivity.distance || ''}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="run_type">Run Type</Label>
        <Select 
          value={runActivity.run_type} 
          onValueChange={handleRunTypeChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select run type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {RUN_TYPES.map(type => (
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
          placeholder="Add any notes about your run"
          value={runActivity.notes || ''}
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
          'Log Run'
        )}
      </Button>
    </form>
  );
};

export default RunActivityForm;
