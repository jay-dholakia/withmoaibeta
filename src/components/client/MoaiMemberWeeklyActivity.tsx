
import React from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Calendar, CheckCircle2, Clock, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkoutHistoryItem } from '@/types/workout';

interface MemberWeeklyActivityProps {
  userId: string;
  userName: string;
}

const MoaiMemberWeeklyActivity: React.FC<MemberWeeklyActivityProps> = ({ userId, userName }) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const { data: workouts, isLoading } = useQuery({
    queryKey: ['member-weekly-workouts', userId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout:workout_id (
            title,
            description,
            workout_type
          )
        `)
        .eq('user_id', userId)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString())
        .order('completed_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching member workouts:', error);
        throw error;
      }
      
      return data as WorkoutHistoryItem[];
    },
    staleTime: 60000 // 1 minute
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-client" />
      </div>
    );
  }
  
  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-3 text-sm text-muted-foreground">
        No workouts completed this week
      </div>
    );
  }
  
  return (
    <div className="pt-1">
      <Accordion type="single" collapsible className="w-full">
        {workouts.map((workout) => (
          <AccordionItem key={workout.id} value={workout.id} className="border-b border-b-slate-200">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>
                    {workout.title || workout.workout?.title || "Workout"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(workout.completed_at), 'E, MMM d')}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-3 text-sm">
              <div className="flex flex-col space-y-2">
                {workout.workout_type && (
                  <Badge variant="outline" className="self-start">
                    {workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)}
                  </Badge>
                )}
                
                {workout.notes && (
                  <div className="italic text-muted-foreground border-l-2 border-slate-200 pl-3 mt-2">
                    "{workout.notes}"
                  </div>
                )}

                {workout.duration && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{workout.duration}</span>
                  </div>
                )}

                {workout.distance && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Map className="h-3.5 w-3.5 mr-1" />
                    <span>{workout.distance}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default MoaiMemberWeeklyActivity;
