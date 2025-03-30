
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Workout, WorkoutExercise, SupersetGroup } from '@/types/workout';
import { DumbbellIcon, Clock, RotateCw } from 'lucide-react';

interface WorkoutViewProps {
  workout: Workout;
  supersetGroups?: SupersetGroup[];
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ workout, supersetGroups = [] }) => {
  const { title, description, workout_exercises = [] } = workout;
  
  // Group exercises by superset
  const exercisesBySupersetId: Record<string, WorkoutExercise[]> = {};
  const standaloneExercises: WorkoutExercise[] = [];
  
  workout_exercises.forEach(exercise => {
    if (exercise.superset_group_id) {
      if (!exercisesBySupersetId[exercise.superset_group_id]) {
        exercisesBySupersetId[exercise.superset_group_id] = [];
      }
      exercisesBySupersetId[exercise.superset_group_id].push(exercise);
    } else {
      standaloneExercises.push(exercise);
    }
  });
  
  // Sort superset exercises by superset_order
  Object.keys(exercisesBySupersetId).forEach(groupId => {
    exercisesBySupersetId[groupId].sort((a, b) => {
      return (a.superset_order || 0) - (b.superset_order || 0);
    });
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <DumbbellIcon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Render superset groups */}
          {supersetGroups.map(group => {
            const groupExercises = exercisesBySupersetId[group.id] || [];
            if (groupExercises.length === 0) return null;
            
            return (
              <div key={group.id} className="p-3 bg-primary/5 border-primary/20 border rounded-lg">
                <h3 className="text-base font-medium flex items-center gap-2 mb-3">
                  <RotateCw className="h-4 w-4 text-primary" />
                  {group.title || 'Superset'}
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                    Perform back-to-back
                  </span>
                </h3>
                <div className="space-y-3">
                  {groupExercises.map((exercise, index) => (
                    <ExerciseItem 
                      key={exercise.id} 
                      exercise={exercise} 
                      index={index}
                      inSuperset
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Render standalone exercises */}
          <div className="space-y-3">
            {standaloneExercises.map((exercise, index) => (
              <ExerciseItem 
                key={exercise.id} 
                exercise={exercise} 
                index={index}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ExerciseItemProps {
  exercise: WorkoutExercise;
  index: number;
  inSuperset?: boolean;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({ exercise, index, inSuperset = false }) => {
  return (
    <div className={`
      p-3 border rounded-md
      ${inSuperset ? 'bg-background' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {!inSuperset && (
              <div className="bg-muted h-6 w-6 rounded-full flex items-center justify-center text-xs">
                {index + 1}
              </div>
            )}
            <h4 className="font-medium">{exercise.exercise?.name || 'Exercise'}</h4>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div>{exercise.sets} sets × {exercise.reps}</div>
            {exercise.rest_seconds && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{exercise.rest_seconds}s rest</span>
              </div>
            )}
          </div>
          {exercise.notes && (
            <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {exercise.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutView;
