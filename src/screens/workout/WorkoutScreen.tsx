import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Crown } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';

// Components
import { NotificationCenter } from './components/NotificationCenter';
import { Calendar } from './components/Calendar';
import { TodayResults } from './components/TodayResults';
import { ExerciseList } from './components/ExerciseList';
import { ExerciseSelection } from './components/ExerciseSelection';
import { ExerciseDetailView } from './components/ExerciseDetailView';
import { WorkoutPreviewModal } from './components/WorkoutPreviewModal';
import { FloatingActionButtons } from './components/FloatingActionButtons';

// Types and Data
import { WorkoutView, Exercise, ExerciseTemplate, WorkoutSet, WorkoutDay } from './types/workout.types';
import { workoutHistory, initialExercises } from './data/mockData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const WorkoutScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // View state
  const [currentView, setCurrentView] = useState<WorkoutView>("main");
  const [selectedCategory, setSelectedCategory] = useState<string>("Chest");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  
  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [isTodayResultsExpanded, setIsTodayResultsExpanded] = useState(false);
  
  // Data state
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayWorkout, setSelectedDayWorkout] = useState<WorkoutDay | null>(null);

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
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, isExpanded: !exercise.isExpanded }
          : exercise,
      ),
    );
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((exercise) =>
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
          : exercise,
      ),
    );
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise,
      ),
    );
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'time' | 'distance', value: string) => {
    const numericValue = parseFloat(value) || 0;
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
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
                  : set,
              ),
            }
          : exercise,
      ),
    );
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
    const today_date = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const exercisesList = exercises.map(exercise => {
      const setsInfo = exercise.sets.map((set, index) =>
        `  ${index + 1}. ${set.weight}kg × ${set.reps}回${set.rm ? ` (RM: ${set.rm})` : ''}`
      ).join('\n');
      return `🏋️ ${exercise.name}\n${setsInfo}`;
    }).join('\n\n');

    const stats = {
      exercises: exercises.length,
      sets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
      reps: exercises.reduce((total, exercise) => total + exercise.sets.reduce((setTotal, set) => setTotal + set.reps, 0), 0),
      averageRM: (() => {
        const allSets = exercises.flatMap(ex => ex.sets);
        const rmsWithValues = allSets.map(set => set.rm).filter((rm): rm is number => rm !== undefined && rm > 0);
        if (rmsWithValues.length === 0) return 0;
        const sum = rmsWithValues.reduce((acc, rm) => acc + rm, 0);
        return Math.round(sum / rmsWithValues.length);
      })()
    };

    const score = stats.sets + stats.reps + stats.averageRM;
    const shareText = `💪 今日のトレーニング (${today_date})\n\n${exercisesList}\n\n📊 Today's Training Volume\n・種目数: ${stats.exercises}\n・セット数: ${stats.sets}\n・総回数: ${stats.reps}\n・平均RM: ${stats.averageRM}\n・スコア: ${score}\n\n#筋トレ #ワークアウト #トレーニング`;

    Alert.alert('シェア', 'トレーニング情報をシェアしました');
  };

  // Navigation handlers
  const handleLogWorkout = () => {
    setCurrentView("exercise-selection");
  };

  const handleSelectExercise = (exercise: ExerciseTemplate) => {
    setSelectedExercise(exercise);
    setCurrentView("exercise-detail");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
  };

  const handleBackToSelection = () => {
    setCurrentView("exercise-selection");
  };

  const handleRecordWorkout = (exerciseName: string, sets: WorkoutSet[]) => {
    const newExercise: Exercise = {
      id: `recorded-${Date.now()}`,
      name: exerciseName,
      sets: sets.map(set => ({ ...set })),
      isExpanded: true,
      type: selectedExercise?.category === '有酸素' ? 'cardio' : 'strength',
    };

    setExercises((prev) => [...prev, newExercise]);
    setCurrentView("main");
  };

  // Render different views
  if (currentView === "exercise-selection") {
    return (
      <ExerciseSelection
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onExerciseSelect={handleSelectExercise}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentView === "exercise-detail") {
    return (
      <ExerciseDetailView
        exercise={selectedExercise}
        onBack={handleBackToSelection}
        onRecordWorkout={handleRecordWorkout}
      />
    );
  }

  // Main view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Dumbbell size={20} color={colors.primary.main} />
          <Text style={styles.title}>今日の筋トレ</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationCenter />
          <TouchableOpacity style={styles.proButton}>
            <Crown size={16} color={colors.primary.main} />
            <Text style={styles.proButtonText}>PRO</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: SCREEN_HEIGHT - 100,
            paddingBottom: 150
          }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false} // バウンスを無効化
        overScrollMode="never" // Androidでのオーバースクロールを無効化
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Calendar View */}
        <Calendar onDayClick={handleDayClick} />

        {/* Today's Results */}
        <TodayResults
          exercises={exercises}
          isExpanded={isTodayResultsExpanded}
          onToggle={() => setIsTodayResultsExpanded(!isTodayResultsExpanded)}
        />

        {/* Exercise List */}
        <ExerciseList
          exercises={exercises}
          onToggleExpansion={toggleExerciseExpansion}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
          onDeleteExercise={handleDeleteExercise}
          onUpdateSet={handleUpdateSet}
        />

        {/* Workout Preview Modal */}
        <WorkoutPreviewModal
          isVisible={selectedDay !== null && selectedDayWorkout !== null}
          selectedDay={selectedDay}
          selectedDayWorkout={selectedDayWorkout}
          currentMonth={currentMonth}
          onClose={handleClosePreview}
        />
      </ScrollView>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onSharePress={handleShareWorkout}
        onAddPress={handleLogWorkout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  proButton: {
   flexDirection: 'row',
       alignItems: 'center',
       backgroundColor: colors.primary[50],
       paddingHorizontal: spacing.sm,
       paddingVertical: spacing.xs,
       borderRadius: radius.full,
       gap: spacing.xxs,
  },
  proButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
});