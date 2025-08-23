import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { PeriodData } from '../types/dashboard.types';

interface StatsCardsProps {
  type: 'workout' | 'nutrition';
  currentData: PeriodData;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ type, currentData }) => {
  if (type === 'workout') {
    return (
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.weightChange}</Text>
              <Text style={styles.statLabel}>体重変化</Text>
              <View style={[styles.statTrend, styles.statTrendSuccess]}>
                <Text style={styles.statTrendText}>{currentData.stats.weightTrend}</Text>
              </View>
            </View>
          </Card>
          <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.avgVolume}</Text>
              <Text style={styles.statLabel}>平均ボリューム</Text>
              <View style={[styles.statTrend, styles.statTrendPrimary]}>
                <Text style={styles.statTrendText}>{currentData.stats.volumeTrend}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.workoutCount}</Text>
              <Text style={styles.statLabel}>筋トレ回数</Text>
              <View style={[styles.statTrend, styles.statTrendWarning]}>
                <Text style={styles.statTrendText}>{currentData.stats.workoutTarget}</Text>
              </View>
            </View>
          </Card>
          <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.avgScore}</Text>
              <Text style={styles.statLabel}>平均スコア</Text>
              <View style={[styles.statTrend, styles.statTrendSuccess]}>
                <Text style={styles.statTrendText}>{currentData.stats.scoreTrend}</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>
    );
  } else {
    return (
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.avgCalories}</Text>
              <Text style={styles.statLabel}>平均カロリー</Text>
              <View style={[styles.statTrend, styles.statTrendSuccess]}>
                <Text style={styles.statTrendText}>{currentData.stats.caloriesTrend}</Text>
              </View>
            </View>
          </Card>

          <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.avgProtein}</Text>
              <Text style={styles.statLabel}>平均タンパク質</Text>
              <View style={[styles.statTrend, styles.statTrendPrimary]}>
                <Text style={styles.statTrendText}>{currentData.stats.proteinTrend}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.avgFoodCount}</Text>
              <Text style={styles.statLabel}>平均食品数</Text>
              <View style={[styles.statTrend, styles.statTrendWarning]}>
                <Text style={styles.statTrendText}>{currentData.stats.foodTrend}</Text>
              </View>
            </View>
          </Card>

          <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
            <View style={styles.statCardContent}>
              <Text style={styles.statValue}>{currentData.stats.avgScore}</Text>
              <Text style={styles.statLabel}>栄養スコア</Text>
              <View style={[styles.statTrend, styles.statTrendSuccess]}>
                <Text style={styles.statTrendText}>{currentData.stats.scoreTrend}</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 2,
  },
  statCard: {
    flex: 1,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  statCardWorkout: {
    backgroundColor: '#f0f9ff', // 薄い青色
    borderLeftWidth: 2,
    borderLeftColor: colors.primary.main,
  },
  statCardNutrition: {
    backgroundColor: '#f0fdf4', // 薄い緑色
    borderLeftWidth: 2,
    borderLeftColor: colors.status.success,
  },
  statCardContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 12,
  },
  statTrend: {
    paddingHorizontal: spacing.xxs,
    paddingVertical: 1,
    borderRadius: radius.sm,
    minWidth: 30,
    alignItems: 'center',
  },
  statTrendSuccess: {
    backgroundColor: colors.status.success,
  },
  statTrendWarning: {
    backgroundColor: colors.status.warning,
  },
  statTrendPrimary: {
    backgroundColor: colors.primary.main,
  },
  statTrendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
});