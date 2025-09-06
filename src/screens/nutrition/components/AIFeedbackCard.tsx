import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Brain, RefreshCw, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { useAIFeedback } from '../../../hooks/useAIFeedback';
import { NutritionData, AIUserProfile } from '../../../types/ai.types';

interface AIFeedbackCardProps {
  nutritionData: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    meals: Array<{
      id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      time: string;
    }>;
  };
  userProfile: {
    weight: number;
    age: number;
    goal: 'cut' | 'bulk' | 'maintain';
    gender: 'male' | 'female' | 'other';
  };
}

export const AIFeedbackCard: React.FC<AIFeedbackCardProps> = ({
  nutritionData,
  userProfile
}) => {
  const { 
    getNutritionFeedback, 
    nutritionFeedback, 
    isLoading, 
    refreshNutritionFeedback 
  } = useAIFeedback();

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // 初回読み込み時とデータ変更時にAI分析を実行
  useEffect(() => {
    if (autoRefreshEnabled) {
      fetchNutritionFeedback();
    }
  }, [nutritionData.calories, nutritionData.protein, autoRefreshEnabled]);

  const fetchNutritionFeedback = async () => {
    const aiNutritionData: NutritionData = {
      ...nutritionData,
      meals: nutritionData.meals.map(meal => ({
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      }))
    };

    const aiProfile: AIUserProfile = {
      ...userProfile,
      height: 175, // デフォルト値、実際はプロフィールから取得
      activityLevel: 'moderate'
    };

    await refreshNutritionFeedback(aiNutritionData, aiProfile);
  };

  const handleRefresh = () => {
    fetchNutritionFeedback();
  };

  const handleActionPress = (action: string) => {
    console.log('Action pressed:', action);
    // ここで具体的なアクション（食事追加など）を実装
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertCircle size={16} color={colors.status.error} />;
      case 'medium':
        return <TrendingUp size={16} color={colors.status.warning} />;
      case 'low':
        return <CheckCircle2 size={16} color={colors.status.success} />;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return colors.status.error;
      case 'medium': return colors.status.warning;
      case 'low': return colors.status.success;
    }
  };

  return (
    <Card style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Brain size={20} color={colors.primary.main} />
          </View>
          <View>
            <Text style={styles.title}>AI栄養コーチ</Text>
            <Text style={styles.subtitle}>
              リアルタイム分析 • {new Date().toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.refreshButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <RefreshCw size={18} color={colors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      {/* コンテンツ */}
      {isLoading && !nutritionFeedback ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>栄養バランスを分析中...</Text>
        </View>
      ) : nutritionFeedback ? (
        <View style={styles.content}>
          {/* メインフィードバック */}
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{nutritionFeedback.feedback}</Text>
          </View>

          {/* 提案 */}
          {nutritionFeedback.suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 今すぐ実行できる提案</Text>
              {nutritionFeedback.suggestions.slice(0, 3).map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={styles.suggestionBullet} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* アクションアイテム */}
          {nutritionFeedback.actionItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ 優先アクション</Text>
              {nutritionFeedback.actionItems.slice(0, 2).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionItem,
                    { borderLeftColor: getPriorityColor(item.priority) }
                  ]}
                  onPress={() => handleActionPress(item.action)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionHeader}>
                    {getPriorityIcon(item.priority)}
                    <Text style={[
                      styles.actionTitle,
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
          {nutritionFeedback.error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.status.error} />
              <Text style={styles.errorText}>{nutritionFeedback.error}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>栄養データがありません</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
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
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  refreshButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primary.main + '10',
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  content: {
    gap: spacing.md,
  },
  feedbackContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.md,
  },
  feedbackText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.base * 1.5,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.main,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  actionItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
    flex: 1,
  },
  actionReason: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.error + '10',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.error,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
});