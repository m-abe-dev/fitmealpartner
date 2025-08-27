import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, Calendar, AlertTriangle, Info } from 'lucide-react-native';
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
  // 警告メッセージの取得
  const getWarningMessage = () => {
    const weeklyPaceKg = Math.abs(analysis.weeklyPace);

    if (analysis.weightChange < 0 && weeklyPaceKg > 1.0) {
      return {
        type: 'danger' as const,
        title: '⚠️ 減量ペースについて',
        message: `週${weeklyPaceKg.toFixed(1)}kgの減量は推奨されません。\n\n健康的な減量は週0.5-1.0kgが目安です。\n急激な減量は筋肉量の減少やリバウンドのリスクが高まります。`,
        risks: '筋肉量の過度な減少、基礎代謝の低下、栄養失調、胆石形成などのリスクがあります。'
      };
    } else if (analysis.weightChange > 0 && weeklyPaceKg > 0.5) {
      return {
        type: 'caution' as const,
        title: '⚠️ 増量ペースについて',
        message: `週${weeklyPaceKg.toFixed(1)}kgの増量は速すぎる可能性があります。\n\n健康的な増量は週0.25-0.5kgが目安です。\n急激な増量は体脂肪の過剰な蓄積につながります。`,
        risks: null
      };
    }

    return null;
  };

  const warningInfo = getWarningMessage();

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

      {/* 警告メッセージ */}
      {warningInfo && (
        <View style={[
          styles.warningContainer,
          warningInfo.type === 'danger' ? styles.warningDanger : styles.warningCaution
        ]}>
          <View style={styles.warningHeader}>
            {warningInfo.type === 'danger' ? (
              <AlertTriangle size={16} color={colors.status.error} />
            ) : (
              <Info size={16} color={colors.status.warning} />
            )}
            <Text style={[
              styles.warningTitle,
              { color: warningInfo.type === 'danger' ? colors.status.error : colors.status.warning }
            ]}>
              {warningInfo.title}
            </Text>
          </View>
          <Text style={styles.warningMessage}>
            {warningInfo.message}
          </Text>
          {warningInfo.risks && (
            <Text style={styles.warningRisks}>
              {warningInfo.risks}
            </Text>
          )}
          {analysis.recommendedWeeks && (
            <Text style={styles.warningRecommendation}>
              推奨期間: {analysis.recommendedWeeks.toFixed(0)}週間
            </Text>
          )}
        </View>
      )}

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
  // 警告メッセージのスタイル
  warningContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningDanger: {
    backgroundColor: colors.status.error + '10',
    borderColor: colors.status.error + '30',
  },
  warningCaution: {
    backgroundColor: colors.status.warning + '10',
    borderColor: colors.status.warning + '30',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  warningMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.sm * 1.4,
    marginBottom: spacing.xs,
  },
  warningRisks: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.sm * 1.4,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  warningRecommendation: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
});