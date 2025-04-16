
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, Armchair } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RestLog, logRestDay } from '@/services/activity-logging-service';

const LogRestDayPage: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const restData: RestLog = {
      log_date: date,
      notes
    };

    try {
      const result = await logRestDay(restData);

      if (result) {
        navigate('/client-dashboard/workouts');
      }
    } catch (error) {
      console.error('Error logging rest day:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected) {
      setDate(selected);
      setDatePickerOpen(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Log Rest Day</h1>
        <p className="text-muted-foreground">Record your rest day and any notes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rest-date">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="rest-date"
                  variant="outline"
                  onClick={() => setDatePickerOpen((prev) => !prev)}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(d) => d > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="What did you do on your rest day? How are you feeling?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/client-dashboard/workouts')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? "Saving..." : "Log Rest Day"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LogRestDayPage;
