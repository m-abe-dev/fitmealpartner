import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { getNutritionBadgeText } from '../../../utils/profileUtils';
import { UserProfile, NutritionTargets as NutritionTargetsType } from '../../../hooks/useProfileData';

interface NutritionTargetsProps {
  userProfile: UserProfile;
  nutritionTargets: NutritionTargetsType;
}

export const NutritionTargets: React.FC<NutritionTargetsProps> = ({
  userProfile,
  nutritionTargets,
}) => {
  return (
    <Card style={styles.nutritionCard}>
      <View style={styles.nutritionHeader}>
        <Text style={styles.nutritionTitle}>計算された栄養目標</Text>
        <Badge variant="default" size="small" style={styles.autoBadge}>
          {getNutritionBadgeText(userProfile.weight, userProfile.targetWeight)}
        </Badge>
      </View>

      {/* 目標カロリーとタンパク質 */}
      <View style={styles.macroRow}>
        <View style={styles.macroItemNew}>
          <Text style={styles.macroLabel}>目標カロリー</Text>
          <Text style={styles.macroValueLarge}>{nutritionTargets.calories}</Text>
          <Text style={styles.macroUnit}>kcal/日</Text>
        </View>
        <View style={styles.macroItemNew}>
          <Text style={styles.macroLabel}>目標タンパク質</Text>
          <Text style={styles.macroValueLarge}>{nutritionTargets.protein}</Text>
          <Text style={styles.macroUnit}>g/日</Text>
        </View>
      </View>

      {/* 脂質と炭水化物 */}
      <View style={styles.macroRow}>
        <View style={styles.macroItemNew}>
          <Text style={styles.macroLabel}>目標炭水化物</Text>
          <Text style={styles.macroValueLarge}>{nutritionTargets.carbs}</Text>
          <Text style={styles.macroUnit}>g/日</Text>
        </View>
        <View style={styles.macroItemNew}>
          <Text style={styles.macroLabel}>目標脂質</Text>
          <Text style={styles.macroValueLarge}>{nutritionTargets.fat}</Text>
          <Text style={styles.macroUnit}>g/日</Text>
        </View>
      </View>

      {/* PFCバランス */}
      <View style={styles.pfcBalanceContainer}>
        <Text style={styles.pfcBalanceTitle}>PFCバランス</Text>
        <View style={styles.pfcBalance}>
          <View
            style={[styles.pfcBar, {
              backgroundColor: colors.nutrition.protein,
              flex: (nutritionTargets.protein * 4) / nutritionTargets.calories
            }]}
          />
          <View
            style={[styles.pfcBar, {
              backgroundColor: colors.nutrition.fat,
              flex: (nutritionTargets.fat * 9) / nutritionTargets.calories
            }]}
          />
          <View
            style={[styles.pfcBar, {
              backgroundColor: colors.nutrition.carbs,
              flex: (nutritionTargets.carbs * 4) / nutritionTargets.calories
            }]}
          />
        </View>
        <View style={styles.pfcLegend}>
          <View style={styles.pfcLegendItem}>
            <View style={[styles.pfcColorDot, { backgroundColor: colors.nutrition.protein }]} />
            <Text style={styles.pfcLegendText}>
              P: {Math.round((nutritionTargets.protein * 4) / nutritionTargets.calories * 100)}%
            </Text>
          </View>
          <View style={styles.pfcLegendItem}>
            <View style={[styles.pfcColorDot, { backgroundColor: colors.nutrition.fat }]} />
            <Text style={styles.pfcLegendText}>
              F: {Math.round((nutritionTargets.fat * 9) / nutritionTargets.calories * 100)}%
            </Text>
          </View>
          <View style={styles.pfcLegendItem}>
            <View style={[styles.pfcColorDot, { backgroundColor: colors.nutrition.carbs }]} />
            <Text style={styles.pfcLegendText}>
              C: {Math.round((nutritionTargets.carbs * 4) / nutritionTargets.calories * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  nutritionCard: {
    marginBottom: spacing.md,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    fontWeight: 'bold',
  },
  autoBadge: {
    backgroundColor: colors.gray[100],
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  macroItemNew: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.md,
  },
  macroLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  macroValueLarge: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    marginBottom: spacing.xxxs,
  },
  macroUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  pfcBalanceContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.md,
  },
  pfcBalanceTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
  },
  pfcBalance: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  pfcBar: {
    height: '100%',
  },
  pfcLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pfcLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pfcColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pfcLegendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
});