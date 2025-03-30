
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
