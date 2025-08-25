import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/common/Card';
import { Progress, NutritionCircularProgress } from '../../../components/common/Progress';
import { colors, typography, spacing, radius } from '../../../design-system';
import { NutritionData, NutritionScores } from '../types/nutrition.types';
import { getScoreColor } from '../../../utils/nutritionScoring';

interface NutritionScoreCardProps {
  nutritionData: NutritionData;
  scores: NutritionScores;
}

export const NutritionScoreCard: React.FC<NutritionScoreCardProps> = ({
  nutritionData,
  scores,
}) => {
  // スコア色を実際の色に変換
  const getScoreColorValue = (score: number) => {
    const colorType = getScoreColor(score);
    switch (colorType) {
      case 'success':
        return { bg: colors.status.success + '20', text: colors.status.success };
      case 'warning':
        return { bg: colors.status.warning + '20', text: colors.status.warning };
      case 'error':
        return { bg: colors.status.error + '20', text: colors.status.error };
      default:
        return { bg: colors.gray[200], text: colors.text.secondary };
    }
  };

  return (
    <View style={styles.nutritionCard}>
      <View style={styles.nutritionCardGradient}>
        {/* ヘッダー */}
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionTitle}>今日の栄養</Text>
          <View style={[styles.totalScoreBadge, { backgroundColor: getScoreColorValue(scores.total).bg }]}>
            <Text style={[styles.totalScoreText, { color: getScoreColorValue(scores.total).text }]}>
              スコア {scores.total}
            </Text>
          </View>
        </View>

        {/* カロリーセクション */}
        <View style={styles.caloriesMainSection}>
          <View style={styles.caloriesCircleContainer}>
            <NutritionCircularProgress
              current={nutritionData.calories.current}
              target={nutritionData.calories.target}
              nutrientType="calories"
              size={120}
              strokeWidth={8}
              color={colors.text.inverse}
            />
            <View style={styles.caloriesScoreBadge}>
              <Text style={styles.caloriesScoreText}>スコア {scores.calories}</Text>
            </View>
          </View>
          <View style={styles.caloriesInfo}>
            <Progress
              value={nutritionData.calories.current}
              max={nutritionData.calories.target}
              color={colors.text.inverse}
              backgroundColor={colors.text.inverse + '30'}
              height={8}
              style={styles.caloriesProgress}
            />
            <Text style={styles.remainingText}>
              残り {nutritionData.calories.target - nutritionData.calories.current} kcal
            </Text>
          </View>
        </View>

        {/* マクロ栄養素セクション */}
        <View style={styles.macroSection}>
          <View style={styles.macroGrid}>
            {/* タンパク質 */}
            <View style={styles.macroItem}>
              <NutritionCircularProgress
                current={nutritionData.protein.current}
                target={nutritionData.protein.target}
                nutrientType="protein"
                size={80}
                strokeWidth={6}
              />
              <Text style={styles.macroLabel}>タンパク質</Text>
              <View style={[styles.macroScoreBadge, { backgroundColor: getScoreColorValue(scores.protein).bg }]}>
                <Text style={[styles.macroScoreText, { color: getScoreColorValue(scores.protein).text }]}>
                  {scores.protein}
                </Text>
              </View>
            </View>

            {/* 脂質 */}
            <View style={styles.macroItem}>
              <NutritionCircularProgress
                current={nutritionData.fat.current}
                target={nutritionData.fat.target}
                nutrientType="fat"
                size={80}
                strokeWidth={6}
              />
              <Text style={styles.macroLabel}>脂質</Text>
              <View style={[styles.macroScoreBadge, { backgroundColor: getScoreColorValue(scores.fat).bg }]}>
                <Text style={[styles.macroScoreText, { color: getScoreColorValue(scores.fat).text }]}>
                  {scores.fat}
                </Text>
              </View>
            </View>

            {/* 炭水化物 */}
            <View style={styles.macroItem}>
              <NutritionCircularProgress
                current={nutritionData.carbs.current}
                target={nutritionData.carbs.target}
                nutrientType="carbs"
                size={80}
                strokeWidth={6}
              />
              <Text style={styles.macroLabel}>炭水化物</Text>
              <View style={[styles.macroScoreBadge, { backgroundColor: getScoreColorValue(scores.carbs).bg }]}>
                <Text style={[styles.macroScoreText, { color: getScoreColorValue(scores.carbs).text }]}>
                  {scores.carbs}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nutritionCard: {
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.lg,
  },
  nutritionCardGradient: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    fontWeight: 'bold',
  },
  totalScoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.text.inverse + '30',
  },
  totalScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  caloriesMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.lg,
  },
  caloriesCircleContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  caloriesScoreBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.text.inverse + 'E6',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    shadowColor: colors.gray[600],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  caloriesScoreText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesProgress: {
    marginBottom: spacing.sm,
  },
  remainingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse + '80',
    fontFamily: typography.fontFamily.regular,
  },
  macroSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  macroScoreBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.xxxs,
  },
  macroScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
});