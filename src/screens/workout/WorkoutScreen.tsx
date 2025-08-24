import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../design-system';

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

export const WorkoutScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<WorkoutView>("main");
  const [selectedCategory, setSelectedCategory] = useState<string>("Chest");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  const [isTodayResultsExpanded, setIsTodayResultsExpanded] = useState(false);
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

  const onRefresh = async () => {
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

  const handleDayClick = (day: number) => {
    const workoutData = getWorkoutForDay(day);
    if (workoutData) {
      setSelectedDay(day);
      setSelectedDayWorkout(workoutData);
    }
  };

  const closePreview = () => {
    setSelectedDay(null);
    setSelectedDayWorkout(null);
  };

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

    const getTotalExercises = () => exercises.length;
    const getTotalSets = () => exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const getTotalReps = () => exercises.reduce((total, exercise) => total + exercise.sets.reduce((setTotal, set) => setTotal + set.reps, 0), 0);
    const getTotalRM = () => {
      const allSets = exercises.flatMap(ex => ex.sets);
      const rmsWithValues = allSets.map(set => set.rm).filter((rm): rm is number => rm !== undefined && rm > 0);
      if (rmsWithValues.length === 0) return 0;
      const sum = rmsWithValues.reduce((acc, rm) => acc + rm, 0);
      return Math.round(sum / rmsWithValues.length);
    };
    const calculateWorkoutScore = () => getTotalSets() + getTotalReps() + getTotalRM();

    const shareText = `💪 今日のトレーニング (${today_date})\n\n${exercisesList}\n\n📊 Today's Training Volume\n・種目数: ${getTotalExercises()}\n・セット数: ${getTotalSets()}\n・総回数: ${getTotalReps()}\n・平均RM: ${getTotalRM()}\n・スコア: ${calculateWorkoutScore()}\n\n#筋トレ #ワークアウト #トレーニング`;

    Alert.alert('シェア', 'トレーニング情報をシェアしました');
  };

  const logWorkout = () => {
    setCurrentView("exercise-selection");
  };

  const selectExercise = (exercise: ExerciseTemplate) => {
    setSelectedExercise(exercise);
    setCurrentView("exercise-detail");
  };

  const goBackToMain = () => {
    setCurrentView("main");
  };

  const goBackToSelection = () => {
    setCurrentView("exercise-selection");
  };

  const handleRecordWorkout = (exerciseName: string, sets: WorkoutSet[]) => {
    const newExercise: Exercise = {
      id: `recorded-${Date.now()}`,
      name: exerciseName,
      sets: sets.map(set => ({ ...set })),
      isExpanded: true,
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
        onExerciseSelect={selectExercise}
        onBack={goBackToMain}
      />
    );
  }

  if (currentView === "exercise-detail") {
    return (
      <ExerciseDetailView
        exercise={selectedExercise}
        onBack={goBackToSelection}
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
          <CalendarIcon size={20} color={colors.text.secondary} />
          <Text style={styles.title}>今日の筋トレ</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationCenter />
          <TouchableOpacity style={styles.proButton}>
            <LinearGradient
              colors={['#FFC107', '#FF9800']}
              style={styles.proGradient}
            >
              <Text style={styles.proText}>PROに登録</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
        />

        {/* Workout Preview Modal */}
        <WorkoutPreviewModal
          isVisible={selectedDay !== null && selectedDayWorkout !== null}
          selectedDay={selectedDay}
          selectedDayWorkout={selectedDayWorkout}
          currentMonth={currentMonth}
          onClose={closePreview}
        />
      </ScrollView>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onSharePress={handleShareWorkout}
        onAddPress={logWorkout}
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
    borderRadius: spacing.md,
  },
  proGradient: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
  },
  proText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});