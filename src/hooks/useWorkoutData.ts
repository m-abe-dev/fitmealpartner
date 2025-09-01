import { useEffect } from 'react';
import { Exercise, WorkoutSet } from '../screens/workout/types/workout.types';
import { useWorkoutStore } from '../stores/workoutStore';

export const useWorkoutData = () => {
  const store = useWorkoutStore();

  // 初回マウント時にデータを読み込み
  useEffect(() => {
    store.loadTodaysWorkout();
  }, []);

  // exercises状態の変化をログ出力
  useEffect(() => {}, [store.exercises]);

  return {
    exercises: store.exercises,
    isLoading: store.isLoading,
    addSet: store.addSet,
    updateSet: store.updateSet,
    deleteSet: store.deleteSet,
    deleteExercise: store.deleteExercise,
    addExercise: store.addExercise,
    toggleExerciseExpansion: store.toggleExerciseExpansion,
    updateExercise: store.updateExercise,
    // Legacy method for backward compatibility
    updateExercises: (exercises: Exercise[]) => {
      // Legacy method - no longer used
    },
  };
};
