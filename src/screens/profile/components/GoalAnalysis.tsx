import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, Calendar } from 'lucide-react-native';
import { colors, typography, spacing } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { UserProfile, WeightAnalysis } from '../../../hooks/useProfileData';

interface GoalAnalysisProps {
  userProfile: UserProfile;
  analysis: WeightAnalysis;
}

export const GoalAnalysis: React.FC<GoalAnalysisProps> = ({
  userProfile,
  analysis,
}) => {
  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalHeaderLeft}>
          <Target size={20} color={colors.primary.main} />
          <Text style={styles.goalTitle}>目標分析</Text>
        </View>
        {userProfile.targetDate && (
          <View style={styles.targetDateContainer}>
            <Calendar size={14} color={colors.text.secondary} />
            <Text style={styles.targetDateText}>
              目標日: {new Date(userProfile.targetDate).toLocaleDateString('ja-JP')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.goalProgress}>
        <View style={styles.analysisContainer}>
          <View style={styles.analysisRow}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>目標体重</Text>
              <Text style={styles.analysisValue}>
                {userProfile.targetWeight}kg
              </Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>目標まで</Text>
              <Text style={styles.analysisValue}>
                {analysis.daysToGoal > 0 ? `${analysis.daysToGoal}日` : '目標日未設定'}
              </Text>
            </View>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>必要な体重変化</Text>
              <Text style={[styles.analysisValue, {
                color: analysis.weightChange < 0 
                  ? colors.primary.main 
                  : analysis.weightChange > 0 
                    ? colors.status.error 
                    : colors.text.primary
              }]}>
                {analysis.weightChange >= 0 ? '+' : ''}{analysis.weightChange.toFixed(1)}kg
              </Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>必要な週間ペース</Text>
              <Text style={[styles.analysisValue, {
                color: analysis.weeklyPace < 0 
                  ? colors.primary.main 
                  : analysis.weeklyPace > 0 
                    ? colors.status.error 
                    : colors.text.primary
              }]}>
                {analysis.weeklyPace >= 0 ? '+' : ''}{analysis.weeklyPace.toFixed(2)}kg/週
              </Text>
            </View>
          </View>

          <View style={styles.analysisRow}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>基礎代謝</Text>
              <Text style={styles.analysisValue}>{analysis.bmr}kcal</Text>
            </View>
            <View style={[styles.analysisItem, styles.analysisItemFull]}>
              <Text style={styles.analysisLabel}>維持カロリー</Text>
              <Text style={styles.analysisValue}>{analysis.maintenanceCalories}kcal/日</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  goalProgress: {
    gap: spacing.sm,
  },
  analysisContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  analysisRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  analysisItem: {
    flex: 1,
  },
  analysisItemFull: {
    flex: 1,
  },
  analysisLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  analysisValue: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  targetDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  targetDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});