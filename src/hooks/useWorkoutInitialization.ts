
import { useState, useEffect, useRef } from 'react';
import { ExerciseStates } from '@/types/active-workout';
import { WorkoutExercise } from '@/types/workout';
import { toast } from 'sonner';

interface UseWorkoutInitializationProps {
  workoutExercises: WorkoutExercise[];
  draftData: any;
  draftLoaded: boolean;
  workoutDataLoaded: boolean;
}

export const useWorkoutInitialization = ({
  workoutExercises,
  draftData,
  draftLoaded,
  workoutDataLoaded
}: UseWorkoutInitializationProps) => {
  // Always initialize all state hooks at the top level
  const [exerciseStates, setExerciseStates] = useState<ExerciseStates>({});
  const [sortedExerciseIds, setSortedExerciseIds] = useState<string[]>([]);
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);
  const [initializedExerciseIds, setInitializedExerciseIds] = useState<string[]>([]);
  
  // Use refs for tracking initialization to avoid hook dependency issues
  const attemptedInitializationRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);
  const maxInitAttempts = useRef<number>(3);
  const currentAttempt = useRef<number>(0);

  // This effect handles the initialization of workout data
  useEffect(() => {
    // Only proceed when both workout data and draft loading status are confirmed
    if (!workoutDataLoaded || workoutExercises.length === 0 || !draftLoaded) {
      console.log("Waiting for workout data and draft loading to complete", {
        workoutDataLoaded,
        exercisesLength: workoutExercises.length,
        draftLoaded
      });
      return;
    }

    // If we're already initialized and have all expected exercise states, don't reinitialize
    const allExercisesHaveStates = workoutExercises.length > 0 && 
      workoutExercises.every(ex => exerciseStates && exerciseStates[ex.id]);
    
    if (initializedRef.current && Object.keys(exerciseStates).length > 0 && allExercisesHaveStates) {
      console.log("Workout already initialized and all exercises have states, skipping");
      return;
    }

    // If we've exhausted our attempts but still don't have all states, force complete anyway
    if (currentAttempt.current >= maxInitAttempts.current) {
      console.warn(`Max initialization attempts (${maxInitAttempts.current}) reached, forcing completion`);
      setInitializationComplete(true);
      initializedRef.current = true;
      return;
    }
    
    currentAttempt.current += 1;
    console.log(`Initialization attempt ${currentAttempt.current}/${maxInitAttempts.current}`);
    
    // Set our attempt flag
    if (!attemptedInitializationRef.current) {
      attemptedInitializationRef.current = true;
    }
    
    console.log("Initializing workout states", {
      hasDraftData: !!(draftData?.exerciseStates && Object.keys(draftData?.exerciseStates || {}).length > 0),
      workoutExercisesCount: workoutExercises.length
    });

    // Get the sorted exercise IDs from workout exercises - ensure they're in the correct order
    const orderedExerciseIds = workoutExercises.map(exercise => exercise.id);
    setSortedExerciseIds(orderedExerciseIds);
    
    // Also track which exercises we've initialized for debugging
    setInitializedExerciseIds(orderedExerciseIds);

    // If we have valid draft data, use it
    if (draftData?.exerciseStates && Object.keys(draftData.exerciseStates).length > 0) {
      console.log("Initializing from draft data:", draftData.exerciseStates);
      
      // We need to ensure all current workout exercises are in the states
      const updatedExerciseStates = { ...draftData.exerciseStates };
      
      // Check if any exercises in the workout are missing from the draft
      workoutExercises.forEach(exercise => {
        if (!updatedExerciseStates[exercise.id]) {
          console.log(`Adding missing exercise to states: ${exercise.id}`);
          // Add the missing exercise with a default state
          const exerciseType = exercise.exercise?.exercise_type || 'strength';
          const exerciseName = (exercise.exercise?.name || '').toLowerCase();
          const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
          
          if (isRunExercise) {
            updatedExerciseStates[exercise.id] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets: [],
              runData: {
                distance: '',
                duration: '',
                location: '',
                completed: false
              }
            };
          } else if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
            const sets = Array.from({ length: exercise.sets || 1 }, (_, i) => ({
              setNumber: i + 1,
              weight: '',
              reps: exercise.reps || '',
              completed: false,
            }));
            
            updatedExerciseStates[exercise.id] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets,
            };
          } else if (exerciseType === 'cardio') {
            updatedExerciseStates[exercise.id] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets: [],
              cardioData: {
                distance: '',
                duration: '',
                location: '',
                completed: false
              }
            };
          } else if (exerciseType === 'flexibility') {
            updatedExerciseStates[exercise.id] = {
              expanded: true,
              exercise_id: exercise.exercise?.id,
              currentExercise: exercise.exercise,
              sets: [],
              flexibilityData: {
                duration: '',
                completed: false
              }
            };
          }
        }
      });
      
      // Verify all exercises have states before setting
      const allExercisesHaveStates = workoutExercises.every(ex => !!updatedExerciseStates[ex.id]);
      
      if (!allExercisesHaveStates) {
        console.warn("Some exercises still missing states after initialization attempt");
        // Create missing states as a fallback
        const completedStates = buildInitialExerciseState(workoutExercises, updatedExerciseStates);
        setExerciseStates(completedStates);
      } else {
        // Update with combined state data
        setExerciseStates(updatedExerciseStates);
        toast.success("Loaded your saved workout progress");
      }
    } else {
      // Otherwise, build exercise states from scratch
      console.log("No draft data found, initializing from workout exercises");
      const initialState = buildInitialExerciseState(workoutExercises);
      setExerciseStates(initialState);
    }
    
    // Do a final verification that all states are properly initialized
    const finalVerification = setTimeout(() => {
      const missingExercises = workoutExercises.filter(ex => !exerciseStates[ex.id]);
      if (missingExercises.length > 0) {
        console.warn("Final verification found missing exercises:", missingExercises.map(ex => ex.id));
        // One last attempt to create missing states
        const updatedStates = { ...exerciseStates };
        let statesUpdated = false;
        
        missingExercises.forEach(exercise => {
          if (!updatedStates[exercise.id]) {
            console.log(`Final attempt to add missing exercise: ${exercise.id}`);
            const exerciseType = exercise.exercise?.exercise_type || 'strength';
            const exerciseName = (exercise.exercise?.name || '').toLowerCase();
            const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
            
            if (isRunExercise) {
              updatedStates[exercise.id] = {
                expanded: true,
                exercise_id: exercise.exercise?.id,
                currentExercise: exercise.exercise,
                sets: [],
                runData: {
                  distance: '',
                  duration: '',
                  location: '',
                  completed: false
                }
              };
              statesUpdated = true;
            } else if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
              const sets = Array.from({ length: exercise.sets || 1 }, (_, i) => ({
                setNumber: i + 1,
                weight: '',
                reps: exercise.reps || '',
                completed: false,
              }));
              
              updatedStates[exercise.id] = {
                expanded: true,
                exercise_id: exercise.exercise?.id,
                currentExercise: exercise.exercise,
                sets,
              };
              statesUpdated = true;
            } else if (exerciseType === 'cardio') {
              updatedStates[exercise.id] = {
                expanded: true,
                exercise_id: exercise.exercise?.id,
                currentExercise: exercise.exercise,
                sets: [],
                cardioData: {
                  distance: '',
                  duration: '',
                  location: '',
                  completed: false
                }
              };
              statesUpdated = true;
            } else if (exerciseType === 'flexibility') {
              updatedStates[exercise.id] = {
                expanded: true,
                exercise_id: exercise.exercise?.id,
                currentExercise: exercise.exercise,
                sets: [],
                flexibilityData: {
                  duration: '',
                  completed: false
                }
              };
              statesUpdated = true;
            }
          }
        });
        
        if (statesUpdated) {
          console.log("Updating states after final verification");
          setExerciseStates(updatedStates);
        }
      }
      
      // Mark initialization as complete regardless
      initializedRef.current = true;
      setInitializationComplete(true);
    }, 500);
    
    return () => clearTimeout(finalVerification);
  }, [workoutDataLoaded, workoutExercises, draftData, draftLoaded, exerciseStates]);

  // Helper function to build initial exercise state from workout exercises
  const buildInitialExerciseState = (exercises: WorkoutExercise[], existingStates: ExerciseStates = {}): ExerciseStates => {
    const initialState: ExerciseStates = {...existingStates};
    
    // Using exercises directly since they should already be sorted by the parent component
    exercises.forEach((exercise) => {
      if (!exercise || !exercise.id) {
        console.error("Exercise missing ID:", exercise);
        return;
      }
      
      // Skip if this exercise already has a state
      if (initialState[exercise.id]) {
        return;
      }
      
      const exerciseId = exercise.id;
      const exerciseType = exercise.exercise?.exercise_type || 'strength';
      const exerciseName = (exercise.exercise?.name || '').toLowerCase();
      const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
      
      if (isRunExercise) {
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
          sets: [],
          runData: {
            distance: '',
            duration: '',
            location: '',
            completed: false
          }
        };
      } else if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
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
      } else if (exerciseType === 'cardio') {
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
          sets: [],
          cardioData: {
            distance: '',
            duration: '',
            location: '',
            completed: false
          }
        };
      } else if (exerciseType === 'flexibility') {
        initialState[exerciseId] = {
          expanded: true,
          exercise_id: exercise.exercise?.id,
          currentExercise: exercise.exercise,
          sets: [],
          flexibilityData: {
            duration: '',
            completed: false
          }
        };
      }
      
      console.log(`Initialized exercise state for ${exerciseName}`, {
        workoutExerciseId: exerciseId,
        exerciseId: exercise.exercise?.id,
        exerciseType,
        orderIndex: exercise.order_index
      });
    });
    
    if (Object.keys(initialState).length > 0) {
      console.log("Generated exercise states:", initialState);
      
      // Verify all exercises have states
      const missingExercises = exercises.filter(ex => !initialState[ex.id]);
      if (missingExercises.length > 0) {
        console.error("Failed to initialize some exercises:", missingExercises.map(ex => ex.id));
      }
      
      return initialState;
    } else {
      console.error("Failed to initialize exercise states - empty object created");
      return initialState;
    }
  };

  // Log states for debugging
  useEffect(() => {
    if (initializationComplete) {
      console.log("Exercise states after initialization:", {
        statesCount: Object.keys(exerciseStates).length,
        exerciseIds: Object.keys(exerciseStates),
        initializedExerciseIds
      });
      
      // Double check all exercises have states
      if (initializedExerciseIds.length !== Object.keys(exerciseStates).length) {
        console.warn("Not all exercises have states after initialization!", {
          expectedCount: initializedExerciseIds.length,
          actualCount: Object.keys(exerciseStates).length
        });
      }
    }
  }, [initializationComplete, exerciseStates, initializedExerciseIds]);

  return {
    exerciseStates,
    setExerciseStates,
    sortedExerciseIds,
    initializationComplete
  };
};
