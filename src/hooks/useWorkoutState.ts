import { useState, useEffect } from 'react';
import { ExerciseStates, PendingSet, PendingCardio, PendingFlexibility, PendingRun } from '@/types/active-workout';
import { WorkoutExercise } from '@/types/workout';
import { toast } from 'sonner';

export const useWorkoutState = (
  workoutExercises: WorkoutExercise[] | undefined,
  initialDraftData?: ExerciseStates,
  workoutType?: string
) => {
  const [exerciseStates, setExerciseStates] = useState<ExerciseStates>({});
  const [pendingSets, setPendingSets] = useState<PendingSet[]>([]);
  const [pendingCardio, setPendingCardio] = useState<PendingCardio[]>([]);
  const [pendingFlexibility, setPendingFlexibility] = useState<PendingFlexibility[]>([]);
  const [pendingRuns, setPendingRuns] = useState<PendingRun[]>([]);
  const [workoutDataInitialized, setWorkoutDataInitialized] = useState(false);
  const [sortedExerciseIds, setSortedExerciseIds] = useState<string[]>([]);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // Function to determine if an exercise is a strength exercise
  const determineIfStrengthExercise = (exercise: WorkoutExercise): boolean => {
    if (!exercise || !exercise.exercise) return true; // Default to strength if uncertain
    
    const exerciseType = exercise.exercise.exercise_type || '';
    const exerciseName = (exercise.exercise.name || '').toLowerCase();
    const exerciseMuscleGroup = (exercise.exercise.muscle_group || '').toLowerCase();
    
    // List of terms commonly found in strength exercise names
    const strengthTerms = [
      'press', 'bench', 'squat', 'curl', 'row', 'deadlift',
      'overhead', 'barbell', 'dumbbell', 'machine', 'cable',
      'pushup', 'pullup', 'chinup', 'extension', 'flexion',
      'raise', 'fly', 'flye', 'lateral', 'front', 'pushdown'
    ];
    
    // Check if name contains common strength exercise terms
    if (strengthTerms.some(term => exerciseName.includes(term))) {
      return true;
    }
    
    // Check muscle group
    if (
      exerciseMuscleGroup.includes('chest') ||
      exerciseMuscleGroup.includes('back') ||
      exerciseMuscleGroup.includes('leg') ||
      exerciseMuscleGroup.includes('arm') ||
      exerciseMuscleGroup.includes('shoulder') ||
      exerciseMuscleGroup.includes('tricep') ||
      exerciseMuscleGroup.includes('bicep') ||
      exerciseMuscleGroup.includes('quad') ||
      exerciseMuscleGroup.includes('hamstring')
    ) {
      return true;
    }
    
    // Check exercise type
    if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
      return true;
    }
    
    return false;
  };

  // Initialize state from draft data or create new state
  useEffect(() => {
    // Only try to initialize once we have workout exercises and haven't already initialized
    if (!workoutDataInitialized && !initializationAttempted) {
      setInitializationAttempted(true);
      
      console.log("useWorkoutState: Initializing exercise states", {
        hasInitialDraft: !!initialDraftData,
        exerciseCount: workoutExercises?.length || 0,
        workoutType
      });

      // Use existing draft data if available
      if (initialDraftData && Object.keys(initialDraftData).length > 0) {
        console.log("Using existing draft data for initialization:", initialDraftData);
        setExerciseStates(initialDraftData);
        setWorkoutDataInitialized(true);
        
        // Also set sorted exercise IDs from the workoutExercises
        if (workoutExercises && workoutExercises.length > 0) {
          const orderedExerciseIds = workoutExercises.map(exercise => exercise.id);
          setSortedExerciseIds(orderedExerciseIds);
        }
        return;
      }

      // For cardio workout without exercises, create a default cardio exercise state
      if (workoutType === 'cardio' && (!workoutExercises || workoutExercises.length === 0)) {
        console.log("Creating default cardio exercise state for cardio workout");
        
        // Generate a placeholder ID for the cardio workout
        const cardioPlaceholderId = `cardio-placeholder-${Date.now()}`;
        
        const initialState: ExerciseStates = {
          [cardioPlaceholderId]: {
            expanded: true,
            sets: [], // Adding this to fix the type error
            cardioData: {
              distance: '',
              duration: '',
              location: '',
              completed: false,
              workout_type: workoutType || 'cardio' // Ensure workout_type is set
            }
          }
        };
        
        setExerciseStates(initialState);
        setSortedExerciseIds([cardioPlaceholderId]);
        setWorkoutDataInitialized(true);
        
        if (!initialDraftData) {
          toast.success(`Cardio workout initialized`);
        }
        return;
      }

      // Only initialize new state if no draft exists and we have exercises
      if (workoutExercises && workoutExercises.length > 0) {
        const initialState: ExerciseStates = {};
        const orderedExerciseIds: string[] = [];
        
        const sortedExercises = [...workoutExercises].sort((a, b) => {
          if (a.order_index !== undefined && b.order_index !== undefined) {
            return a.order_index - b.order_index;
          }
          return 0;
        });
        
        sortedExercises.forEach(exercise => {
          if (exercise && exercise.id) {
            orderedExerciseIds.push(exercise.id);
          }
        });
        
        setSortedExerciseIds(orderedExerciseIds);
        console.log("Sorted exercise IDs:", orderedExerciseIds);
        
        sortedExercises.forEach((exercise) => {
          if (!exercise || !exercise.id) {
            console.error("Exercise missing ID:", exercise);
            return;
          }
          
          const exerciseId = exercise.id;
          const exerciseType = exercise.exercise?.exercise_type || '';
          const exerciseName = (exercise.exercise?.name || '').toLowerCase();
          const exerciseMuscleGroup = (exercise.exercise?.muscle_group || '').toLowerCase();
          const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
          
          // Default to strength type for most exercises
          let effectiveType = 'strength';
          
          if (isRunExercise) {
            effectiveType = 'running';
          } else if (exerciseType === 'cardio') {
            effectiveType = 'cardio'; 
          } else if (exerciseType === 'flexibility') {
            effectiveType = 'flexibility';
          } else if (determineIfStrengthExercise(exercise)) {
            effectiveType = 'strength';
          }
          
          console.log(`Initializing exercise: ${exerciseName} (ID: ${exerciseId}) with type ${effectiveType}`);
          
          if (effectiveType === 'running') {
            initialState[exerciseId] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets: [],
              runData: {
                distance: '',
                duration: '',
                location: '',
                completed: false,
                workout_type: 'running' // Add workout_type
              }
            };
          } else if (effectiveType === 'strength') {
            const sets = Array.from({ length: exercise.sets || 1 }, (_, i) => ({
              setNumber: i + 1,
              weight: '',
              reps: exercise.reps || '',
              completed: false,
            }));
            
            initialState[exerciseId] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets,
            };
            console.log(`Initialized strength exercise with ${sets.length} sets`);
          } else if (effectiveType === 'cardio') {
            initialState[exerciseId] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets: [],
              cardioData: {
                distance: '',
                duration: '',
                location: '',
                completed: false,
                workout_type: 'cardio' // Add workout_type
              }
            };
          } else if (effectiveType === 'flexibility') {
            initialState[exerciseId] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets: [],
              flexibilityData: {
                duration: '',
                completed: false,
                workout_type: 'flexibility' // Add workout_type
              }
            };
          } else {
            // Fallback to strength as default
            const sets = Array.from({ length: exercise.sets || 1 }, (_, i) => ({
              setNumber: i + 1,
              weight: '',
              reps: exercise.reps || '',
              completed: false,
            }));
            
            initialState[exerciseId] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets,
            };
          }
        });
        
        if (Object.keys(initialState).length > 0) {
          console.log("Generated new exercise states:", initialState);
          setExerciseStates(initialState);
          setWorkoutDataInitialized(true);
          
          if (!initialDraftData) {
            toast.success(`Workout initialized with ${sortedExercises.length} exercises`);
          }
        } else {
          console.error("Failed to initialize exercise states - empty object created");
        }
      } else {
        console.warn("No workout exercises available to initialize");
        // Create a placeholder for empty workouts based on workoutType
        if (workoutType) {
          const placeholderId = `${workoutType}-placeholder-${Date.now()}`;
          const initialState: ExerciseStates = {
            [placeholderId]: {
              expanded: true,
              sets: [],
              // Add appropriate data based on workout type with workout_type property
              ...(workoutType === 'cardio' && { 
                cardioData: { 
                  distance: '', 
                  duration: '', 
                  location: '', 
                  completed: false,
                  workout_type: 'cardio'
                } 
              }),
              ...(workoutType === 'flexibility' && { 
                flexibilityData: { 
                  duration: '', 
                  completed: false,
                  workout_type: 'flexibility'
                } 
              }),
              ...(workoutType === 'running' && { 
                runData: { 
                  distance: '', 
                  duration: '', 
                  location: '', 
                  completed: false,
                  workout_type: 'running'
                } 
              })
            }
          };
          
          setExerciseStates(initialState);
          setSortedExerciseIds([placeholderId]);
          setWorkoutDataInitialized(true);
          console.log(`Created placeholder for empty ${workoutType} workout`);
        }
      }
    }
  }, [workoutExercises, workoutDataInitialized, initialDraftData, initializationAttempted, workoutType]);

  return {
    exerciseStates,
    setExerciseStates,
    pendingSets,
    setPendingSets,
    pendingCardio,
    setPendingCardio,
    pendingFlexibility,
    setPendingFlexibility,
    pendingRuns,
    setPendingRuns,
    workoutDataInitialized,
    sortedExerciseIds
  };
};
