
export interface ExerciseState {
  expanded: boolean;
  sets: Array<{
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
  }>;
  cardioData?: {
    distance: string;
    duration: string;
    location: string;
    completed: boolean;
  };
  flexibilityData?: {
    duration: string;
    completed: boolean;
  };
  runData?: {
    distance: string;
    duration: string;
    location: string;
    completed: boolean;
  };
}

export interface ExerciseStates {
  [key: string]: ExerciseState;
}

export interface PendingSet {
  exerciseId: string;
  setNumber: number;
  weight: string;
  reps: string;
}

export interface PendingCardio {
  exerciseId: string;
  distance: string;
  duration: string;
  location: string;
}

export interface PendingFlexibility {
  exerciseId: string;
  duration: string;
}

export interface PendingRun {
  exerciseId: string;
  distance: string;
  duration: string;
  location: string;
}
