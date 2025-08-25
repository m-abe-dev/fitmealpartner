import React from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, TrendingUp } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { TabBar } from '../../components/common/TabBar';

// Dashboard Components
import { DashboardHeader } from './components/DashboardHeader';
import { ScoreCard } from './components/ScoreCard';
import { AICoachSection } from './components/AICoachSection';
import { AnalyticsChart } from './components/AnalyticsChart';
import { StatsCards } from './components/StatsCards';

// Hooks
import { useDashboardScreen } from '../../hooks/useDashboardScreen';

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

  const tabs = [
    { id: 'coach', label: 'AIコーチ', icon: <Activity size={16} color={colors.text.secondary} /> },
    { id: 'analytics', label: 'アナリティクス', icon: <TrendingUp size={16} color={colors.text.secondary} /> }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <DashboardHeader />

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
            <AICoachSection currentAIData={getCurrentAIData()} />
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