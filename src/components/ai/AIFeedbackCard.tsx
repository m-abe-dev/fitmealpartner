import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Brain, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { Card } from '../common/Card';
import { FeedbackResponse } from '../../types/ai.types';

interface AIFeedbackCardProps {
  feedback: FeedbackResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  onActionPress?: (action: string) => void;
}

export const AIFeedbackCard: React.FC<AIFeedbackCardProps> = ({
  feedback,
  isLoading = false,
  onRefresh,
  onActionPress
}) => {
  const getIconForPriority = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={16} color={colors.status.error} />;
      case 'medium':
        return <Clock size={16} color={colors.status.warning} />;
      case 'low':
        return <CheckCircle size={16} color={colors.status.success} />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return colors.status.error;
      case 'medium':
        return colors.status.warning;
      case 'low':
        return colors.status.success;
    }
  };

  if (isLoading) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Brain size={20} color={colors.primary.main} />
          <Text style={styles.title}>AI分析中...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>栄養バランスを分析しています</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={20} color={colors.primary.main} />
          <Text style={styles.title}>AIフィードバック</Text>
          {!feedback.success && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>オフライン</Text>
            </View>
          )}
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>更新</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* メインフィードバック */}
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>{feedback.feedback}</Text>
      </View>

      {/* 提案リスト */}
      {feedback.suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 提案</Text>
          {feedback.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>• {suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* アクションアイテム */}
      {feedback.actionItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ 今すぐできること</Text>
          {feedback.actionItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionItem,
                { borderLeftColor: getPriorityColor(item.priority) }
              ]}
              onPress={() => onActionPress?.(item.action)}
            >
              <View style={styles.actionHeader}>
                {getIconForPriority(item.priority)}
                <Text style={[
                  styles.actionText,
                  { color: getPriorityColor(item.priority) }
                ]}>
                  {item.action}
                </Text>
              </View>
              <Text style={styles.actionReason}>{item.reason}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* エラー表示 */}
      {feedback.error && (
        <View style={styles.errorContainer}>
          <AlertTriangle size={14} color={colors.status.error} />
          <Text style={styles.errorText}>{feedback.error}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  offlineBadge: {
    backgroundColor: colors.status.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  offlineBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.warning,
    fontFamily: typography.fontFamily.medium,
  },
  refreshButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  refreshButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  feedbackContainer: {
    marginBottom: spacing.md,
  },
  feedbackText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.base * 1.5,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  suggestionItem: {
    marginBottom: spacing.xs,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  actionItem: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
    flex: 1,
  },
  actionReason: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    marginLeft: spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.error + '10',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.error,
    fontFamily: typography.fontFamily.regular,
    marginLeft: spacing.xs,
  },
});