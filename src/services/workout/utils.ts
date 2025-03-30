
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

// New function to move an exercise up within a superset
export const moveSupersetExerciseUp = (exercises: any[], exerciseId: string) => {
  const { exercisesBySupersetId } = groupExercisesBySuperset(exercises);
  
  // Find which superset the exercise belongs to
  let targetSupersetId: string | null = null;
  let exerciseIndex = -1;
  
  Object.keys(exercisesBySupersetId).forEach(supersetId => {
    const index = exercisesBySupersetId[supersetId].findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      targetSupersetId = supersetId;
      exerciseIndex = index;
    }
  });
  
  if (!targetSupersetId || exerciseIndex <= 0) {
    return exercises; // Can't move up if it's already at the top
  }
  
  // Get the superset exercises
  const supersetExercises = exercisesBySupersetId[targetSupersetId];
  
  // Swap orders with the exercise above
  const currentExercise = supersetExercises[exerciseIndex];
  const previousExercise = supersetExercises[exerciseIndex - 1];
  
  // Create a copy of the exercises array with updated superset_order values
  return exercises.map(ex => {
    if (ex.id === currentExercise.id) {
      return { ...ex, superset_order: previousExercise.superset_order };
    } else if (ex.id === previousExercise.id) {
      return { ...ex, superset_order: currentExercise.superset_order };
    }
    return ex;
  });
};

// New function to move an exercise down within a superset
export const moveSupersetExerciseDown = (exercises: any[], exerciseId: string) => {
  const { exercisesBySupersetId } = groupExercisesBySuperset(exercises);
  
  // Find which superset the exercise belongs to
  let targetSupersetId: string | null = null;
  let exerciseIndex = -1;
  
  Object.keys(exercisesBySupersetId).forEach(supersetId => {
    const index = exercisesBySupersetId[supersetId].findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      targetSupersetId = supersetId;
      exerciseIndex = index;
    }
  });
  
  if (!targetSupersetId) {
    return exercises; // Not in a superset
  }
  
  // Get the superset exercises
  const supersetExercises = exercisesBySupersetId[targetSupersetId];
  
  if (exerciseIndex >= supersetExercises.length - 1) {
    return exercises; // Can't move down if it's already at the bottom
  }
  
  // Swap orders with the exercise below
  const currentExercise = supersetExercises[exerciseIndex];
  const nextExercise = supersetExercises[exerciseIndex + 1];
  
  // Create a copy of the exercises array with updated superset_order values
  return exercises.map(ex => {
    if (ex.id === currentExercise.id) {
      return { ...ex, superset_order: nextExercise.superset_order };
    } else if (ex.id === nextExercise.id) {
      return { ...ex, superset_order: currentExercise.superset_order };
    }
    return ex;
  });
};
