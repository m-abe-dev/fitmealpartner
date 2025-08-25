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
  const softSaturate = (x: number, k: number) => 1 - Math.exp(-x / Math.max(k, 1)); // 0→1に漸近

  // セットの推定重量（kg）: Epleyから weight ≈ e1RM / (1 + reps/30)
  // rm が無ければ、セッション平均rmか "1" を使って単位なし相対指標として扱う
  const estimateSetWeightKg = (reps: number, rm?: number, avgRm?: number) => {
    const baseRm = (rm && rm > 0) ? rm : (avgRm && avgRm > 0 ? avgRm : 1);
    const r = Math.max(1, reps || 1);
    return baseRm / (1 + r / 30);
  };

  // セッション平均RM（丸めずに算出）
  const computeAvgRm = () => {
    const strength = exercises.filter(ex => ex.type !== 'cardio');
    const values: number[] = [];
    strength.forEach(ex => {
      ex.sets.forEach(s => {
        const rm = (s as any).rm as number | undefined;
        if (typeof rm === 'number' && rm > 0) values.push(rm);
      });
    });
    if (!values.length) return undefined;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // ★ 新ロジック：筋トレスコア（0–100）
  // Sets: 最大40点 / Volume: 最大50点 / Variety: 最大10点
  const strengthScoreFromExercises = () => {
    const strength = exercises.filter(ex => ex.type !== 'cardio');
    const totalSets = strength.reduce((t, ex) => t + ex.sets.length, 0);
    if (totalSets === 0) return 0;

    // ---- (1) Sets（量：最大40点） ----
    // 「できるだけ多く」に応じつつ、無限加点は避けたいのでソフト飽和
    // 目安k=12（12セットで~28点、18セットで~34点、24セットで~37点）
    const setsScore = 40 * softSaturate(totalSets, 12);

    // ---- (2) Volume（負荷：最大50点） ----
    // セットごとに推定重量×回数を合算（トン数相当）。rmがある前提で重量近似、無ければ相対指標でも増加
    const avgRm = computeAvgRm(); // セッションの代表RM
    let eqVolume = 0; // 「重量×回数」の合計 (kg-reps 相当)
    strength.forEach(ex => {
      ex.sets.forEach(s => {
        const reps = s.reps ?? 0;
        if (reps <= 0) return;
        const rm = (s as any).rm as number | undefined;
        const estW = estimateSetWeightKg(reps, rm, avgRm);
        eqVolume += estW * reps;
      });
    });

    // 動的ターゲット：標準的セッション（10セット×8reps×70%×平均RM）
    // 平均RMが無ければ単位なし相対値として 10*8*1 = 80 を基準にする
    const HARD_TARGET = 10;
    const targetVolume =
      (avgRm && avgRm > 0)
        ? HARD_TARGET * 8 * 0.7 * avgRm
        : 80;

    // 1.2倍ターゲット付近で高得点、以降は漸近的に頭打ち
    const volumeScore = 50 * softSaturate(eqVolume / Math.max(targetVolume, 1), 1.2);

    // ---- (3) Variety（種目数：最大10点） ----
    const nExercises = strength.length;
    let varietyScore = 0;
    if (nExercises <= 0) {
      varietyScore = 0;
    } else if (nExercises < 4) {
      varietyScore = 10 * (nExercises / 4);                // 1→2.5点, 3→7.5点
    } else if (nExercises <= 6) {
      varietyScore = 10;                                   // 理想レンジ 4–6 種目
    } else if (nExercises <= 10) {
      varietyScore = Math.max(8, 10 - (nExercises - 6) * 0.5); // 多すぎは微減（最低8点）
    } else {
      varietyScore = 8;
    }

    const total = Math.round(setsScore + volumeScore + varietyScore);
    return clamp(total, 0, 100);
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
    if (sStrength === null || sCardio === null) {
      // どちらか片方だけの日はそのまま返す
      return (sStrength ?? sCardio) as number;
    }

    const best = Math.max(sStrength, sCardio);

    // 'bonus'モード: もう片方が 50 を超えていれば最大 +12.5 点まで軽くブースト
    const weaker = Math.min(sStrength, sCardio);
    const bonus = 0.25 * Math.max(0, weaker - 50); // 0〜12.5点
    return Math.min(100, Math.round(best + bonus));
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
    fontWeight: 'bold',
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