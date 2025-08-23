import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Activity, Calendar, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { PeriodAIData } from '../types/dashboard.types';

interface AICoachSectionProps {
  currentAIData: PeriodAIData;
}

export const AICoachSection: React.FC<AICoachSectionProps> = ({ currentAIData }) => {
  const [expandedFeedback, setExpandedFeedback] = useState(true);

  const getSeverityColor = (severity: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (severity) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const renderActionIcon = (icon: string) => {
    switch (icon) {
      case 'target':
        return <Target size={20} color={colors.primary.main} />;
      case 'activity':
        return <Activity size={20} color={colors.status.success} />;
      case 'calendar':
        return <Calendar size={20} color={colors.status.warning} />;
      case 'trending-up':
        return <TrendingUp size={20} color={colors.primary.main} />;
      case 'award':
        return <Target size={20} color={colors.status.success} />;
      default:
        return <Target size={20} color={colors.primary.main} />;
    }
  };

  return (
    <>
      <Text style={styles.sectionTitle}>AIコーチからのアドバイス</Text>
      <Card style={styles.feedbackCard}>
        <TouchableOpacity
          style={styles.feedbackHeader}
          onPress={() => setExpandedFeedback(!expandedFeedback)}
        >
          <Text style={styles.feedbackTitle}>{currentAIData.period}の改善提案</Text>
          {expandedFeedback ? (
            <ChevronUp size={20} color={colors.text.secondary} />
          ) : (
            <ChevronDown size={20} color={colors.text.secondary} />
          )}
        </TouchableOpacity>

        {expandedFeedback && (
          <View style={styles.feedbackList}>
            {currentAIData.feedback.map((feedback, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Badge
                  variant={getSeverityColor(feedback.severity)}
                  size="small"
                  style={styles.feedbackBadge}
                >
                  {feedback.type === 'nutrition' ? '栄養' : feedback.type === 'training' ? 'トレ' : '総合'}
                </Badge>
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackMessage}>{feedback.message}</Text>
                  {feedback.action && (
                    <TouchableOpacity style={styles.feedbackAction}>
                      <Text style={styles.feedbackActionText}>{feedback.action}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Text style={styles.sectionTitle}>{currentAIData.period}のおすすめアクション</Text>
      <Card style={styles.actionCard}>
        <View style={styles.actionList}>
          {currentAIData.actions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionItem}>
              <View style={styles.actionIcon}>
                {renderActionIcon(action.icon)}
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionText}>{action.title}</Text>
                <Text style={styles.actionSubtext}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  feedbackCard: {
    marginBottom: spacing.md,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  feedbackList: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  feedbackItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  feedbackBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  feedbackAction: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  feedbackActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  actionCard: {
    marginBottom: spacing.md,
  },
  actionList: {
    gap: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  actionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
});