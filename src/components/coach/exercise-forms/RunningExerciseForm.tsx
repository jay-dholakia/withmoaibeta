
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, Ruler, MapPin } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RunningExerciseFormProps {
  distance: string;
  setDistance: (distance: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  location?: string;
  setLocation?: (location: string) => void;
  notes?: string;
  setNotes?: (notes: string) => void;
  date?: Date;
  setDate?: (date: Date) => void;
}

export const RunningExerciseForm: React.FC<RunningExerciseFormProps> = ({
  distance,
  setDistance,
  duration,
  setDuration,
  location = '',
  setLocation = () => {},
  notes = '',
  setNotes = () => {},
  date,
  setDate
}) => {
  // Helper function to format distance input
  const formatDistanceInput = (value: string): string => {
    // Allow only numbers and decimal point
    return value.replace(/[^\d.]/g, '');
  };

  // Helper function to format duration input as minutes
  const formatDurationInput = (value: string): string => {
    // Allow only numbers
    return value.replace(/[^\d]/g, '');
  };

  return (
    <div className="space-y-6">
      {setDate && date && (
        <div className="space-y-2">
          <Label htmlFor="date" className="text-base font-medium">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-left font-normal border-2 rounded-full"
                id="date"
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground/70" />
                {date ? format(date, "MMMM d'th', yyyy") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="distance" className="text-base font-medium">Distance (miles)</Label>
        <div className="relative">
          <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input
            id="distance"
            type="text"
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(formatDistanceInput(e.target.value))}
            placeholder="3.1"
            className="pl-12 h-14 rounded-full border-2"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="duration" className="text-base font-medium">Duration (minutes)</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input
            id="duration"
            type="text"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(formatDurationInput(e.target.value))}
            placeholder="30"
            className="pl-12 h-14 rounded-full border-2"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location" className="text-base font-medium">Location (optional)</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Park, trail, etc."
            className="pl-12 h-14 rounded-full border-2"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-medium">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was your run?"
          className="min-h-[120px] rounded-3xl border-2 p-4"
        />
      </div>
    </div>
  );
};
