import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, TrendingUp } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { TabBar } from '../../components/common/TabBar';

// Dashboard Components
import { DashboardHeader } from './components/DashboardHeader';
import { ScoreCard } from './components/ScoreCard';
import { AICoachSection } from './components/AICoachSection';
import { AnalyticsChart } from './components/AnalyticsChart';
import { StatsCards } from './components/StatsCards';

// Hooks and Services
import { useDashboardScreen } from '../../hooks/useDashboardScreen';
import { useAIFeedback } from '../../hooks/useAIFeedback';
import { useOnboardingData } from '../../hooks/useOnboardingData';
import { useProfileData } from '../../hooks/useProfileData';
import { useFoodLog } from '../../hooks/useFoodLog';
import { useNutritionData } from '../../hooks/useNutritionData';
import { PeriodAIData, AIFeedback, AIAction } from './types/dashboard.types';

export const DashboardScreen: React.FC = () => {
  const {
    refreshing,
    activeTab,
    currentWorkoutPeriod,
    currentNutritionPeriod,
    currentScoreTab,
    scoreData,
    periodData,
    setActiveTab,
    setCurrentWorkoutPeriod,
    setCurrentNutritionPeriod,
    setCurrentScoreTab,
    onRefresh,
    getCurrentAIData,
    getCurrentWorkoutPeriodData,
    getCurrentNutritionPeriodData,
  } = useDashboardScreen();

  // AIフィードバック用のデータを取得
  const { nutritionTargets } = useProfileData();
  const { calculatedProfile } = useOnboardingData();
  const { foodLog } = useFoodLog();
  const { nutritionData } = useNutritionData(foodLog, nutritionTargets);
  const { getNutritionFeedback, nutritionFeedback, isLoading: isAILoading } = useAIFeedback();

  // AI用のプロフィールデータを準備
  const aiUserProfile = calculatedProfile ? {
    weight: calculatedProfile.weight,
    age: calculatedProfile.age,
    goal: calculatedProfile.goal,
    gender: calculatedProfile.gender,
    height: calculatedProfile.height,
    activityLevel: 'moderate',
  } : {
    weight: 70,
    age: 25,
    goal: 'maintain' as const,
    gender: 'male' as const,
    height: 175,
    activityLevel: 'moderate',
  };

  // AI用の栄養データを準備
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
      }),
    })),
  };

  // AIデータを取得するEffect
  useEffect(() => {
    if (foodLog.length > 0) {
      fetchNutritionFeedback();
    }
  }, [foodLog.length, nutritionData.calories.current]);

  const fetchNutritionFeedback = async () => {
    try {
      await getNutritionFeedback(aiNutritionData, aiUserProfile);
    } catch (error) {
      console.error('Failed to fetch AI feedback:', error);
    }
  };

  // AIフィードバックをダッシュボード形式に変換
  const getDashboardAIData = (): PeriodAIData => {
    if (!nutritionFeedback) {
      return getCurrentAIData(); // フォールバック: 既存のモックデータ
    }

    // AIフィードバックを既存のPeriodAIData形式に変換
    const feedback: AIFeedback[] = [];
    const actions: AIAction[] = [];

    // フィードバックメッセージを変換
    if (nutritionFeedback.feedback) {
      feedback.push({
        type: 'nutrition' as const,
        severity: 'info' as const,
        message: nutritionFeedback.feedback,
        action: nutritionFeedback.suggestions.length > 0 ? nutritionFeedback.suggestions[0] : undefined
      });
    }

    // アクションアイテムを変換
    nutritionFeedback.actionItems.forEach(item => {
      actions.push({
        title: item.action,
        subtitle: item.reason,
        icon: item.priority === 'high' ? 'target' : 'activity',
        action: item.action
      });
    });

    return {
      period: '今日',
      feedback,
      actions: actions.length > 0 ? actions : [{
        title: '順調に進んでいます',
        subtitle: '引き続き食事記録を続けましょう',
        icon: 'trending-up',
        action: 'continue'
      }]
    };
  };

  const tabs = [
    { id: 'coach', label: 'AIコーチ', icon: <Activity size={16} color={colors.text.secondary} /> },
    { id: 'analytics', label: 'アナリティクス', icon: <TrendingUp size={16} color={colors.text.secondary} /> }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="ダッシュボード"
        icon={<Activity size={24} color={colors.primary.main} />}
        notificationCount={2}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* スコアセクション */}
        <ScoreCard
          scoreData={scoreData}
          currentScoreTab={currentScoreTab}
          onScoreTabChange={setCurrentScoreTab}
        />

        {/* AIコーチセクション */}
        <View style={styles.sectionContainer}>
          <View style={styles.tabContainer}>
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabPress={setActiveTab}
              variant="pills"
              style={styles.tabBar}
            />
          </View>

          {activeTab === 'coach' && (
            <AICoachSection currentAIData={getDashboardAIData()} />
          )}

        {/* アナリティクスセクション */}
        {activeTab === 'analytics' && (
          <>
            <Text style={styles.sectionTitle}>データ分析</Text>

            {/* 筋トレボリュームセクション */}
            <AnalyticsChart
              title="筋トレボリューム × 体重変化"
              chartType="workout"
              periodData={periodData}
              currentPeriod={currentWorkoutPeriod}
              onPeriodChange={setCurrentWorkoutPeriod}
              getCurrentData={getCurrentWorkoutPeriodData}
            />

            {/* 筋トレボリューム統計カード */}
            <StatsCards
              type="workout"
              currentData={getCurrentWorkoutPeriodData()}
            />

            {/* セクション区切り */}
            <View style={styles.sectionSeparator} />

            {/* 摂取カロリーセクション */}
            <AnalyticsChart
              title="摂取カロリー × 体重変化"
              chartType="nutrition"
              periodData={periodData}
              currentPeriod={currentNutritionPeriod}
              onPeriodChange={setCurrentNutritionPeriod}
              getCurrentData={getCurrentNutritionPeriodData}
            />

            {/* 摂取カロリー統計カード */}
            <StatsCards
              type="nutrition"
              currentData={getCurrentNutritionPeriodData()}
            />
          </>
        )}
                </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  tabContainer: {
    // marginBottom: spacing.md,
  },
  tabBar: {
    marginBottom: spacing.md,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.lg,
    marginHorizontal: spacing.md,
  },
});