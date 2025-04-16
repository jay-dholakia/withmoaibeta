
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import { RunLog, logRunActivity } from '@/services/activity-logging-service';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const LogRunPage = () => {
  const navigate = useNavigate();
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState<'indoor' | 'outdoor' | ''>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!distance.trim()) {
      toast.error('Please enter a distance');
      return;
    }
    
    if (!duration.trim()) {
      toast.error('Please enter a duration');
      return;
    }
    
    setIsSubmitting(true);
    
    const runData: RunLog = {
      distance: parseFloat(distance),
      duration: duration, // This is correct if the API accepts string durations
      location: location || undefined,
      notes: notes.trim() || undefined,
      log_date: date
    };
    
    try {
      const result = await logRunActivity(runData);
      
      if (result) {
        toast.success('Run activity logged successfully!');
        document.dispatchEvent(new Event('refresh-weekly-progress'));
        navigate('/client-dashboard/workouts');
      }
    } catch (error) {
      console.error('Error logging run activity:', error);
      toast.error('Failed to log run activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDurationInput = (value: string): string => {
    // Keep only digits and colons
    let cleaned = value.replace(/[^\d:]/g, '');
    
    // Ensure no more than 2 colons
    const parts = cleaned.split(':');
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }
    
    return cleaned;
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mb-4 border border-gray-200 hover:border-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
      </div>
      
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Log Run Activity
          </CardTitle>
          <CardDescription>
            Record your run details to track your progress
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-left block">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="distance" className="text-sm font-medium text-left block">
                Distance (miles) <span className="text-red-500">*</span>
              </label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="text-left"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium text-left block">
                Duration (hh:mm:ss) <span className="text-red-500">*</span>
              </label>
              <Input
                id="duration"
                placeholder="00:30:00"
                value={duration}
                onChange={(e) => setDuration(formatDurationInput(e.target.value))}
                className="text-left"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-left block">
                Location
              </label>
              <ToggleGroup 
                type="single" 
                className="justify-start"
                value={location}
                onValueChange={(value) => {
                  if (value) setLocation(value as 'indoor' | 'outdoor');
                }}
              >
                <ToggleGroupItem 
                  value="indoor" 
                  className="text-sm border border-gray-300 hover:border-blue-300 data-[state=on]:border-blue-500"
                >
                  Indoor
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="outdoor" 
                  className="text-sm border border-gray-300 hover:border-blue-300 data-[state=on]:border-blue-500"
                >
                  Outdoor
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-left block">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="How was your run? Add any relevant details here."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-left"
                rows={3}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Log Run
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LogRunPage;
