import { useState, useCallback } from 'react';
import { Exercise } from '../screens/workout/types/workout.types';
import { initialExercises } from '../screens/workout/data/mockData';

// グローバルなワークアウトデータ管理
let globalExercises: Exercise[] = initialExercises;
const subscribers: Set<() => void> = new Set();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

export const useWorkoutData = () => {
  const [exercises, setExercises] = useState<Exercise[]>(globalExercises);

  // サブスクライブ（コンポーネントマウント時）
  const subscribe = useCallback(() => {
    const updateExercises = () => {
      setExercises([...globalExercises]);
    };
    
    subscribers.add(updateExercises);
    
    // クリーンアップ関数を返す
    return () => {
      subscribers.delete(updateExercises);
    };
  }, []);

  // 筋トレデータを更新
  const updateExercises = useCallback((newExercises: Exercise[]) => {
    globalExercises = newExercises;
    notifySubscribers();
  }, []);

  // 単一の筋トレを更新
  const updateExercise = useCallback((exerciseId: string, updates: Partial<Exercise>) => {
    globalExercises = globalExercises.map(exercise =>
      exercise.id === exerciseId
        ? { ...exercise, ...updates }
        : exercise
    );
    notifySubscribers();
  }, []);

  // セットを追加
  const addSet = useCallback((exerciseId: string) => {
    globalExercises = globalExercises.map(exercise =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: `${exerciseId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                weight: 0,
                reps: 0,
                rm: undefined,
                time: exercise.type === 'cardio' ? 0 : undefined,
                distance: exercise.type === 'cardio' ? 0 : undefined,
              },
            ],
          }
        : exercise
    );
    notifySubscribers();
  }, []);

  // セットを更新
  const updateSet = useCallback((exerciseId: string, setId: string, field: 'weight' | 'reps' | 'time' | 'distance', value: string) => {
    const numericValue = parseFloat(value) || 0;
    
    // 1RM計算関数
    const calculateRM = (weight: number, reps: number): number | undefined => {
      if (weight <= 0 || reps <= 0) return undefined;
      return Math.round(weight * (1 + reps / 30));
    };

    globalExercises = globalExercises.map(exercise =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map(set =>
              set.id === setId
                ? {
                    ...set,
                    [field]: numericValue,
                    rm: field === 'weight' || field === 'reps'
                      ? calculateRM(
                          field === 'weight' ? numericValue : set.weight,
                          field === 'reps' ? numericValue : set.reps
                        )
                      : set.rm,
                  }
                : set
            ),
          }
        : exercise
    );
    notifySubscribers();
  }, []);

  // セットを削除
  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    globalExercises = globalExercises.map(exercise =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== setId),
          }
        : exercise
    );
    notifySubscribers();
  }, []);

  // エクササイズを削除
  const deleteExercise = useCallback((exerciseId: string) => {
    globalExercises = globalExercises.filter(exercise => exercise.id !== exerciseId);
    notifySubscribers();
  }, []);

  // エクササイズを追加
  const addExercise = useCallback((newExercise: Exercise) => {
    globalExercises = [...globalExercises, newExercise];
    notifySubscribers();
  }, []);

  // エクササイズの展開状態を切り替え
  const toggleExerciseExpansion = useCallback((exerciseId: string) => {
    globalExercises = globalExercises.map((exercise) =>
      exercise.id === exerciseId
        ? { ...exercise, isExpanded: !exercise.isExpanded }
        : exercise
    );
    notifySubscribers();
  }, []);

  return {
    exercises,
    subscribe,
    updateExercises,
    updateExercise,
    addSet,
    updateSet,
    deleteSet,
    deleteExercise,
    addExercise,
    toggleExerciseExpansion,
  };
};