import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { Exercise } from '../types/workout.types';

interface TodayResultsProps {
  exercises: Exercise[];
  isExpanded: boolean;
  onToggle: () => void;
}

export const TodayResults: React.FC<TodayResultsProps> = ({
  exercises,
  isExpanded,
  onToggle
}) => {
  const getStrengthExercises = () => exercises.filter(ex => ex.type !== 'cardio').length;
  
  const getStrengthSets = () => {
    const strengthExercises = exercises.filter(ex => ex.type !== 'cardio');
    return strengthExercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  const getTotalReps = () => {
    const strengthExercises = exercises.filter(ex => ex.type !== 'cardio');
    return strengthExercises.reduce(
      (total, exercise) =>
        total + exercise.sets.reduce((setTotal, set) => setTotal + set.reps, 0),
      0,
    );
  };

  const getTotalRM = () => {
    const strengthExercises = exercises.filter(ex => ex.type !== 'cardio');
    const allSets = strengthExercises.flatMap(ex => ex.sets);
    const rmsWithValues = allSets
      .map(set => set.rm)
      .filter((rm): rm is number => rm !== undefined && rm > 0);
    if (rmsWithValues.length === 0) return 0;
    const sum = rmsWithValues.reduce((acc, rm) => acc + rm, 0);
    return Math.round(sum / rmsWithValues.length);
  };

  const getTotalTime = () => {
    const cardioExercises = exercises.filter(ex => ex.type === 'cardio');
    return cardioExercises.reduce(
      (total, exercise) =>
        total + exercise.sets.reduce((setTotal, set) => setTotal + (set.time || 0), 0),
      0,
    );
  };

  const getTotalDistance = () => {
    const cardioExercises = exercises.filter(ex => ex.type === 'cardio');
    return cardioExercises.reduce(
      (total, exercise) =>
        total + exercise.sets.reduce((setTotal, set) => setTotal + (set.distance || 0), 0),
      0,
    );
  };

  const hasCardioExercises = () => {
    return exercises.some(ex => ex.type === 'cardio');
  };

  const hasStrengthExercises = () => {
    return exercises.some(ex => ex.type !== 'cardio');
  };

  const calculateWorkoutScore = () => {
    const strengthSets = getStrengthSets();
    const totalReps = getTotalReps();
    const totalRM = getTotalRM();
    const totalTime = getTotalTime();
    const totalDistance = getTotalDistance();
    return strengthSets + totalReps + totalRM + Math.round(totalTime / 10) + Math.round(totalDistance * 10);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: '#DCFCE7', text: '#16A34A' };
    if (score >= 50) return { bg: '#FEF3C7', text: '#D97706' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  const score = calculateWorkoutScore();

  return (
    <TouchableOpacity style={styles.summaryCard} onPress={onToggle}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>今日の結果</Text>
        <View style={styles.summaryActions}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score).bg }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(score).text }]}>
              スコア: {score}
            </Text>
          </View>
          {isExpanded ?
            <ChevronUp size={20} color={colors.text.tertiary} /> :
            <ChevronDown size={20} color={colors.text.tertiary} />
          }
        </View>
      </View>

      {isExpanded && (
        <View style={styles.summaryContent}>
          {/* 筋トレ統計 */}
          {hasStrengthExercises() && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>💪 筋力トレーニング</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                    {getStrengthExercises()}
                  </Text>
                  <Text style={styles.statLabel}>種目数</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={[styles.statValue, { color: '#16A34A' }]}>
                    {getStrengthSets()}
                  </Text>
                  <Text style={styles.statLabel}>セット数</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FAF5FF' }]}>
                  <Text style={[styles.statValue, { color: '#9333EA' }]}>
                    {getTotalReps()}
                  </Text>
                  <Text style={styles.statLabel}>総回数</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
                  <Text style={[styles.statValue, { color: '#EA580C' }]}>
                    {getTotalRM()}
                  </Text>
                  <Text style={styles.statLabel}>平均RM</Text>
                </View>
              </View>
            </View>
          )}

          {/* 有酸素統計 */}
          {hasCardioExercises() && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🏃‍♂️ 有酸素運動</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>
                    {getTotalTime()}
                  </Text>
                  <Text style={styles.statLabel}>合計時間(分)</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#F0F9FF' }]}>
                  <Text style={[styles.statValue, { color: '#0EA5E9' }]}>
                    {getTotalDistance().toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>合計距離(km)</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  summaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  scoreText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  summaryContent: {
    marginTop: spacing.md,
  },
  sectionContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    minWidth: '22%',
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xxxs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});