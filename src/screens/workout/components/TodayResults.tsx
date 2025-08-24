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

  // 追加: ヘルパー（コンポーネント内に定義）
  const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

  /** 筋トレ: reps>=8 を「ハードセット」の近似に（RPEや重量が無い前提のMVP） */
  const countHardStrengthSets = () => {
    const strength = exercises.filter(ex => ex.type !== 'cardio');
    return strength.reduce(
      (sum, ex) => sum + ex.sets.filter(set => (set.reps ?? 0) >= 8).length,
      0
    );
  };

  /** 筋トレスコア 0–100
   *  S1 量(0–70): ハードセット数 vs 目安(10)
   *  S2 質(0–30): 8–12回レンジの比率（筋肥大レンジ近似）
   */
  const strengthScoreFromExercises = () => {
    const strength = exercises.filter(ex => ex.type !== 'cardio');
    const totalSets = strength.reduce((t, ex) => t + ex.sets.length, 0);
    if (totalSets === 0) return 0;

    const HARD_TARGET = 10; // セッション目安
    const hardSets = countHardStrengthSets();
    const s1 = 70 * clamp(hardSets / HARD_TARGET, 0, 1);

    const inHypertrophy =
      strength.reduce(
        (t, ex) => t + ex.sets.filter(s => {
          const r = s.reps ?? 0;
          return r >= 6 && r <= 12;
        }).length,
        0
      );
    const quality = totalSets > 0 ? inHypertrophy / totalSets : 0;
    const s2 = 30 * clamp(quality, 0, 1);

    return Math.round(s1 + s2);
  };

  /** 有酸素スコア 0–100
   *  S1 負荷(0–70): 時間×強度係数 vs 目安(30分)
   *  S2 質(0–30): 平均強度係数（6:00/km を基準1.0, 4:00/km≈1.5, 12:00/km≈0.5）
   *  ※ distance/time が無いセットは係数=1.0 として扱う
   */
  const cardioScoreFromExercises = () => {
    const cardio = exercises.filter(ex => ex.type === 'cardio');
    if (cardio.length === 0) return 0;

    type Agg = { time: number; weighted: number };
    const agg = cardio.reduce<Agg>((acc, ex) => {
      ex.sets.forEach(s => {
        const minutes = s.time ?? 0;          // 分
        const km = s.distance ?? 0;           // km
        if (minutes <= 0) return;
        // 強度係数: pace基準（安全な範囲でクリップ）
        const pace = km > 0 ? minutes / km : null; // min/km
        // 6:00/km => 1.0, 4:00/km => 1.5, 12:00/km => 0.5
        const intensity = pace ? clamp(6 / pace, 0.5, 2) : 1.0;
        acc.time += minutes;
        acc.weighted += minutes * intensity;
      });
      return acc;
    }, { time: 0, weighted: 0 });

    if (agg.time <= 0) return 0;

    const avgIntensity = agg.weighted / agg.time;
    const eqLoad = agg.time * avgIntensity; // 「強度付き時間」

    const DAILY_TARGET_MIN = 30; // デイリー目安
    const s1 = 70 * clamp(eqLoad / DAILY_TARGET_MIN, 0, 1);
    const s2 = 30 * clamp(avgIntensity / 1.2, 0, 1); // 1.2相当で満点寄せ

    return Math.round(s1 + s2);
  };

  // 置き換え: トータルスコア（0–100）
  const calculateWorkoutScore = () => {
    const hasStrength = hasStrengthExercises();
    const hasCardio = hasCardioExercises();

    if (!hasStrength && !hasCardio) return 0;

    const sStrength = hasStrength ? strengthScoreFromExercises() : null;
    const sCardio   = hasCardio   ? cardioScoreFromExercises()   : null;

    // 両方ある日は50/50、どちらか片方のみならそれを採用
    if (sStrength !== null && sCardio !== null) {
      return Math.round((sStrength + sCardio) / 2);
    }
    return (sStrength ?? sCardio ?? 0);
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