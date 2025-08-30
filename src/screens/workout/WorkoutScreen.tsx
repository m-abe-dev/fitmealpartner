import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell } from 'lucide-react-native';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { colors, typography, spacing, radius, shadows } from '../../design-system';

// Components
import { NotificationCenter } from './components/NotificationCenter';
import { Calendar } from './components/Calendar';
import { TodayResults } from './components/TodayResults';
import { ExerciseList } from './components/ExerciseList';
import { ExerciseSelection } from './components/ExerciseSelection';
import { ExerciseDetailView } from './components/ExerciseDetailView';
import { WorkoutPreviewModal } from './components/WorkoutPreviewModal';
import { FloatingActionButtons } from './components/FloatingActionButtons';

// Hooks
import { useWorkoutScreen } from '../../hooks/useWorkoutScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const WorkoutScreen: React.FC = () => {
  const {
    scrollViewRef,
    currentView,
    selectedCategory,
    selectedExercise,
    refreshing,
    isTodayResultsExpanded,
    exercises,
    selectedDay,
    selectedMonth,
    selectedYear,
    currentMonth,
    setSelectedCategory,
    setIsTodayResultsExpanded,
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
  } = useWorkoutScreen();

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
      <ScreenHeader
        title="今日の筋トレ"
        icon={<Dumbbell size={20} color={colors.primary.main} />}
      />

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
          isVisible={selectedDay !== null}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
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
    backgroundColor: colors.gray[100],
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