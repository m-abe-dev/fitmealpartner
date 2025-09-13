import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Brain, RefreshCw, ChevronDown, ChevronUp, Dumbbell, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { PeriodAIData } from '../types/dashboard.types';
import { useAIFeedback } from '../../../hooks/useAIFeedback';
import { useFoodLog } from '../../../hooks/useFoodLog';
import { useProfileData } from '../../../hooks/useProfileData';
import { useNutritionData } from '../../../hooks/useNutritionData';
import { useWorkoutData } from '../../../hooks/useWorkoutData';
import { AIFeedbackService } from '../../../services/AIFeedbackService';
import DatabaseService from '../../../services/database/DatabaseService';
import * as Localization from 'expo-localization';

interface AICoachSectionProps {
  currentAIData: PeriodAIData;
}

export const AICoachSection: React.FC<AICoachSectionProps> = () => {
  const [expandedNutrition, setExpandedNutrition] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState(true);
  const [workoutSuggestion, setWorkoutSuggestion] = useState<any>(null);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [progressStats, setProgressStats] = useState<{
    weeklyVolume: number;
    volumeChange: number;
    improvements: string[];
    plateaus: string[];
  } | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // 初期言語を取得（privateメソッドにアクセスできないので、デフォルトを使用）
    return 'ja';
  });

  // AI栄養フィードバック用のフック
  const { nutritionFeedback, isLoading: isLoadingNutrition, refreshNutritionFeedback } = useAIFeedback();
  const { foodLog } = useFoodLog();
  const { nutritionTargets, userProfile } = useProfileData();
  const { nutritionData } = useNutritionData(foodLog, nutritionTargets);

  // ワークアウトデータ
  const { workoutHistory } = useWorkoutData();

  // 言語検出ヘルパー関数
  const getDeviceLanguage = (): string => {
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const locale = locales[0];
        const languageTag = locale.languageTag || '';
        const languageCode = locale.languageCode || '';
        
        const supportedLanguages = {
          'ja': ['ja'],
          'en': ['en'],
          'es': ['es'],
          'fr': ['fr']
        };
        
        // languageTagから判定
        for (const [lang, prefixes] of Object.entries(supportedLanguages)) {
          if (prefixes.some(prefix => languageTag.startsWith(prefix))) {
            return lang;
          }
        }
        
        // languageCodeから判定（フォールバック）
        for (const [lang, codes] of Object.entries(supportedLanguages)) {
          if (codes.includes(languageCode)) {
            return lang;
          }
        }
      }
    } catch (error) {
      console.error('Error getting device language:', error);
    }
    return 'en'; // デフォルトは英語
  };

  useEffect(() => {
    // 初回読み込み時にAI分析を実行
    if (foodLog.length > 0) {
      fetchAIFeedback();
    }
    if (workoutHistory && workoutHistory.length > 0) {
      fetchWorkoutSuggestion();
    }
  }, [foodLog.length, workoutHistory?.length]);

  // 言語変更監視
  useEffect(() => {
    const checkLanguageChange = () => {
      const detectedLanguage = getDeviceLanguage();
      if (currentLanguage !== detectedLanguage) {
        setCurrentLanguage(detectedLanguage);
        
        // 言語変更時のキャッシュ処理を強化
        AIFeedbackService.clearCache().then(() => {
          // 新しい言語で再フェッチ
          if (foodLog.length > 0) {
            fetchAIFeedback();
          }
          if (workoutHistory && workoutHistory.length > 0) {
            fetchWorkoutSuggestion();
          }
        });
      }
    };

    // 初回言語設定
    const initialLanguage = getDeviceLanguage();
    if (currentLanguage !== initialLanguage) {
      setCurrentLanguage(initialLanguage);
    }

    // 5秒ごとに言語変更をチェック
    const languageCheckInterval = setInterval(checkLanguageChange, 5000);

    return () => clearInterval(languageCheckInterval);
  }, [currentLanguage, workoutHistory?.length, foodLog.length]);

  // 昨日の栄養データを取得する関数
  const  getYesterdayNutritionData = async () => {
    try {
      // DatabaseServiceが初期化されているか確認
      if (!DatabaseService.isReady()) {
        await DatabaseService.initialize();
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateString = yesterday.toISOString().split('T')[0];

      // データベースから昨日のデータを直接取得
      const yesterdayData = await DatabaseService.getFirstAsync(
        `SELECT
          SUM(protein_g) as protein,
          SUM(kcal) as calories,
          SUM(carb_g) as carbs,
          SUM(fat_g) as fat
         FROM food_log
         WHERE date = ?`,
        [yesterdayDateString]
      ) as {
        protein: number | null;
        calories: number | null;
        carbs: number | null;
        fat: number | null;
      } | null;

      if (!yesterdayData || yesterdayData.calories === null) return null;

      return {
        protein: yesterdayData.protein || 0,
        calories: yesterdayData.calories || 0,
        carbs: yesterdayData.carbs || 0,
        fat: yesterdayData.fat || 0,
        targetProtein: nutritionTargets.protein,
        targetCalories: nutritionTargets.calories,
        achievement: Math.round(((yesterdayData.protein || 0) / nutritionTargets.protein) * 100),
        gap: Math.max(0, nutritionTargets.protein - (yesterdayData.protein || 0))
      };
    } catch (error) {
      console.error('Error getting yesterday data:', error);
      return null;
    }
  };;

  const fetchAIFeedback = async () => {
    // 昨日のデータを取得
    const yesterdayData = await getYesterdayNutritionData();

    // 食事タイプ別に集計
    const mealsByType = {
      breakfast: foodLog.filter(item => item.meal === 'breakfast'),
      lunch: foodLog.filter(item => item.meal === 'lunch'),
      dinner: foodLog.filter(item => item.meal === 'dinner'),
      snack: foodLog.filter(item => item.meal === 'snack')
    };

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
        fat: item.fat,
        mealType: item.meal // 食事タイプを追加
      })),
      mealsByType: {
        hasBreakfast: mealsByType.breakfast.length > 0,
        hasLunch: mealsByType.lunch.length > 0,
        hasDinner: mealsByType.dinner.length > 0,
        hasSnack: mealsByType.snack.length > 0,
        breakfastProtein: mealsByType.breakfast.reduce((sum, m) => sum + (m.protein || 0), 0),
        lunchProtein: mealsByType.lunch.reduce((sum, m) => sum + (m.protein || 0), 0),
        dinnerProtein: mealsByType.dinner.reduce((sum, m) => sum + (m.protein || 0), 0),
        snackProtein: mealsByType.snack.reduce((sum, m) => sum + (m.protein || 0), 0),
        breakfastCalories: mealsByType.breakfast.reduce((sum, m) => sum + (m.calories || 0), 0),
        lunchCalories: mealsByType.lunch.reduce((sum, m) => sum + (m.calories || 0), 0),
        dinnerCalories: mealsByType.dinner.reduce((sum, m) => sum + (m.calories || 0), 0),
        snackCalories: mealsByType.snack.reduce((sum, m) => sum + (m.calories || 0), 0)
      }
    };

    const aiProfile = {
      weight: userProfile?.weight || 70,
      age: userProfile?.age || 25,
      goal: userProfile?.goal || 'maintain',
      gender: userProfile?.gender || 'male',
      height: userProfile?.height || 175,
      activityLevel: 'moderate' as const
    };

    // 追加コンテキストの準備
    const additionalContext = {
      mealCount: foodLog.length,
      yesterdayData,
      mealTypeData: aiNutritionData.mealsByType
    };

    try {
      // refreshNutritionFeedbackにadditionalContextを渡す
      const response = await refreshNutritionFeedback(
        aiNutritionData,
        aiProfile,
        additionalContext
      );
      
      // responseが返ってきた場合は、既に状態が更新されているはず
    } catch (error) {
      console.error('Error fetching AI feedback:', error);
    }
  };

  const fetchWorkoutSuggestion = async () => {
    setIsLoadingWorkout(true);
    try {
      // 日本語→英語の筋群マッピング
      const muscleMapping: { [key: string]: string } = {
        '胸': 'chest',
        '背中': 'back',
        '肩': 'shoulders',
        '腕': 'arms',
        '脚': 'legs',
        '体幹': 'core',
        'コア': 'core',
        '腹筋': 'core',
        '有酸素': 'cardio', // 除外対象
      };

      // ボリューム計算用のヘルパー関数
      const calculateTotalVolume = (exercises: any[]) => {
        return exercises.reduce((total, ex) => {
          return total + ((ex.weight || 0) * (ex.sets || 1) * (ex.reps || 1));
        }, 0);
      };

      // 最近7日間のワークアウトデータを準備
      const recentWorkouts = (workoutHistory || []).slice(0, 7).map(workout => {
        const mappedExercises = (workout.exercises || [])
          .map(ex => {
            const japaneseMuscle = ex.targetMuscles?.[0] || '';
            const englishMuscle = japaneseMuscle ? muscleMapping[japaneseMuscle] : undefined;


            // 有酸素は除外、マッピングできない場合はgeneralに
            if (englishMuscle === 'cardio') {
              return null;
            }

            return {
              name: ex.name,
              sets: ex.sets?.length || 3,
              reps: ex.sets?.[0]?.reps || 10,
              weight: ex.sets?.[0]?.weight || 0,
              muscleGroup: englishMuscle || 'general' // 英語の筋群名を使用
            };
          })
          .filter(ex => ex !== null); // null（有酸素など）を除外

        const mapped = {
          exercises: mappedExercises,
          duration: workout.duration || 45,
          type: 'strength' as const,
          totalVolume: calculateTotalVolume(mappedExercises), // 正確なボリューム計算
          date: workout.date
        };

        return mapped;
      });

      // 週間ボリューム変化を計算
      const currentWeekVolume = recentWorkouts.slice(0, 7).reduce((sum, w) => sum + w.totalVolume, 0);
      const previousWeekVolume = recentWorkouts.slice(7, 14).reduce((sum, w) => sum + w.totalVolume, 0);
      const volumeChangePercent = previousWeekVolume > 0
        ? Math.round((currentWeekVolume - previousWeekVolume) / previousWeekVolume * 100)
        : 0;


      // 簡単な進捗分析（フロントエンド側）
      const improvements: string[] = [];
      const plateaus: string[] = [];

      // 種目別の進捗をチェック（簡易版）
      if (recentWorkouts.length >= 2) {
        const exerciseHistory: { [key: string]: any[] } = {};

        recentWorkouts.slice(0, 3).forEach(workout => {
          workout.exercises.forEach(ex => {
            if (!exerciseHistory[ex.name]) {
              exerciseHistory[ex.name] = [];
            }
            exerciseHistory[ex.name].push({
              weight: ex.weight,
              reps: ex.reps,
              sets: ex.sets,
              date: workout.date
            });
          });
        });

        Object.entries(exerciseHistory).forEach(([exerciseName, history]) => {
          if (history.length >= 2) {
            const latest = history[0];
            const previous = history[1];

            if (latest.weight > previous.weight) {
              improvements.push(`${exerciseName}: ${previous.weight}kg → ${latest.weight}kg`);
            }

            if (history.length >= 3 &&
                latest.weight === previous.weight &&
                latest.weight === history[2].weight) {
              plateaus.push(`${exerciseName}: 停滞中`);
            }
          }
        });
      }

      // 進捗統計を保存
      setProgressStats({
        weeklyVolume: currentWeekVolume,
        volumeChange: volumeChangePercent,
        improvements: improvements.slice(0, 3),
        plateaus: plateaus.slice(0, 2)
      });


      const response = await AIFeedbackService.getWorkoutSuggestion(
        recentWorkouts,
        {
          age: userProfile?.age || 25,
          weight: userProfile?.weight || 70,
          height: userProfile?.height || 175,
          goal: userProfile?.goal || 'maintain',
          activityLevel: 'moderate',
          gender: userProfile?.gender || 'male',
          experience: userProfile?.experience || 'beginner'
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
                  onPress={async () => {
                    await AIFeedbackService.clearCache();
                    await fetchAIFeedback();
                  }}
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
            {/* 進捗統計セクション */}
            {progressStats && (
              <View style={styles.progressSection}>
                <Text style={styles.subTitle}>進捗状況</Text>

                {/* 週間ボリューム */}
                <View style={styles.volumeStats}>
                  <View style={styles.volumeItem}>
                    <Text style={styles.volumeLabel}>週間総ボリューム</Text>
                    <Text style={styles.volumeValue}>{Math.round(progressStats.weeklyVolume).toLocaleString()}kg</Text>
                  </View>
                  {progressStats.volumeChange !== 0 && (
                    <View style={[
                      styles.volumeChange,
                      { backgroundColor: progressStats.volumeChange > 0 ? colors.status.success + '20' : colors.status.error + '20' }
                    ]}>
                      <TrendingUp
                        size={14}
                        color={progressStats.volumeChange > 0 ? colors.status.success : colors.status.error}
                        style={{ transform: [{ rotate: progressStats.volumeChange > 0 ? '0deg' : '180deg' }] }}
                      />
                      <Text style={[
                        styles.volumeChangeText,
                        { color: progressStats.volumeChange > 0 ? colors.status.success : colors.status.error }
                      ]}>
                        {progressStats.volumeChange > 0 ? '+' : ''}{progressStats.volumeChange}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* 進捗向上 */}
                {progressStats.improvements.length > 0 && (
                  <View style={styles.improvementsList}>
                    <Text style={styles.improvementTitle}>重量向上 🔥</Text>
                    {progressStats.improvements.map((improvement, index) => (
                      <View key={index} style={styles.improvementItem}>
                        <View style={[styles.bulletPoint, { backgroundColor: colors.status.success }]} />
                        <Text style={styles.improvementText}>{improvement}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 停滞警告 */}
                {progressStats.plateaus.length > 0 && (
                  <View style={styles.plateauWarnings}>
                    <View style={styles.plateauHeader}>
                      <AlertTriangle size={16} color={colors.status.warning} />
                      <Text style={styles.plateauTitle}>停滞注意</Text>
                    </View>
                    {progressStats.plateaus.map((plateau, index) => (
                      <View key={index} style={styles.plateauItem}>
                        <Text style={styles.plateauText}>{plateau}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

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
  // 新しい進捗表示スタイル
  progressSection: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  volumeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  volumeItem: {
    flex: 1,
  },
  volumeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  volumeValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  volumeChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  volumeChangeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  improvementsList: {
    marginBottom: spacing.md,
  },
  improvementTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.status.success,
    marginBottom: spacing.xs,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  improvementText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  plateauWarnings: {
    backgroundColor: colors.status.warning + '10',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  plateauHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  plateauTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.status.warning,
  },
  plateauItem: {
    marginBottom: spacing.xs,
  },
  plateauText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginLeft: spacing.lg,
  },
});