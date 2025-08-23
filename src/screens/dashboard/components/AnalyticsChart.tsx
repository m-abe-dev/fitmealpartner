import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea } from 'victory-native';
import { colors, typography, spacing, radius } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { PeriodData } from '../types/dashboard.types';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsChartProps {
  title: string;
  chartType: 'workout' | 'nutrition';
  periodData: PeriodData[];
  currentPeriod: number;
  onPeriodChange: (index: number) => void;
  getCurrentData: () => PeriodData;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  chartType,
  periodData,
  currentPeriod,
  onPeriodChange,
  getCurrentData,
}) => {
  const renderChart = () => {
    const currentData = getCurrentData();

    if (chartType === 'workout') {
      return (
        <View>
          <VictoryChart
            width={screenWidth - 20}
            height={250}
            padding={{ left: 60, top: 20, right: 60, bottom: 40 }}
            domain={{ y: [0, 1400] }} // ボリュームの範囲
          >
            {/* X軸 */}
            <VictoryAxis style={{
              axis: { stroke: colors.border.light },
              tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
            }} />

            {/* 左Y軸（ボリューム） */}
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: colors.border.light },
                tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
              }}
              tickFormat={(t) => `${t}kg`}
            />

            {/* ボリュームエリア（左軸） */}
            <VictoryArea
              data={currentData.volumeData}
              style={{
                data: { fill: colors.primary[100], fillOpacity: 0.3 }
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 }
              }}
            />
          </VictoryChart>

          {/* 体重ライン用の重ねたチャート */}
          <View style={styles.overlayChart}>
            <VictoryChart
              width={screenWidth - 20}
              height={250}
              padding={{ left: 60, top: 20, right: 60, bottom: 40 }}
              domain={{ y: [69, 71] }} // 体重の範囲
            >
              {/* 右Y軸（体重） */}
              <VictoryAxis
                dependentAxis
                orientation="right"
                style={{
                  axis: { stroke: colors.border.light },
                  tickLabels: { fill: colors.primary.main, fontSize: 10 }
                }}
                tickFormat={(t) => `${t}kg`}
              />

              {/* 体重ライン（右軸） */}
              <VictoryLine
                data={currentData.weightData}
                style={{
                  data: { stroke: colors.primary.main, strokeWidth: 3 }
                }}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 500 }
                }}
              />
            </VictoryChart>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.overlayChartContainer}>
          <VictoryChart
            width={screenWidth - 20}
            height={250}
            padding={{ left: 60, top: 20, right: 60, bottom: 40 }}
            domain={{ y: [1800, 2300] }} // カロリーの範囲
          >
            {/* X軸 */}
            <VictoryAxis style={{
              axis: { stroke: colors.border.light },
              tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
            }} />

            {/* 左Y軸（カロリー） */}
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: colors.border.light },
                tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
              }}
              tickFormat={(t) => `${t}kcal`}
            />

            {/* カロリーエリア（左軸） */}
            <VictoryArea
              data={currentData.caloriesData}
              style={{
                data: { fill: colors.status.success + '40', fillOpacity: 0.3 }
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 }
              }}
            />
          </VictoryChart>

          {/* 体重ライン用の重ねたチャート */}
          <View style={styles.overlayChart}>
            <VictoryChart
              width={screenWidth - 20}
              height={250}
              padding={{ left: 60, top: 20, right: 60, bottom: 40 }}
              domain={{ y: [69, 71] }} // 体重の範囲
            >
              {/* 右Y軸（体重） */}
              <VictoryAxis
                dependentAxis
                orientation="right"
                style={{
                  axis: { stroke: colors.border.light },
                  tickLabels: { fill: colors.primary.main, fontSize: 10 }
                }}
                tickFormat={(t) => `${t}kg`}
              />

              {/* 体重ライン（右軸） */}
              <VictoryLine
                data={currentData.weightData}
                style={{
                  data: { stroke: colors.primary.main, strokeWidth: 3 }
                }}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 500 }
                }}
              />
            </VictoryChart>
          </View>
        </View>
      );
    }
  };

  const renderLegend = () => {
    if (chartType === 'workout') {
      return (
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary.main }]} />
            <Text style={styles.legendText}>体重 (kg)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary[100] }]} />
            <Text style={styles.legendText}>トレーニング量 (kg)</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.status.success }]} />
            <Text style={styles.legendText}>摂取カロリー (kcal)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.primary.main }]} />
            <Text style={styles.legendText}>体重 (kg)</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader2Row}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.monthSelector}>
            {periodData.map((data, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.monthButton, currentPeriod === index && styles.monthButtonActive]}
                onPress={() => onPeriodChange(index)}
              >
                <Text style={[styles.monthButtonText, currentPeriod === index && styles.monthButtonTextActive]}>
                  {data.period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.chartContainer}>
          {renderChart()}
        </View>

        {renderLegend()}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  analyticsSectionHeader: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  analyticsSectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  chartHeader2Row: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.full,
    padding: spacing.xxxs,
    alignSelf: 'center',
  },
  monthButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  monthButtonActive: {
    backgroundColor: colors.primary.main,
  },
  monthButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  monthButtonTextActive: {
    color: colors.text.inverse,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  overlayChartContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayChart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: radius.sm,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});