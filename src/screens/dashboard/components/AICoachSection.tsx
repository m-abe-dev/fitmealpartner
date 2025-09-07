import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Brain, RefreshCw, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { PeriodAIData } from '../types/dashboard.types';
import { useAIFeedback } from '../../../hooks/useAIFeedback';
import { useFoodLog } from '../../../hooks/useFoodLog';
import { useProfileData } from '../../../hooks/useProfileData';
import { useNutritionData } from '../../../hooks/useNutritionData';
import { useWorkoutData } from '../../../hooks/useWorkoutData';
import { AIFeedbackService } from '../../../services/AIFeedbackService';

interface AICoachSectionProps {
  currentAIData: PeriodAIData;
}

export const AICoachSection: React.FC<AICoachSectionProps> = () => {
  const [expandedNutrition, setExpandedNutrition] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState(true);
  const [workoutSuggestion, setWorkoutSuggestion] = useState<any>(null);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  
  // AI栄養フィードバック用のフック
  const { nutritionFeedback, isLoading: isLoadingNutrition, refreshNutritionFeedback } = useAIFeedback();
  const { foodLog } = useFoodLog();
  const { nutritionTargets, userProfile } = useProfileData();
  const { nutritionData } = useNutritionData(foodLog, nutritionTargets);
  
  // ワークアウトデータ
  const { workoutHistory } = useWorkoutData();

  useEffect(() => {
    // 初回読み込み時にAI分析を実行
    if (foodLog.length > 0) {
      fetchAIFeedback();
    }
    if (workoutHistory && workoutHistory.length > 0) {
      fetchWorkoutSuggestion();
    }
  }, [foodLog.length, workoutHistory?.length]);

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
      meals: foodLog.map(item => ({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }))
    };

    await refreshNutritionFeedback(aiNutritionData, {
      weight: userProfile?.weight || 70,
      age: userProfile?.age || 25,
      goal: userProfile?.goal || 'maintain',
      gender: userProfile?.gender || 'male',
      height: userProfile?.height || 175,
      activityLevel: 'moderate' as const
    });
  };

  const fetchWorkoutSuggestion = async () => {
    setIsLoadingWorkout(true);
    try {
      // 最近7日間のワークアウトデータを準備
      const recentWorkouts = (workoutHistory || []).slice(0, 7).map(workout => ({
        exercises: workout.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets?.length || 3,
          reps: ex.sets?.[0]?.reps || 10,
          weight: ex.sets?.[0]?.weight,
          muscleGroup: ex.targetMuscles?.[0] || 'general'
        })),
        duration: workout.duration || 45,
        type: 'strength' as const,
        totalVolume: workout.totalVolume || 0,
        date: workout.date
      }));

      const response = await AIFeedbackService.getWorkoutSuggestion(
        recentWorkouts,
        {
          age: userProfile?.age || 25,
          weight: userProfile?.weight || 70,
          height: userProfile?.height || 175,
          goal: userProfile?.goal || 'maintain',
          activityLevel: 'moderate',
          gender: userProfile?.gender || 'male'
        }
      );

      setWorkoutSuggestion(response);
    } catch (error) {
      console.error('Error fetching workout suggestion:', error);
    } finally {
      setIsLoadingWorkout(false);
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
                <Text style={styles.feedbackTitle}>栄養分析</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  onPress={fetchAIFeedback}
                  disabled={isLoadingNutrition}
                  style={styles.refreshButton}
                >
                  {isLoadingNutrition ? (
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

      {/* AIワークアウトコーチ */}
      <Text style={styles.sectionTitle}>AIトレーニングコーチ</Text>
      <Card style={styles.feedbackCard}>
        <TouchableOpacity
          style={styles.feedbackHeader}
          onPress={() => setExpandedWorkout(!expandedWorkout)}
        >
          <View style={styles.headerLeft}>
            <Dumbbell size={18} color={colors.primary.main} />
            <Text style={styles.feedbackTitle}>次回ワークアウト提案</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={fetchWorkoutSuggestion}
              disabled={isLoadingWorkout}
              style={styles.refreshButton}
            >
              {isLoadingWorkout ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : (
                <RefreshCw size={16} color={colors.primary.main} />
              )}
            </TouchableOpacity>
            {expandedWorkout ? (
              <ChevronUp size={20} color={colors.text.secondary} />
            ) : (
              <ChevronDown size={20} color={colors.text.secondary} />
            )}
          </View>
        </TouchableOpacity>

        {expandedWorkout && workoutSuggestion && (
          <View style={styles.aiContent}>
            <View style={styles.mainFeedback}>
              <Text style={styles.feedbackMessage}>{workoutSuggestion.feedback}</Text>
            </View>

            {workoutSuggestion.nextWorkout && (
              <>
                {/* ターゲット筋群 */}
                <View style={styles.targetSection}>
                  <Text style={styles.subTitle}>ターゲット筋群</Text>
                  <View style={styles.muscleChips}>
                    {workoutSuggestion.nextWorkout.targetMuscleGroups.map((muscle: string, index: number) => (
                      <View key={index} style={styles.muscleChip}>
                        <Text style={styles.muscleChipText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 推奨エクササイズ */}
                <View style={styles.exercisesList}>
                  <Text style={styles.subTitle}>推奨エクササイズ</Text>
                  {workoutSuggestion.nextWorkout.recommendedExercises.map((exercise: any, index: number) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets}セット × {exercise.reps}
                      </Text>
                      {exercise.notes && (
                        <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* 推定時間 */}
                <View style={styles.durationInfo}>
                  <Text style={styles.durationText}>
                    推定時間: {workoutSuggestion.nextWorkout.estimatedDuration}分
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {expandedWorkout && !workoutSuggestion && !isLoadingWorkout && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              ワークアウト履歴を記録すると、AIが最適なプランを提案します
            </Text>
          </View>
        )}
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
  feedbackMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: 20,
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
  targetSection: {
    marginBottom: spacing.md,
  },
  subTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muscleChip: {
    backgroundColor: colors.primary.light + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  muscleChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  exercisesList: {
    marginBottom: spacing.md,
  },
  exerciseItem: {
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  exerciseDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    marginTop: 2,
  },
  exerciseNotes: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  durationInfo: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});