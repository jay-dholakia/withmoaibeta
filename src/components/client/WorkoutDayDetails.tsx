
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Edit2, Clock, MapPin, Award, Target, SquarePen, ArrowLeft, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import RunMap from './workout/RunMap';
import { getRunLocations, RunLocation } from '@/services/run-tracking-service';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
  backUrl?: string;
  showBackButton?: boolean;
}

export const WorkoutDayDetails: React.FC<WorkoutDayDetailsProps> = ({
  date,
  workouts,
  backUrl = '/client-dashboard/workouts',
  showBackButton = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [runLocations, setRunLocations] = useState<{ [key: string]: RunLocation[] }>({});
  const [loadingMaps, setLoadingMaps] = useState<{ [key: string]: boolean }>({});

  // Filter workouts for the selected date
  const filteredWorkouts = workouts.filter(workout => {
    if (!workout.completed_at) return false;
    const workoutDate = new Date(workout.completed_at);
    return workoutDate.toDateString() === date.toDateString();
  });

  useEffect(() => {
    // Load run GPS data for any running workouts
    const loadRunLocations = async () => {
      const runWorkouts = filteredWorkouts.filter(workout => 
        workout.workout_type === 'running' || 
        workout.workout_type === 'cardio_run'
      );
      
      if (runWorkouts.length === 0) return;
      
      const newLoadingState: { [key: string]: boolean } = {};
      runWorkouts.forEach(workout => {
        newLoadingState[workout.id] = true;
      });
      setLoadingMaps(newLoadingState);
      
      const locationsMap: { [key: string]: RunLocation[] } = {};
      
      for (const workout of runWorkouts) {
        try {
          const locations = await getRunLocations(workout.id);
          if (locations.length > 0) {
            locationsMap[workout.id] = locations;
          }
        } catch (error) {
          console.error(`Error loading run data for workout ${workout.id}:`, error);
        } finally {
          setLoadingMaps(prev => ({
            ...prev,
            [workout.id]: false
          }));
        }
      }
      
      setRunLocations(locationsMap);
    };
    
    loadRunLocations();
  }, [filteredWorkouts]);

  const renderWorkoutDetail = (workout: WorkoutHistoryItem) => {
    if (workout.life_happens_pass) {
      return (
        <Card className="mb-4" key={workout.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">Life Happens</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">You used a Life Happens Pass for this day.</p>
          </CardContent>
        </Card>
      );
    }

    if (workout.rest_day) {
      return (
        <Card className="mb-4" key={workout.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">Rest Day</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">You logged a rest day.</p>
          </CardContent>
        </Card>
      );
    }

    const isRunningWorkout = workout.workout_type === 'running' || workout.workout_type === 'cardio_run';
    const hasGPSData = isRunningWorkout && runLocations[workout.id] && runLocations[workout.id].length > 0;
    const isLoadingMap = loadingMaps[workout.id];

    return (
      <Card className="mb-4" key={workout.id}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <WorkoutTypeIcon type={workout.workout_type || 'strength'} size={24} />
              <CardTitle className="text-lg">
                {workout.title || workout.workout?.title || 'Workout'}
              </CardTitle>
            </div>
            {workout.workout_type === 'custom' && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2"
                onClick={() => navigate(`/client-dashboard/workouts/custom/${workout.custom_workout_id}`)}
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit Custom Workout</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{format(new Date(workout.completed_at), 'MMM d, yyyy')}</span>
              </div>
              
              {workout.duration && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{workout.duration}</span>
                </div>
              )}
              
              {workout.distance && (
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{workout.distance} mi</span>
                </div>
              )}
              
              {workout.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{workout.location}</span>
                </div>
              )}
            </div>
            
            {workout.description && (
              <p className="text-sm text-muted-foreground">{workout.description}</p>
            )}
            
            {workout.notes && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <SquarePen className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium mb-1">Notes:</p>
                    <p className="text-sm">{workout.notes}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display run map if GPS data is available */}
            {isRunningWorkout && (
              <>
                {isLoadingMap && (
                  <div className="h-[200px] w-full bg-muted/50 rounded-md flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Loading map data...</span>
                  </div>
                )}
                
                {!isLoadingMap && hasGPSData && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Run Route:</h4>
                    <RunMap locations={runLocations[workout.id] || []} height="200px" />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(backUrl)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Back</span>
            </Button>
          )}
          <h2 className="text-xl font-bold">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>
      </div>

      {filteredWorkouts.length > 0 ? (
        <div>
          {filteredWorkouts.map(workout => renderWorkoutDetail(workout))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">No workouts logged for this day.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
