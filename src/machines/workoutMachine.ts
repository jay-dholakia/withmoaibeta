import { createMachine, assign } from 'xstate';
import { WorkoutExercise } from '@/types/workout';
import { ExerciseStates, PendingSet, PendingCardio, PendingFlexibility, PendingRun } from '@/types/active-workout';

// Define the context (state) for the workout machine
interface WorkoutContext {
  exerciseStates: ExerciseStates;
  pendingSets: PendingSet[];
  pendingCardio: PendingCardio[];
  pendingFlexibility: PendingFlexibility[];
  pendingRuns: PendingRun[];
  sortedExerciseIds: string[];
  workoutDataInitialized: boolean;
}

// Define events that can be sent to the machine
type WorkoutEvent =
  | { type: 'INITIALIZE'; workoutExercises: WorkoutExercise[]; draftData?: ExerciseStates }
  | { type: 'UPDATE_EXERCISE_STATES'; states: ExerciseStates }
  | { type: 'UPDATE_PENDING_SETS'; sets: PendingSet[] }
  | { type: 'UPDATE_PENDING_CARDIO'; cardio: PendingCardio[] }
  | { type: 'UPDATE_PENDING_FLEXIBILITY'; flexibility: PendingFlexibility[] }
  | { type: 'UPDATE_PENDING_RUNS'; runs: PendingRun[] }
  | { type: 'TOGGLE_EXERCISE_EXPANDED'; exerciseId: string };

// Helper function similar to the old hook
const determineIfStrengthExercise = (exercise: WorkoutExercise): boolean => {
  if (!exercise || !exercise.exercise) return true; // Default to strength if uncertain
  
  const exerciseType = exercise.exercise.exercise_type || '';
  const exerciseName = (exercise.exercise.name || '').toLowerCase();
  const exerciseMuscleGroup = (exercise.exercise.muscle_group || '').toLowerCase();
  
  const strengthTerms = [
    'press', 'bench', 'squat', 'curl', 'row', 'deadlift',
    'overhead', 'barbell', 'dumbbell', 'machine', 'cable',
    'pushup', 'pullup', 'chinup', 'extension', 'flexion',
    'raise', 'fly', 'flye', 'lateral', 'front', 'pushdown'
  ];
  
  if (strengthTerms.some(term => exerciseName.includes(term))) {
    return true;
  }
  
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
  
  if (exerciseType === 'strength' || exerciseType === 'bodyweight') {
    return true;
  }
  
  return false;
};

// Create the workout machine
export const workoutMachine = createMachine<WorkoutContext, WorkoutEvent>({
  id: 'workout',
  initial: 'idle',
  context: {
    exerciseStates: {},
    pendingSets: [],
    pendingCardio: [],
    pendingFlexibility: [],
    pendingRuns: [],
    sortedExerciseIds: [],
    workoutDataInitialized: false
  },
  states: {
    idle: {
      on: {
        INITIALIZE: {
          target: 'initializing',
          actions: assign({
            sortedExerciseIds: (_, event) => {
              if (!event.workoutExercises || !event.workoutExercises.length) {
                return [];
              }
              
              const sortedExercises = [...event.workoutExercises].sort((a, b) => {
                if (a.order_index !== undefined && b.order_index !== undefined) {
                  return a.order_index - b.order_index;
                }
                return 0;
              });
              
              return sortedExercises.map(exercise => exercise.id);
            }
          })
        }
      }
    },
    initializing: {
      entry: assign((context, event) => {
        if (event.type !== 'INITIALIZE') return context;
        
        if (event.draftData && Object.keys(event.draftData).length > 0) {
          return {
            ...context,
            exerciseStates: event.draftData,
            workoutDataInitialized: true
          };
        }
        
        const initialState: ExerciseStates = {};
        const workoutExercises = event.workoutExercises;
        
        if (!workoutExercises || workoutExercises.length === 0) {
          return {
            ...context,
            workoutDataInitialized: false
          };
        }
        
        const sortedExercises = [...workoutExercises].sort((a, b) => {
          if (a.order_index !== undefined && b.order_index !== undefined) {
            return a.order_index - b.order_index;
          }
          return 0;
        });
        
        sortedExercises.forEach((exercise) => {
          if (!exercise || !exercise.id) {
            console.error("Exercise missing ID:", exercise);
            return;
          }
          
          const exerciseId = exercise.id;
          const exerciseType = exercise.exercise?.exercise_type || '';
          const exerciseName = (exercise.exercise?.name || '').toLowerCase();
          const isRunExercise = exerciseName.includes('run') || exerciseName.includes('running');
          
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
                completed: false
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
                completed: false
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
                completed: false
              }
            };
          } else {
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
        
        return {
          ...context,
          exerciseStates: initialState,
          workoutDataInitialized: Object.keys(initialState).length > 0
        };
      }),
      always: {
        target: 'ready'
      }
    },
    ready: {
      on: {
        UPDATE_EXERCISE_STATES: {
          actions: assign({
            exerciseStates: (_, event) => event.states
          })
        },
        UPDATE_PENDING_SETS: {
          actions: assign({
            pendingSets: (_, event) => event.sets
          })
        },
        UPDATE_PENDING_CARDIO: {
          actions: assign({
            pendingCardio: (_, event) => event.cardio
          })
        },
        UPDATE_PENDING_FLEXIBILITY: {
          actions: assign({
            pendingFlexibility: (_, event) => event.flexibility
          })
        },
        UPDATE_PENDING_RUNS: {
          actions: assign({
            pendingRuns: (_, event) => event.runs
          })
        },
        TOGGLE_EXERCISE_EXPANDED: {
          actions: assign({
            exerciseStates: (context, event) => {
              const { exerciseId } = event;
              const currentState = context.exerciseStates[exerciseId];
              
              if (!currentState) return context.exerciseStates;
              
              return {
                ...context.exerciseStates,
                [exerciseId]: {
                  ...currentState,
                  expanded: !currentState.expanded
                }
              };
            }
          })
        },
        INITIALIZE: {
          target: 'initializing'
        }
      }
    }
  }
});
