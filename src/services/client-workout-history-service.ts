
import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistoryItem, WorkoutSetCompletion, WorkoutBasic } from "@/types/workout";

export const fetchClientWorkoutHistory = async (clientId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    if (!clientId) {
      console.error("Invalid clientId provided to fetchClientWorkoutHistory");
      return [];
    }

    const selectStatement = `
      id, completed_at, notes, rating, user_id, workout_id, life_happens_pass, rest_day, 
      title, description, workout_type, duration, distance, location, custom_workout_id
    `;
    
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select(selectStatement)
      .eq('user_id', clientId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      return [];
    }
    
    if (!completions || completions.length === 0) {
      return [];
    }
    
    const workoutIds = [
      ...new Set(
        completions
          .map(c => c.workout_id)
          .filter(id => id !== null && id !== undefined)
      )
    ];
    
    const workoutMap: Map<string, WorkoutBasic> = new Map();
    
    if (workoutIds.length > 0) {
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, title, description, day_of_week, week_id, workout_type')
        .in('id', workoutIds);
      
      if (workoutsError) {
        console.error("Error fetching workouts:", workoutsError);
      } else if (workouts && workouts.length > 0) {
        workouts.forEach(workout => {
          workoutMap.set(workout.id, {
            ...workout,
            week: null,
            workout_type: workout.workout_type || 'strength',
            custom_workout: false
          });
        });
        
        if (workouts.length > 0) {
          const weekIds = [...new Set(workouts.map(w => w.week_id).filter(Boolean))];
          
          if (weekIds.length > 0) {
            try {
              const { data: weeks, error: weeksError } = await supabase
                .from('workout_weeks')
                .select('id, week_number, program_id')
                .in('id', weekIds);
              
              if (weeksError) {
                console.error("Error fetching workout weeks:", weeksError);
              } else if (weeks && weeks.length > 0) {
                const programIds = [...new Set(weeks.map(w => w.program_id).filter(Boolean))];
                
                if (programIds.length > 0) {
                  try {
                    const { data: programs, error: programsError } = await supabase
                      .from('workout_programs')
                      .select('id, title')
                      .in('id', programIds);
                    
                    if (programsError) {
                      console.error("Error fetching programs:", programsError);
                    } else if (programs) {
                      const programMap = new Map();
                      programs.forEach(program => {
                        programMap.set(program.id, program);
                      });
                      
                      const weekMap = new Map();
                      weeks.forEach(week => {
                        const program = programMap.get(week.program_id);
                        weekMap.set(week.id, {
                          ...week,
                          program: program || null
                        });
                      });
                      
                      workoutMap.forEach((workout, workoutId) => {
                        if (workout.week_id) {
                          const weekData = weekMap.get(workout.week_id);
                          if (weekData) {
                            workoutMap.set(workoutId, {
                              ...workout,
                              week: {
                                week_number: weekData.week_number,
                                program: weekData.program ? {
                                  id: weekData.program.id,
                                  title: weekData.program.title
                                } : null
                              }
                            });
                          }
                        }
                      });
                    }
                  } catch (err) {
                    console.error("Error processing program data:", err);
                  }
                }
              }
            } catch (err) {
              console.error("Error processing week data:", err);
            }
          }
        }
      }
    }
    
    const completionIds = completions.map(completion => completion.id);
    const setCompletionsMap: Map<string, WorkoutSetCompletion[]> = new Map();
    
    if (completionIds.length > 0) {
      try {
        const { data: setCompletions, error: setCompletionsError } = await supabase
          .from('workout_set_completions')
          .select('*')
          .in('workout_completion_id', completionIds);
        
        if (setCompletionsError) {
          console.error("Error fetching workout set completions:", setCompletionsError);
        } else if (setCompletions && setCompletions.length > 0) {
          // Group set completions by their workout_completion_id
          setCompletions.forEach((setCompletion) => {
            const completionId = setCompletion.workout_completion_id;
            if (!setCompletionsMap.has(completionId)) {
              setCompletionsMap.set(completionId, []);
            }
            const completionsArray = setCompletionsMap.get(completionId);
            if (completionsArray) {
              completionsArray.push(setCompletion as WorkoutSetCompletion);
            }
          });
          
          // Log the number of set completions found for each workout
          completionIds.forEach(id => {
            const sets = setCompletionsMap.get(id) || [];
            console.log(`Found ${sets.length} set completions for workout ${id}`);
          });
        }
      } catch (err) {
        console.error("Error processing set completion data:", err);
      }
    }
    
    const workoutHistory: WorkoutHistoryItem[] = completions.map(completion => {
      try {
        const completed_at = completion.completed_at 
          ? new Date(completion.completed_at).toISOString() 
          : new Date().toISOString();
          
        const workout_set_completions = setCompletionsMap.get(completion.id) || [];
        
        if (!completion.workout_id && (completion.title || completion.custom_workout_id)) {
          const customWorkoutId = completion.custom_workout_id || completion.id;
          return {
            id: completion.id,
            completed_at,
            notes: completion.notes,
            rating: completion.rating,
            user_id: clientId,
            workout_id: customWorkoutId,
            title: completion.title,
            description: completion.description,
            workout_type: completion.workout_type || 'custom',
            duration: completion.duration,
            distance: completion.distance,
            location: completion.location,
            life_happens_pass: completion.life_happens_pass || false,
            rest_day: completion.rest_day || false,
            workout_set_completions,
            workout: {
              id: customWorkoutId,
              title: completion.title || 'Custom Workout',
              description: completion.description,
              day_of_week: 0,
              week_id: '',
              workout_type: completion.workout_type || 'custom',
              custom_workout: true
            } as WorkoutBasic
          } as WorkoutHistoryItem;
        }
        
        if (!completion.workout_id && completion.rest_day) {
          return {
            id: completion.id,
            completed_at,
            notes: completion.notes,
            rating: completion.rating,
            user_id: clientId,
            workout_id: '',
            title: 'Rest Day',
            rest_day: true,
            life_happens_pass: completion.life_happens_pass || false,
            workout_set_completions,
            workout: {
              id: completion.id,
              title: 'Rest Day',
              description: 'Recovery day',
              day_of_week: 0,
              week_id: '',
              workout_type: 'rest_day',
              custom_workout: false
            }
          } as WorkoutHistoryItem;
        }
        
        const workoutDetails = workoutMap.get(completion.workout_id) || null;
        
        const historyItem: WorkoutHistoryItem = {
          id: completion.id,
          completed_at,
          notes: completion.notes,
          rating: completion.rating,
          user_id: clientId,
          workout_id: completion.workout_id || '',
          workout: workoutDetails,
          life_happens_pass: completion.life_happens_pass || false,
          rest_day: completion.rest_day || false,
          workout_set_completions
        };
        
        return historyItem;
      } catch (error) {
        console.error("Error processing workout completion:", error, completion);
        return {
          id: completion.id || `fallback-${Date.now()}`,
          user_id: clientId,
          workout_id: completion.workout_id || '',
          completed_at: new Date().toISOString(),
          workout: null,
          workout_set_completions: []
        } as WorkoutHistoryItem;
      }
    });
    
    return workoutHistory;
  } catch (error) {
    console.error("Error in fetchClientWorkoutHistory:", error);
    return [];
  }
};

export const fetchWorkoutExercises = async (workoutId: string) => {
  try {
    console.log(`Fetching exercises for workout: ${workoutId}`);
    
    const { data: setCompletions, error: setCompletionsError } = await supabase
      .from('workout_set_completions')
      .select(`
        *,
        workout_exercise:workout_exercises(
          *,
          exercise:exercises(
            id,
            name,
            exercise_type
          )
        ),
        standalone_exercise:standalone_workout_exercises(
          *,
          exercise:exercises(
            id,
            name,
            exercise_type
          )
        )
      `)
      .eq('workout_completion_id', workoutId)
      .order('set_number');
      
    if (setCompletionsError) {
      console.error("Error fetching set completions:", setCompletionsError);
      return null;
    }

    console.log(`Found ${setCompletions?.length || 0} set completions`);
    console.log('Set completions:', setCompletions);
    
    return setCompletions;
  } catch (error) {
    console.error("Error in fetchWorkoutExercises:", error);
    return null;
  }
};
