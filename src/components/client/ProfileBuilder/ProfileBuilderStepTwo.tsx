
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ClientProfile } from '@/services/client-service';
import { format } from "date-fns";
import { CalendarIcon, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const eventTypes = [
  { value: 'none', label: 'Not training for a specific event' },
  { value: 'half-marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' },
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'ironman', label: 'Ironman' },
  { value: '5k', label: '5K Race' },
  { value: '10k', label: '10K Race' },
  { value: 'obstacle', label: 'Obstacle Race' },
  { value: 'cycling-event', label: 'Cycling Event' },
  { value: 'swimming-event', label: 'Swimming Event' },
  { value: 'crossfit', label: 'CrossFit Competition' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'photoshoot', label: 'Photoshoot' },
  { value: 'other', label: 'Other Event' }
];

export const ProfileBuilderStepTwo: React.FC<ProfileBuilderStepTwoProps> = ({
  profile,
  onUpdate,
  onNext,
  onBack
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile.fitness_goals || []);
  const [trainingForEvent, setTrainingForEvent] = useState<string>(profile.event_type || 'none');
  const [eventDate, setEventDate] = useState<Date | undefined>(
    profile.event_date ? new Date(profile.event_date) : undefined
  );
  const [eventName, setEventName] = useState<string>(profile.event_name || '');

  useEffect(() => {
    setSelectedGoals(profile.fitness_goals || []);
    setTrainingForEvent(profile.event_type || 'none');
    
    if (profile.event_date) {
      setEventDate(new Date(profile.event_date));
    }
    
    setEventName(profile.event_name || '');
  }, [profile]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(current => 
      current.includes(goalId)
        ? current.filter(id => id !== goalId)
        : [...current, goalId]
    );
  };

  const handleNext = () => {
    const updateData: Partial<ClientProfile> = {
      fitness_goals: selectedGoals
    };

    if (trainingForEvent !== 'none') {
      updateData.event_type = trainingForEvent;
      updateData.event_date = eventDate?.toISOString();
      updateData.event_name = eventName;
    } else {
      updateData.event_type = 'none';
      updateData.event_date = undefined;
      updateData.event_name = '';
    }

    onUpdate(updateData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 text-left">
        <h1 className="text-xl font-semibold text-black mb-2">What Are Your Fitness Goals?</h1>
        <p className="text-muted-foreground text-left">Select all that apply to you</p>
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

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-black mb-4">Are you preparing for a specific event?</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="event-type" className="block text-sm font-medium text-foreground mb-2">
              Event Type
            </label>
            <Select
              value={trainingForEvent}
              onValueChange={setTrainingForEvent}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {trainingForEvent !== 'none' && (
            <>
              <div>
                <label htmlFor="event-name" className="block text-sm font-medium text-foreground mb-2">
                  Event Name
                </label>
                <Input
                  id="event-name"
                  placeholder="NYC Marathon, My Wedding, etc."
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="event-date" className="block text-sm font-medium text-foreground mb-2">
                  Event Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? format(eventDate, "PPP") : <span>Select event date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={setEventDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button 
                  onClick={handleNext} 
                  disabled={selectedGoals.length === 0}
                  className="bg-client hover:bg-client/90"
                >
                  Next
                </Button>
              </span>
            </TooltipTrigger>
            {selectedGoals.length === 0 && (
              <TooltipContent>
                <p>Please select at least one fitness goal</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
