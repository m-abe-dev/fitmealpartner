import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Activity, Calendar, Target, TrendingUp, ChevronDown, ChevronUp, Brain, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { PeriodAIData } from '../types/dashboard.types';
import { useAIFeedback } from '../../../hooks/useAIFeedback';
import { useFoodLog } from '../../../hooks/useFoodLog';
import { useProfileData } from '../../../hooks/useProfileData';
import { useNutritionData } from '../../../hooks/useNutritionData';

interface AICoachSectionProps {
  currentAIData: PeriodAIData;
}

export const AICoachSection: React.FC<AICoachSectionProps> = ({ currentAIData }) => {
  const [expandedFeedback, setExpandedFeedback] = useState(true);
  const [expandedNutrition, setExpandedNutrition] = useState(true);
  
  // AI栄養フィードバック用のフック
  const { nutritionFeedback, isLoading, refreshNutritionFeedback } = useAIFeedback();
  const { foodLog } = useFoodLog();
  const { nutritionTargets, userProfile } = useProfileData();
  const { nutritionData } = useNutritionData(foodLog, nutritionTargets);

  useEffect(() => {
    // 初回読み込み時にAI分析を実行
    if (foodLog.length > 0) {
      fetchAIFeedback();
    }
  }, [foodLog.length]);

  const fetchAIFeedback = async () => {
    const aiNutritionData = {
      calories: nutritionData.calories.current,
      protein: nutritionData.protein.current,
      carbs: nutritionData.carbs.current,
      fat: nutritionData.fat.current,
      targetCalories: nutritionTargets.calories,
      targetProtein: nutritionTargets.protein,
      targetCarbs: nutritionTargets.carbs,
      targetFat: nutritionTargets.fat,
      meals: foodLog.map((item, index) => ({
        id: `meal-${index}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        time: new Date().toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }))
    };

    const aiUserProfile = {
      weight: userProfile?.weight || 70,
      age: userProfile?.age || 25,
      goal: userProfile?.goal || 'maintain',
      gender: userProfile?.gender || 'male',
      height: userProfile?.height || 175,
      activityLevel: 'moderate' as const
    };

    await refreshNutritionFeedback(aiNutritionData, aiUserProfile);
  };

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
      case 'brain':
        return <Brain size={20} color={colors.primary.main} />;
      default:
        return <Target size={20} color={colors.primary.main} />;
    }
  };

  return (
    <>
      {/* AI栄養分析カード */}
      {nutritionFeedback && (
        <>
          <Text style={styles.sectionTitle}>AI栄養コーチ</Text>
          <Card style={styles.feedbackCard}>
            <TouchableOpacity
              style={styles.feedbackHeader}
              onPress={() => setExpandedNutrition(!expandedNutrition)}
            >
              <View style={styles.headerLeft}>
                <Brain size={18} color={colors.primary.main} />
                <Text style={styles.feedbackTitle}>リアルタイム栄養分析</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  onPress={fetchAIFeedback}
                  disabled={isLoading}
                  style={styles.refreshButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary.main} />
                  ) : (
                    <RefreshCw size={16} color={colors.primary.main} />
                  )}
                </TouchableOpacity>
                {expandedNutrition ? (
                  <ChevronUp size={20} color={colors.text.secondary} />
                ) : (
                  <ChevronDown size={20} color={colors.text.secondary} />
                )}
              </View>
            </TouchableOpacity>

            {expandedNutrition && (
              <View style={styles.aiContent}>
                {/* メインフィードバック */}
                <View style={styles.mainFeedback}>
                  <Text style={styles.feedbackMessage}>{nutritionFeedback.feedback}</Text>
                </View>

                {/* 提案リスト */}
                {nutritionFeedback.suggestions.length > 0 && (
                  <View style={styles.suggestionsList}>
                    {nutritionFeedback.suggestions.map((suggestion, index) => (
                      <View key={index} style={styles.suggestionItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 優先アクション */}
                {nutritionFeedback.actionItems.length > 0 && (
                  <View style={styles.priorityActions}>
                    {nutritionFeedback.actionItems.map((item, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.priorityItem,
                          { borderLeftColor: item.priority === 'high' 
                            ? colors.status.error 
                            : item.priority === 'medium' 
                            ? colors.status.warning 
                            : colors.status.success }
                        ]}
                      >
                        <Text style={styles.priorityTitle}>{item.action}</Text>
                        <Text style={styles.priorityReason}>{item.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Card>
        </>
      )}

      {/* 既存のAIコーチセクション */}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  aiContent: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  mainFeedback: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  suggestionsList: {
    marginBottom: spacing.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.main,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  priorityActions: {
    gap: spacing.sm,
  },
  priorityItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 3,
    marginBottom: spacing.xs,
  },
  priorityTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  priorityReason: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
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