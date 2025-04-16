
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
import { CardioLog, logCardioActivity } from '@/services/activity-logging-service';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CARDIO_TYPES = [
  'Cycling',
  'Elliptical',
  'HIIT',
  'Rowing',
  'Stair Climber',
  'Swimming',
  'Walking',
  'Other'
];

const LogCardioPage = () => {
  const navigate = useNavigate();
  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityType) {
      toast.error('Please select an activity type');
      return;
    }
    
    if (!duration.trim()) {
      toast.error('Please enter a duration');
      return;
    }
    
    setIsSubmitting(true);
    
    const cardioData: CardioLog = {
      activity_type: activityType,
      duration: parseInt(duration),
      notes: notes.trim() || undefined,
      log_date: date
    };
    
    try {
      const result = await logCardioActivity(cardioData);
      
      if (result) {
        toast.success('Cardio activity logged successfully!');
        document.dispatchEvent(new Event('refresh-weekly-progress'));
        navigate('/client-dashboard/workouts');
      }
    } catch (error) {
      console.error('Error logging cardio activity:', error);
      toast.error('Failed to log cardio activity');
    } finally {
      setIsSubmitting(false);
    }
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
            Log Cardio Activity
          </CardTitle>
          <CardDescription>
            Record your cardio workout details
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
              <label htmlFor="activityType" className="text-sm font-medium text-left block">
                Activity Type <span className="text-red-500">*</span>
              </label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="text-left">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {CARDIO_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium text-left block">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="text-left"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-left block">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="How was your workout? Add any relevant details here."
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
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Log Cardio
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LogCardioPage;
