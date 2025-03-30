
export const normalizeWorkoutType = (workoutType: string): string => {
  const type = workoutType.toLowerCase();
  
  if (type.includes('strength')) return 'strength';
  if (type.includes('body') || type.includes('weight')) return 'bodyweight';
  if (type.includes('cardio') || type.includes('hiit')) return 'cardio';
  if (type.includes('flex') || type.includes('yoga') || type.includes('recovery')) return 'flexibility';
  if (type.includes('rest')) return 'rest_day';
  if (type.includes('custom')) return 'custom';
  if (type.includes('one')) return 'one_off';
  
  // Default to 'strength' if no match is found
  return 'strength';
};

// Helper function to group exercises by superset
export const groupExercisesBySuperset = (exercises: any[]) => {
  const exercisesBySupersetId: Record<string, any[]> = {};
  const standaloneExercises: any[] = [];
  
  exercises.forEach(exercise => {
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
  
  return { exercisesBySupersetId, standaloneExercises };
};
