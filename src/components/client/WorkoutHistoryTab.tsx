
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogRunActivityDialog } from './LogRunActivityDialog';
import { LogCardioActivityDialog } from './LogCardioActivityDialog';
import { LogRestDayDialog } from './LogRestDayDialog';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { 
  getClientRunActivities, 
  getClientCardioActivities, 
  getClientRestDays,
  RunLog,
  CardioLog,
  RestLog
} from '@/services/activity-logging-service';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showCardioDialog, setShowCardioDialog] = useState(false);
  const [showRestDialog, setShowRestDialog] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Array<{
    type: 'run' | 'cardio' | 'rest',
    date: Date,
    title: string,
    subtitle: string
  }>>([]);
  
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  const { refetch } = useQuery({
    queryKey: ['client-workouts', user?.id, refreshKey],
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
  });

  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!user?.id) return;
      
      const today = new Date();
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
        
        setRecentActivities(combinedActivities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };
    
    fetchRecentActivities();
  }, [user?.id, refreshKey]);
  
  const handleActivitySuccess = () => {
    refreshData();
  };

  return (
    <div>
      <div className="mt-8 pt-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        
        <Button asChild variant="outline" className="w-full mt-4 mb-4 flex items-center justify-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
          <Link to="/client-dashboard/workouts/one-off">
            <PlusCircle className="h-4 w-4" />
            Enter Custom Workout
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
        onClick={() => {
          refetch(); 
          console.log('Refreshing workout history data');
        }}
        id="refresh-workout-history"
      />
    </div>
  );
};

export default WorkoutHistoryTab;
