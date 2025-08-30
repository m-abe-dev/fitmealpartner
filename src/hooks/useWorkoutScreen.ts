import { useState, useRef, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import {
  WorkoutView,
  Exercise,
  ExerciseTemplate,
  WorkoutSet,
  WorkoutDay,
} from '../screens/workout/types/workout.types';
import { workoutHistory } from '../screens/workout/data/mockData';
import { useWorkoutData } from './useWorkoutData';

export const useWorkoutScreen = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  // View state
  const [currentView, setCurrentView] = useState<WorkoutView>('main');
  const [selectedCategory, setSelectedCategory] = useState<string>('胸');
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseTemplate | null>(null);

  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [isTodayResultsExpanded, setIsTodayResultsExpanded] = useState(false);

  // Shared workout data
  const {
    exercises,
    addSet,
    updateSet,
    deleteSet,
    deleteExercise,
    updateExercise,
    addExercise,
    toggleExerciseExpansion: toggleExerciseExpansionData,
  } = useWorkoutData();

  // Calendar state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayWorkout, setSelectedDayWorkout] =
    useState<WorkoutDay | null>(null);

  // Calendar data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();

  // Helper functions
  const getWorkoutForDay = (day: number): WorkoutDay | null => {
    return workoutHistory.find(workout => workout.date === day) || null;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleExerciseExpansion = (exerciseId: string) => {
    toggleExerciseExpansionData(exerciseId);
  };

  const handleAddSet = (exerciseId: string) => {
    addSet(exerciseId);
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    deleteSet(exerciseId, setId);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    deleteExercise(exerciseId);
  };

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps' | 'time' | 'distance',
    value: string
  ) => {
    updateSet(exerciseId, setId, field, value);
  };

  // Utility function for RM calculation
  const calculateRM = (weight: number, reps: number): number | undefined => {
    if (weight <= 0 || reps <= 0) return undefined;
    return Math.round(weight * (1 + reps / 30) * 100) / 100;
  };

  // Calendar and preview handlers
  const handleDayClick = (day: number) => {
    const workoutData = getWorkoutForDay(day);
    if (workoutData) {
      setSelectedDay(day);
      setSelectedDayWorkout(workoutData);
    }
  };

  const handleClosePreview = () => {
    setSelectedDay(null);
    setSelectedDayWorkout(null);
  };

  // Share functionality
  const handleShareWorkout = () => {
    const today_date = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const exercisesList = exercises
      .map(exercise => {
        const setsInfo = exercise.sets
          .map(
            (set, index) =>
              `  ${index + 1}. ${set.weight}kg × ${set.reps}回${
                set.rm ? ` (RM: ${set.rm})` : ''
              }`
          )
          .join('\n');
        return `🏋️ ${exercise.name}\n${setsInfo}`;
      })
      .join('\n\n');

    const stats = {
      exercises: exercises.length,
      sets: exercises.reduce(
        (total, exercise) => total + exercise.sets.length,
        0
      ),
      reps: exercises.reduce(
        (total, exercise) =>
          total +
          exercise.sets.reduce((setTotal, set) => setTotal + set.reps, 0),
        0
      ),
      averageRM: (() => {
        const allSets = exercises.flatMap(ex => ex.sets);
        const rmsWithValues = allSets
          .map(set => set.rm)
          .filter((rm): rm is number => rm !== undefined && rm > 0);
        if (rmsWithValues.length === 0) return 0;
        const sum = rmsWithValues.reduce((acc, rm) => acc + rm, 0);
        return Math.round(sum / rmsWithValues.length);
      })(),
    };

    const score = stats.sets + stats.reps + stats.averageRM;
    const shareText = `💪 今日のトレーニング (${today_date})\n\n${exercisesList}\n\n📊 Today's Training Volume\n・種目数: ${stats.exercises}\n・セット数: ${stats.sets}\n・総回数: ${stats.reps}\n・平均RM: ${stats.averageRM}\n・スコア: ${score}\n\n#筋トレ #ワークアウト #トレーニング`;

    Alert.alert('シェア', 'トレーニング情報をシェアしました');
  };

  // Navigation handlers
  const handleLogWorkout = () => {
    setCurrentView('exercise-selection');
  };

  const handleSelectExercise = (exercise: ExerciseTemplate) => {
    setSelectedExercise(exercise);
    setCurrentView('exercise-detail');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  const handleBackToSelection = () => {
    setCurrentView('exercise-selection');
  };

  const handleRecordWorkout = async (
    exerciseName: string,
    sets: WorkoutSet[]
  ) => {
    console.log('🚀 handleRecordWorkout called:', {
      exerciseName,
      sets,
      selectedExercise,
    });

    if (!selectedExercise) {
      console.error('❌ No selected exercise');
      return;
    }

    const newExercise: Exercise = {
      id: selectedExercise.id,
      name: exerciseName,
      category: selectedExercise.category,
      sets: sets,
      isExpanded: true,
      type: selectedExercise.category === '有酸素' ? 'cardio' : 'strength',
    };

    console.log('🔧 Creating exercise with category:', selectedExercise.category, 'type:', newExercise.type);

    try {
      await addExercise(newExercise);
      console.log('✅ Exercise recorded successfully');
      setCurrentView('main');
    } catch (error) {
      console.error('❌ Failed to record exercise:', error);
      Alert.alert('エラー', 'ワークアウトの記録に失敗しました');
    }
  };

  return {
    // Refs
    scrollViewRef,

    // State
    currentView,
    selectedCategory,
    selectedExercise,
    refreshing,
    isTodayResultsExpanded,
    exercises,
    selectedDay,
    selectedDayWorkout,
    currentMonth,

    // State setters
    setCurrentView,
    setSelectedCategory,
    setIsTodayResultsExpanded,

    // Handlers
    handleRefresh,
    toggleExerciseExpansion,
    handleAddSet,
    handleDeleteSet,
    handleDeleteExercise,
    handleUpdateSet,
    handleDayClick,
    handleClosePreview,
    handleShareWorkout,
    handleLogWorkout,
    handleSelectExercise,
    handleBackToMain,
    handleBackToSelection,
    handleRecordWorkout,
  };
};
