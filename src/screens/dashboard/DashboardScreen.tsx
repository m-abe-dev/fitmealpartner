import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea } from 'victory-native';
import { Bell, Crown, TrendingUp, Calendar, Target, Activity, Share2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TabBar } from '../../components/common/TabBar';
import { Badge } from '../../components/common/Badge';

const { width: screenWidth } = Dimensions.get('window');

interface ScoreData {
  nutrition_today: number;
  training_today: number;
  total_today: number;
}

interface ChartData {
  x: string;
  y: number;
  volume?: number;
  calories?: number;
}

interface AIFeedback {
  type: 'nutrition' | 'training' | 'general';
  message: string;
  severity: 'info' | 'warning' | 'success';
  action?: string;
}

export const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coach');
  const [currentMonth, setCurrentMonth] = useState(0);
  const [expandedFeedback, setExpandedFeedback] = useState(true);

  // モックデータ
  const [scoreData] = useState<ScoreData>({
    nutrition_today: 82,
    training_today: 74,
    total_today: 78
  });

  const [weightData] = useState<ChartData[]>([
    { x: '1/1', y: 72.5, volume: 1200, calories: 2100 },
    { x: '1/8', y: 72.2, volume: 1350, calories: 2050 },
    { x: '1/15', y: 71.8, volume: 1400, calories: 1980 },
    { x: '1/22', y: 71.5, volume: 1250, calories: 2020 },
    { x: '1/29', y: 71.2, volume: 1500, calories: 1950 },
    { x: '2/5', y: 70.9, volume: 1600, calories: 1900 },
    { x: '2/12', y: 70.6, volume: 1450, calories: 1920 },
  ]);

  const [caloriesData] = useState<ChartData[]>([
    { x: '1/1', y: 2100 },
    { x: '1/8', y: 2050 },
    { x: '1/15', y: 1980 },
    { x: '1/22', y: 2020 },
    { x: '1/29', y: 1950 },
    { x: '2/5', y: 1900 },
    { x: '2/12', y: 1920 },
  ]);

  const [volumeData] = useState<ChartData[]>([
    { x: '1/1', y: 1200 },
    { x: '1/8', y: 1350 },
    { x: '1/15', y: 1400 },
    { x: '1/22', y: 1250 },
    { x: '1/29', y: 1500 },
    { x: '2/5', y: 1600 },
    { x: '2/12', y: 1450 },
  ]);

  const [aiFeedback] = useState<AIFeedback[]>([
    {
      type: 'nutrition',
      message: 'タンパク質があと28g不足しています。プロテインバー1本で補完できます。',
      severity: 'warning',
      action: '食材を追加'
    },
    {
      type: 'training',
      message: '下半身のトレーニングが不足気味です。明日はレッグデイをお勧めします。',
      severity: 'info',
      action: 'ワークアウト記録を確認'
    },
    {
      type: 'general',
      message: '今週のトータルスコアは85点！目標達成まであと少しです。',
      severity: 'success'
    }
  ]);

  const tabs = [
    { id: 'coach', label: 'AIコーチ', icon: <Activity size={16} color={colors.text.secondary} /> },
    { id: 'analytics', label: 'アナリティクス', icon: <TrendingUp size={16} color={colors.text.secondary} /> }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // データ更新処理
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.status.success;
    if (score >= 60) return colors.status.warning;
    return colors.status.error;
  };

  const getSeverityColor = (severity: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (severity) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={24} color={colors.primary.main} />
          <Text style={styles.headerTitle}>ダッシュボード</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButton}>
            <Crown size={16} color={colors.primary.main} />
            <Text style={styles.proButtonText}>PRO</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* スコアセクション */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>スコアサマリー</Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                // SNS シェア機能の実装
                console.log('Share score to SNS');
              }}
            >
              <Share2 size={20} color={colors.primary.main} />
            </TouchableOpacity>
          </View>
          <Card style={styles.scoreCard}>
            <View style={styles.scoreCardGradient}>
              <Text style={styles.scoreTitle}>今日のスコア</Text>
              <View style={styles.scoreMain}>
                <Text style={styles.totalScore}>{scoreData.total_today}</Text>
                <Text style={styles.scoreUnit}>/ 100</Text>
              </View>
              <View style={styles.scoreBreakdown}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>栄養</Text>
                  <View style={styles.scoreValueContainer}>
                    <View
                      style={[
                        styles.scoreIndicator,
                        { backgroundColor: getScoreColor(scoreData.nutrition_today) }
                      ]}
                    />
                    <Text style={styles.scoreValue}>{scoreData.nutrition_today}</Text>
                  </View>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>トレーニング</Text>
                  <View style={styles.scoreValueContainer}>
                    <View
                      style={[
                        styles.scoreIndicator,
                        { backgroundColor: getScoreColor(scoreData.training_today) }
                      ]}
                    />
                    <Text style={styles.scoreValue}>{scoreData.training_today}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </View>

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
            <>
              <Text style={styles.sectionTitle}>AIコーチからのアドバイス</Text>
              <Card style={styles.feedbackCard}>
                <TouchableOpacity
                  style={styles.feedbackHeader}
                  onPress={() => setExpandedFeedback(!expandedFeedback)}
                >
                  <Text style={styles.feedbackTitle}>今日の改善提案</Text>
                  <Badge variant="error" size="small">
                    {aiFeedback.length}
                  </Badge>
                </TouchableOpacity>

                {expandedFeedback && (
                  <View style={styles.feedbackList}>
                    {aiFeedback.map((feedback, index) => (
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

              <Text style={styles.sectionTitle}>今日のおすすめアクション</Text>
              <Card style={styles.actionCard}>
                <View style={styles.actionList}>
                  <TouchableOpacity style={styles.actionItem}>
                    <View style={styles.actionIcon}>
                      <Target size={20} color={colors.primary.main} />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionText}>プロテイン20gを追加</Text>
                      <Text style={styles.actionSubtext}>目標達成まで28g不足</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <View style={styles.actionIcon}>
                      <Activity size={20} color={colors.status.success} />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionText}>下半身ワークアウト</Text>
                      <Text style={styles.actionSubtext}>3日間実施していません</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </Card>
            </>
          )}
        </View>

        {/* アナリティクスセクション */}
        {activeTab === 'analytics' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>データ分析</Text>
            <Card style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>筋トレボリューム × 体重変化</Text>
                <View style={styles.monthSelector}>
                  <TouchableOpacity
                    style={[styles.monthButton, currentMonth === -1 && styles.monthButtonActive]}
                    onPress={() => setCurrentMonth(-1)}
                  >
                    <Text style={[styles.monthButtonText, currentMonth === -1 && styles.monthButtonTextActive]}>
                      先月
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.monthButton, currentMonth === 0 && styles.monthButtonActive]}
                    onPress={() => setCurrentMonth(0)}
                  >
                    <Text style={[styles.monthButtonText, currentMonth === 0 && styles.monthButtonTextActive]}>
                      今月
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <VictoryChart
                  width={screenWidth - 64}
                  height={200}
                  padding={{ left: 50, top: 20, right: 50, bottom: 40 }}
                >
                  <VictoryAxis dependentAxis style={{
                    axis: { stroke: colors.border.light },
                    tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
                  }} />
                  <VictoryAxis style={{
                    axis: { stroke: colors.border.light },
                    tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
                  }} />

                  {/* ボリュームエリア */}
                  <VictoryArea
                    data={volumeData}
                    style={{
                      data: { fill: colors.primary[100], fillOpacity: 0.3 }
                    }}
                    animate={{
                      duration: 1000,
                      onLoad: { duration: 500 }
                    }}
                  />

                  {/* 体重ライン */}
                  <VictoryLine
                    data={weightData}
                    style={{
                      data: { stroke: colors.primary.main, strokeWidth: 2 }
                    }}
                    animate={{
                      duration: 1000,
                      onLoad: { duration: 500 }
                    }}
                  />
                </VictoryChart>
              </View>

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
            </Card>

            {/* 統計カード */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>-1.3kg</Text>
                <Text style={styles.statLabel}>今月の体重変化</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.status.success }]}>
                  <Text style={styles.statTrendText}>-1.8%</Text>
                </View>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>1,420kg</Text>
                <Text style={styles.statLabel}>平均ボリューム</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.primary.main }]}>
                  <Text style={styles.statTrendText}>+15%</Text>
                </View>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>12回</Text>
                <Text style={styles.statLabel}>今月のワークアウト</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.status.warning }]}>
                  <Text style={styles.statTrendText}>目標16回</Text>
                </View>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>85点</Text>
                <Text style={styles.statLabel}>平均スコア</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.status.success }]}>
                  <Text style={styles.statTrendText}>+5pt</Text>
                </View>
              </Card>
            </View>
            <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>摂取カロリー × 体重変化</Text>
              <View style={styles.monthSelector}>
                  <TouchableOpacity
                    style={[styles.monthButton, currentMonth === -1 && styles.monthButtonActive]}
                    onPress={() => setCurrentMonth(-1)}
                  >
                    <Text style={[styles.monthButtonText, currentMonth === -1 && styles.monthButtonTextActive]}>
                      先月
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.monthButton, currentMonth === 0 && styles.monthButtonActive]}
                    onPress={() => setCurrentMonth(0)}
                  >
                    <Text style={[styles.monthButtonText, currentMonth === 0 && styles.monthButtonTextActive]}>
                      今月
                    </Text>
                  </TouchableOpacity>
                </View>
            </View>

            <View style={styles.chartContainer}>
              <VictoryChart
                width={screenWidth - 64}
                height={200}
                padding={{ left: 50, top: 20, right: 50, bottom: 40 }}
              >
                <VictoryAxis dependentAxis style={{
                  axis: { stroke: colors.border.light },
                  tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
                }} />
                <VictoryAxis style={{
                  axis: { stroke: colors.border.light },
                  tickLabels: { fill: colors.text.tertiary, fontSize: 10 }
                }} />

                {/* カロリーエリア */}
                <VictoryArea
                  data={caloriesData}
                  style={{
                    data: { fill: colors.status.success + '40', fillOpacity: 0.3 }
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />

                {/* 体重ライン */}
                <VictoryLine
                  data={weightData}
                  style={{
                    data: { stroke: colors.primary.main, strokeWidth: 2 }
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
              </VictoryChart>
            </View>

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
          </Card>

            {/* 栄養統計カード */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>1,970</Text>
                <Text style={styles.statLabel}>平均カロリー</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.status.success }]}>
                  <Text style={styles.statTrendText}>-50kcal</Text>
                </View>
              </Card>

              <Card style={styles.statCard}>
                <Text style={styles.statValue}>142g</Text>
                <Text style={styles.statLabel}>平均タンパク質</Text>
                 <View style={[styles.statTrend, { backgroundColor: colors.primary.main }]}>
                  <Text style={styles.statTrendText}>+5g</Text>
                </View>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>平均食品数</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.status.warning }]}>
                  <Text style={styles.statTrendText}>+2品</Text>
                </View>
              </Card>

              <Card style={styles.statCard}>
                <Text style={styles.statValue}>81</Text>
                <Text style={styles.statLabel}>平均スコア</Text>
                <View style={[styles.statTrend, { backgroundColor: colors.status.success }]}>
                  <Text style={styles.statTrendText}>+3pt</Text>
                </View>
              </Card>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  tabContainer: {
    marginBottom: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.status.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: typography.fontSize.xs - 2,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  proButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
  },
  scoreCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  scoreCardGradient: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  scoreTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  totalScore: {
    fontSize: typography.fontSize['4xl'],
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  scoreUnit: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse + '80',
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse + '80',
    fontFamily: typography.fontFamily.regular,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  scoreIndicator: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  scoreValue: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  tabBar: {
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
  actionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
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
  chartCard: {
    marginBottom: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  monthSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.full,
    padding: spacing.xxxs,
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
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statTrend: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxxs,
    borderRadius: radius.sm,
  },
  statTrendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
});