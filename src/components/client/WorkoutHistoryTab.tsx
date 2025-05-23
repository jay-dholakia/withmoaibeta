
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { 
  getClientRunActivities, 
  getClientCardioActivities, 
  getClientRestDays,
} from '@/services/activity-logging-service';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfWeek } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { LogActivityButtons } from './LogActivityButtons';

// Storage key to remember scroll position
const WORKOUT_HISTORY_SCROLL_POS = 'workout_history_scroll';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Save and restore scroll position
  useEffect(() => {
    const savedScrollPos = localStorage.getItem(WORKOUT_HISTORY_SCROLL_POS);
    
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
      }, 100);
    }
    
    const handleScroll = () => {
      localStorage.setItem(WORKOUT_HISTORY_SCROLL_POS, window.scrollY.toString());
    };
    
    // Debounce scroll events to avoid excessive localStorage writes
    let scrollTimeout: number | null = null;
    const debouncedScroll = () => {
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = window.setTimeout(handleScroll, 300);
    };
    
    window.addEventListener('scroll', debouncedScroll);
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);
  
  const { data: workoutHistory = [] } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching workout history for user:', user.id);
      try {
        const history = await fetchClientWorkoutHistory(user.id);
        console.log(`Fetched ${history.length} workout history items`);
        return history;
      } catch (err) {
        console.error('Error fetching workout history:', err);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['client-workouts', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['recent-activities', user?.id] });
    // Trigger a refresh of the weekly progress data
    document.dispatchEvent(new Event('refresh-weekly-progress'));
  }, [queryClient, user?.id]);

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['recent-activities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Convert date range to Pacific Time and ensure week starts on Monday
      const now = new Date();
      const todayPT = formatInTimeZone(now, 'America/Los_Angeles', 'yyyy-MM-dd');
      const today = new Date(todayPT);
      
      // Go back 7 days from today for recent activities
      const sevenDaysAgo = subDays(today, 7);
      
      try {
        const [runActivities, cardioActivities, restDays] = await Promise.all([
          getClientRunActivities(sevenDaysAgo, today),
          getClientCardioActivities(sevenDaysAgo, today),
          getClientRestDays(sevenDaysAgo, today)
        ]);
        
        const combinedActivities = [
          ...runActivities.map(run => ({
            type: 'run' as const,
            date: run.log_date,
            title: `${run.distance} mile run`,
            subtitle: `${run.duration} mins at ${run.location || 'Unknown location'}`
          })),
          ...cardioActivities.map(cardio => ({
            type: 'cardio' as const,
            date: cardio.log_date,
            title: cardio.activity_type,
            subtitle: `${cardio.duration} minutes`
          })),
          ...restDays.map(rest => ({
            type: 'rest' as const,
            date: rest.log_date,
            title: 'Rest Day',
            subtitle: rest.notes || 'No notes'
          }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());
        
        return combinedActivities;
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return (
    <div>
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        
        <LogActivityButtons />
        
        <Button asChild variant="outline" className="w-full mb-4 flex items-center justify-between text-emerald-600 border-emerald-200 hover:bg-emerald-50">
          <Link to="/client-dashboard/workouts/one-off">
            <div className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Enter Custom Workout</span>
            </div>
          </Link>
        </Button>
      </div>
      
      {recentActivities.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start p-3 rounded-md border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{activity.title}</h4>
                    <Badge 
                      variant={
                        activity.type === 'run' ? 'running' : 
                        activity.type === 'cardio' ? 'cardio' : 'rest'
                      }
                    >
                      {activity.type === 'run' ? 'Run' : 
                       activity.type === 'cardio' ? 'Cardio' : 'Rest'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(activity.date, 'PPP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button 
        className="hidden" 
        onClick={refreshData}
        id="refresh-workout-history"
      />
    </div>
  );
};

export default WorkoutHistoryTab;
