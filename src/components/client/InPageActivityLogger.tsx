
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CardioLog, RunLog, RestLog, logRunActivity, logCardioActivity, logRestDay } from "@/services/activity-logging-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MapPin, Timer, Activity, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

interface InPageActivityLoggerProps {
  onActivityLogged?: () => void;
}

const CARDIO_TYPES = [
  'Cycling',
  'Swimming',
  'Elliptical',
  'Rowing',
  'Stair Climber',
  'HIIT',
  'Dancing',
  'Walking',
  'Other'
];

export const InPageActivityLogger: React.FC<InPageActivityLoggerProps> = ({ 
  onActivityLogged 
}) => {
  // Shared state
  const [activeTab, setActiveTab] = useState<string>("run");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Run-specific state
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  
  // Cardio-specific state
  const [activityType, setActivityType] = useState<string>("");
  const [cardioDuration, setCardioDuration] = useState<string>("");
  
  const resetForm = () => {
    setDate(new Date());
    setNotes("");
    setDistance("");
    setDuration("");
    setLocation("");
    setActivityType("");
    setCardioDuration("");
    setCalendarOpen(false);
  };
  
  const handleRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!distance || !duration) {
      return;
    }
    
    setIsSubmitting(true);
    
    const runData: RunLog = {
      log_date: date,
      distance: parseFloat(distance),
      duration: parseInt(duration, 10),
      location,
      notes
    };
    
    try {
      const result = await logRunActivity(runData);
      
      if (result) {
        resetForm();
        if (onActivityLogged) onActivityLogged();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCardioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityType || !cardioDuration) {
      return;
    }
    
    setIsSubmitting(true);
    
    const cardioData: CardioLog = {
      log_date: date,
      activity_type: activityType,
      duration: parseInt(cardioDuration, 10),
      notes
    };
    
    try {
      const result = await logCardioActivity(cardioData);
      
      if (result) {
        resetForm();
        if (onActivityLogged) onActivityLogged();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    const restData: RestLog = {
      log_date: date,
      notes
    };
    
    try {
      const result = await logRestDay(restData);
      
      if (result) {
        resetForm();
        if (onActivityLogged) onActivityLogged();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mt-6 border rounded-lg shadow-sm p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">Log Activity</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="run" className="text-blue-700">
            <span role="img" aria-label="running" className="mr-1">🏃</span> Run
          </TabsTrigger>
          <TabsTrigger value="cardio" className="text-purple-700">
            <Activity className="h-4 w-4 mr-1" /> Cardio
          </TabsTrigger>
          <TabsTrigger value="rest" className="text-amber-700">
            <Armchair className="h-4 w-4 mr-1" /> Rest Day
          </TabsTrigger>
        </TabsList>
        
        <div className="mb-4">
          <Label>Date</Label>
          <div className="mt-1">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              onClick={() => setCalendarOpen(!calendarOpen)}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </div>
          
          {calendarOpen && (
            <div className="border rounded-md shadow-md mt-1 bg-white p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                disabled={(date) => date > new Date()}
              />
            </div>
          )}
        </div>
        
        <TabsContent value="run">
          <form onSubmit={handleRunSubmit} className="space-y-4">
            <div>
              <Label htmlFor="distance">Distance (miles)</Label>
              <div className="relative mt-1">
                <span role="img" aria-label="ruler" className="absolute left-3 top-2.5 text-muted-foreground text-sm">📏</span>
                <Input
                  id="distance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <div className="relative mt-1">
                <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Park, trail, etc."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="run-notes">Notes (optional)</Label>
              <Textarea
                id="run-notes"
                placeholder="How was your run?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] mt-1"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Run"}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="cardio">
          <form onSubmit={handleCardioSubmit} className="space-y-4">
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select
                value={activityType}
                onValueChange={setActivityType}
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {CARDIO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="cardio-duration">Duration (minutes)</Label>
              <div className="relative mt-1">
                <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cardio-duration"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={cardioDuration}
                  onChange={(e) => setCardioDuration(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardio-notes">Notes (optional)</Label>
              <Textarea
                id="cardio-notes"
                placeholder="How was your workout?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] mt-1"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Activity"}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="rest">
          <form onSubmit={handleRestSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rest-notes">Notes (optional)</Label>
              <Textarea
                id="rest-notes"
                placeholder="What did you do on your rest day? How are you feeling?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] mt-1"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Log Rest Day"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};
