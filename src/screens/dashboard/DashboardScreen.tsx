import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea } from 'victory-native';
import Svg, { Circle } from 'react-native-svg';
import { Bell, Crown, TrendingUp, Calendar, Target, Activity, Share2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TabBar } from '../../components/common/TabBar';
import { Badge } from '../../components/common/Badge';

const { width: screenWidth } = Dimensions.get('window');

// 円形プログレスバーコンポーネント
const CircularProgress: React.FC<{
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}> = ({ size, strokeWidth, progress, color, backgroundColor = '#ffffff30', children }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {/* 背景の円 */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />

      {/* プログレス円 */}
      <View style={{ position: 'absolute', width: size, height: size, overflow: 'hidden' }}>
        {/* 左半分（0-50%）*/}
        {progress > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              left: size / 2,
              width: size / 2,
              height: size,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderRightColor: color,
                transform: [
                  { rotate: '0deg' },
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 50],
                      outputRange: ['0deg', '180deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                marginLeft: -size / 2,
              }}
            />
          </Animated.View>
        )}

        {/* 右半分（50-100%）*/}
        {progress > 50 && (
          <Animated.View
            style={{
              position: 'absolute',
              right: size / 2,
              width: size / 2,
              height: size,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderLeftColor: color,
                transform: [
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [50, 100],
                      outputRange: ['0deg', '180deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                marginRight: -size / 2,
              }}
            />
          </Animated.View>
        )}
      </View>

      {/* 中央のコンテンツ */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
};

interface ScoreData {
  period: string;
  nutrition_score: number;
  training_score: number;
  total_score: number;
  details: {
    nutrition: string;
    training: string;
  };
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

interface AIAction {
  icon: string;
  title: string;
  subtitle: string;
  action: string;
}

interface PeriodAIData {
  period: string;
  feedback: AIFeedback[];
  actions: AIAction[];
}

interface StatsData {
  weightChange: string;
  weightTrend: string;
  trendType: 'success' | 'warning' | 'primary';
  avgVolume: string;
  volumeTrend: string;
  workoutCount: string;
  workoutTarget: string;
  avgScore: string;
  scoreTrend: string;
  avgCalories: string;
  caloriesTrend: string;
  avgProtein: string;
  proteinTrend: string;
  avgFoodCount: string;
  foodTrend: string;
}

interface PeriodData {
  period: string;
  weightData: ChartData[];
  caloriesData: ChartData[];
  volumeData: ChartData[];
  stats: StatsData;
}

export const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coach');
  const [currentPeriod, setCurrentPeriod] = useState(0); // 0: 日, 1: 週, 2: 月 (統計カード用)
  const [currentWorkoutPeriod, setCurrentWorkoutPeriod] = useState(0); // 0: 日, 1: 週, 2: 月 (筋トレボリュームグラフ用)
  const [currentNutritionPeriod, setCurrentNutritionPeriod] = useState(0); // 0: 日, 1: 週, 2: 月 (摂取カロリーグラフ用)
  const [expandedFeedback, setExpandedFeedback] = useState(true);
  const [currentScoreTab, setCurrentScoreTab] = useState(0); // 0: 今日, 1: 今週, 2: 今月

  // アニメーション用の参照
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // モックデータ
  const [scoreData] = useState<ScoreData[]>([
    {
      period: '今日',
      nutrition_score: 82,
      training_score: 74,
      total_score: 78,
      details: {
        nutrition: '栄養スコア',
        training: 'トレーニング'
      }
    },
    {
      period: '今週',
      nutrition_score: 78,
      training_score: 82,
      total_score: 80,
      details: {
        nutrition: '週平均栄養',
        training: '週平均トレ'
      }
    },
    {
      period: '今月',
      nutrition_score: 85,
      training_score: 79,
      total_score: 82,
      details: {
        nutrition: '月平均栄養',
        training: '月平均トレ'
      }
    }
  ]);

  const [periodData] = useState<PeriodData[]>([
    // 日別データ
    {
      period: '日',
      weightData: [
        { x: '1日', y: 70.2, volume: 800, calories: 1850 },
        { x: '2日', y: 70.1, volume: 900, calories: 2100 },
        { x: '3日', y: 70.0, volume: 1100, calories: 1950 },
        { x: '4日', y: 70.0, volume: 950, calories: 2250 },
        { x: '5日', y: 69.9, volume: 1200, calories: 1800 },
        { x: '6日', y: 69.8, volume: 1300, calories: 2050 },
        { x: '7日', y: 69.9, volume: 1050, calories: 1900 },
      ],
      caloriesData: [
        { x: '1日', y: 1850 },
        { x: '2日', y: 2100 },
        { x: '3日', y: 1950 },
        { x: '4日', y: 2250 },
        { x: '5日', y: 1800 },
        { x: '6日', y: 2050 },
        { x: '7日', y: 1900 },
      ],
      volumeData: [
        { x: '1日', y: 800 },
        { x: '2日', y: 900 },
        { x: '3日', y: 1100 },
        { x: '4日', y: 950 },
        { x: '5日', y: 1200 },
        { x: '6日', y: 1300 },
        { x: '7日', y: 1050 },
      ],
      stats: {
        weightChange: '-0.3kg',
        weightTrend: '-0.4%',
        trendType: 'success',
        avgVolume: '1,040kg',
        volumeTrend: '+12%',
        workoutCount: '5回',
        workoutTarget: '週7回',
        avgScore: '78点',
        scoreTrend: '+3pt',
        avgCalories: '1,986',
        caloriesTrend: '-14kcal',
        avgProtein: '138g',
        proteinTrend: '+8g',
        avgFoodCount: '11',
        foodTrend: '+1品',
      }
    },
    // 週別データ
    {
      period: '週',
      weightData: [
        { x: '1週', y: 70.5, volume: 3400, calories: 1980 },
        { x: '2週', y: 70.2, volume: 3650, calories: 2020 },
        { x: '3週', y: 69.8, volume: 3900, calories: 1950 },
        { x: '4週', y: 69.5, volume: 3750, calories: 2100 },
      ],
      caloriesData: [
        { x: '1週', y: 1980 },
        { x: '2週', y: 2020 },
        { x: '3週', y: 1950 },
        { x: '4週', y: 2100 },
      ],
      volumeData: [
        { x: '1週', y: 3400 },
        { x: '2週', y: 3650 },
        { x: '3週', y: 3900 },
        { x: '4週', y: 3750 },
      ],
      stats: {
        weightChange: '-1.0kg',
        weightTrend: '-1.4%',
        trendType: 'success',
        avgVolume: '3,675kg',
        volumeTrend: '+8%',
        workoutCount: '15回',
        workoutTarget: '月16回',
        avgScore: '80点',
        scoreTrend: '+2pt',
        avgCalories: '2,013',
        caloriesTrend: '+13kcal',
        avgProtein: '142g',
        proteinTrend: '+4g',
        avgFoodCount: '12',
        foodTrend: '+1品',
      }
    },
    // 月別データ
    {
      period: '月',
      weightData: [
        { x: '1月', y: 71.2, volume: 3200, calories: 2050 },
        { x: '2月', y: 70.5, volume: 3450, calories: 1980 },
        { x: '3月', y: 69.8, volume: 3650, calories: 1920 },
        { x: '4月', y: 69.2, volume: 3550, calories: 2000 },
        { x: '5月', y: 68.8, volume: 3800, calories: 1950 },
        { x: '6月', y: 68.5, volume: 3900, calories: 2080 },
      ],
      caloriesData: [
        { x: '1月', y: 2050 },
        { x: '2月', y: 1980 },
        { x: '3月', y: 1920 },
        { x: '4月', y: 2000 },
        { x: '5月', y: 1950 },
        { x: '6月', y: 2080 },
      ],
      volumeData: [
        { x: '1月', y: 3200 },
        { x: '2月', y: 3450 },
        { x: '3月', y: 3650 },
        { x: '4月', y: 3550 },
        { x: '5月', y: 3800 },
        { x: '6月', y: 3900 },
      ],
      stats: {
        weightChange: '-2.7kg',
        weightTrend: '-3.8%',
        trendType: 'success',
        avgVolume: '3,590kg',
        volumeTrend: '+22%',
        workoutCount: '78回',
        workoutTarget: '年100回',
        avgScore: '82点',
        scoreTrend: '+7pt',
        avgCalories: '1,997',
        caloriesTrend: '+30kcal',
        avgProtein: '145g',
        proteinTrend: '+15g',
        avgFoodCount: '13',
        foodTrend: '+3品',
      }
    }
  ]);

  const [periodAIData] = useState<PeriodAIData[]>([
    {
      period: '今日',
      feedback: [
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
          message: '今日のトータルスコアは78点。栄養面でもう少し改善の余地があります。',
          severity: 'info'
        }
      ],
      actions: [
        {
          icon: 'target',
          title: 'プロテイン20gを追加',
          subtitle: '目標達成まで28g不足',
          action: 'add_protein'
        },
        {
          icon: 'activity',
          title: '下半身ワークアウト',
          subtitle: '3日間実施していません',
          action: 'plan_workout'
        }
      ]
    },
    {
      period: '今週',
      feedback: [
        {
          type: 'training',
          message: '今週は筋トレの継続性が素晴らしいです！特に上半身のボリュームが向上しています。',
          severity: 'success',
          action: 'ワークアウト記録を確認'
        },
        {
          type: 'nutrition',
          message: '平日の栄養管理は優秀ですが、週末にカロリーオーバーが見られます。',
          severity: 'warning',
          action: '食事計画を見直し'
        },
        {
          type: 'general',
          message: '今週のスコアは80点で安定しています。継続できている点が素晴らしいです。',
          severity: 'success'
        }
      ],
      actions: [
        {
          icon: 'calendar',
          title: '週末の食事プラン作成',
          subtitle: '週末のカロリー管理改善',
          action: 'plan_weekend_meals'
        },
        {
          icon: 'trending-up',
          title: 'トレーニング強度アップ',
          subtitle: '来週は重量を5%増加',
          action: 'increase_intensity'
        }
      ]
    },
    {
      period: '今月',
      feedback: [
        {
          type: 'general',
          message: '今月のスコアは82点で非常に優秀！継続的な改善が見られています。',
          severity: 'success'
        },
        {
          type: 'nutrition',
          message: '月間を通してタンパク質摂取が安定しており、理想的な栄養バランスです。',
          severity: 'success',
          action: '栄養データを確認'
        },
        {
          type: 'training',
          message: '来月は新しい種目の導入で更なる成長が期待できます。',
          severity: 'info',
          action: 'トレーニングプラン更新'
        }
      ],
      actions: [
        {
          icon: 'award',
          title: '新しいトレーニング種目',
          subtitle: '停滞期防止のための変化',
          action: 'add_new_exercises'
        },
        {
          icon: 'target',
          title: '来月の目標設定',
          subtitle: '体重-1kg、筋力+10%',
          action: 'set_monthly_goals'
        }
      ]
    }
  ]);

  const tabs = [
    { id: 'coach', label: 'AIコーチ', icon: <Activity size={16} color={colors.text.secondary} /> },
    { id: 'analytics', label: 'アナリティクス', icon: <TrendingUp size={16} color={colors.text.secondary} /> }
  ];

  // スコアタブ切り替え時のアニメーション
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScoreTab]);

  // パルスアニメーション
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // スワイプジェスチャー処理
  const handleSwipe = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < scoreData.length && newIndex !== currentScoreTab) {
      setCurrentScoreTab(newIndex);
    }
  };

  // より安定したタッチハンドリング
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (event: any) => {
    const touch = event.nativeEvent.touches[0];
    setTouchStart({ x: touch.pageX, y: touch.pageY });
    setIsSwiping(false);
  };

  const handleTouchMove = (event: any) => {
    if (!touchStart) return;

    const touch = event.nativeEvent.touches[0];
    const deltaX = touch.pageX - touchStart.x;
    const deltaY = touch.pageY - touchStart.y;

    // 水平方向のスワイプかどうかを判定
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      // リアルタイムでカードを動かす
      const constrainedDelta = Math.max(-100, Math.min(100, deltaX * 0.5));
      slideAnim.setValue(constrainedDelta);
    }
  };

  const handleTouchEnd = (event: any) => {
    if (!touchStart || !isSwiping) {
      slideAnim.setValue(0);
      setTouchStart(null);
      setIsSwiping(false);
      return;
    }

    const touch = event.nativeEvent.changedTouches[0];
    const deltaX = touch.pageX - touchStart.x;
    const swipeThreshold = 60;

    // スワイプ方向を判定して切り替え
    if (deltaX > swipeThreshold && currentScoreTab > 0) {
      handleSwipe(currentScoreTab - 1);
    } else if (deltaX < -swipeThreshold && currentScoreTab < scoreData.length - 1) {
      handleSwipe(currentScoreTab + 1);
    }

    // アニメーションをリセット
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setTouchStart(null);
    setIsSwiping(false);
  };

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

  const getCurrentScoreData = (): ScoreData => {
    return scoreData[currentScoreTab];
  };

  const getCurrentAIData = (): PeriodAIData => {
    return periodAIData[currentScoreTab];
  };

  const getCurrentPeriodData = (): PeriodData => {
    return periodData[currentPeriod];
  };

  const getCurrentWorkoutPeriodData = (): PeriodData => {
    return periodData[currentWorkoutPeriod];
  };

  const getCurrentNutritionPeriodData = (): PeriodData => {
    return periodData[currentNutritionPeriod];
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

          {/* スコア期間選択タブ */}
          <View style={styles.scoreTabContainer}>
            {scoreData.map((data, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.scoreTab,
                  currentScoreTab === index && styles.scoreTabActive
                ]}
                onPress={() => setCurrentScoreTab(index)}
              >
                <Text style={[
                  styles.scoreTabText,
                  currentScoreTab === index && styles.scoreTabTextActive
                ]}>
                  {data.period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ overflow: 'visible' }}
          >
            <Animated.View
              style={{
                transform: [
                  { scale: scaleAnim },
                  { translateX: slideAnim }
                ]
              }}
            >
            <Card style={styles.scoreCard}>
              <View style={styles.scoreCardContainer}>
                {/* グラデーション背景 */}
                <View style={styles.scoreCardGradient}>
                  {/* ヘッダー部分 */}
                  <View style={styles.scoreCardHeader}>
                    <Text style={styles.scoreTitle}>{getCurrentScoreData().period}のスコア</Text>
                    <View style={styles.scoreStatusBadge}>
                      <Text style={styles.scoreStatusText}>
                        {getCurrentScoreData().total_score >= 85 ? '🔥 非常に良好' :
                         getCurrentScoreData().total_score >= 70 ? '✨ 良好' :
                         getCurrentScoreData().total_score >= 50 ? '🌱 普通' : '🎯 要改善'}
                      </Text>
                    </View>
                  </View>

                  {/* メインスコア部分 */}
                  <View style={styles.scoreMainContainer}>
                    {/* 大きな数字表示 */}
                    <Animated.View style={[styles.scoreDisplayContainer, { transform: [{ scale: pulseAnim }] }]}>
                      <Text style={styles.totalScore}>{getCurrentScoreData().total_score}</Text>
                      <Text style={styles.scoreUnit}>/ 100</Text>
                    </Animated.View>

                    {/* モダンなプログレスバー */}
                    <View style={styles.modernProgressContainer}>
                      <View style={styles.modernProgressTrack}>
                        <Animated.View
                          style={[
                            styles.modernProgressFill,
                            {
                              width: `${getCurrentScoreData().total_score}%`,
                              backgroundColor: getScoreColor(getCurrentScoreData().total_score),
                            }
                          ]}
                        />
                      </View>

                      {/* グラデーションオーバーレイ */}
                      <View style={styles.progressGradientOverlay} />
                    </View>

                  </View>

                  {/* スコア詳細 */}
                  <View style={styles.scoreBreakdown}>
                    <View style={styles.scoreDetailItem}>
                      <View style={styles.scoreDetailHeader}>
                        <View style={styles.scoreDetailIcon}>
                          <Activity size={16} color={colors.text.inverse} />
                        </View>
                        <Text style={styles.scoreDetailLabel}>{getCurrentScoreData().details.nutrition}</Text>
                      </View>
                      <View style={styles.scoreDetailProgress}>
                        <View style={styles.scoreProgressBar}>
                          <View
                            style={[
                              styles.scoreProgressFill,
                              {
                                width: `${getCurrentScoreData().nutrition_score}%`,
                                backgroundColor: getScoreColor(getCurrentScoreData().nutrition_score)
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreDetailValue}>{getCurrentScoreData().nutrition_score}</Text>
                      </View>
                    </View>

                    <View style={styles.scoreDetailItem}>
                      <View style={styles.scoreDetailHeader}>
                        <View style={styles.scoreDetailIcon}>
                          <Target size={16} color={colors.text.inverse} />
                        </View>
                        <Text style={styles.scoreDetailLabel}>{getCurrentScoreData().details.training}</Text>
                      </View>
                      <View style={styles.scoreDetailProgress}>
                        <View style={styles.scoreProgressBar}>
                          <View
                            style={[
                              styles.scoreProgressFill,
                              {
                                width: `${getCurrentScoreData().training_score}%`,
                                backgroundColor: getScoreColor(getCurrentScoreData().training_score)
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreDetailValue}>{getCurrentScoreData().training_score}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
            </Animated.View>
          </View>

          {/* スワイプインジケーター */}
          <View style={styles.swipeIndicator}>
            <View style={styles.swipeDotsContainer}>
              {scoreData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.swipeDot,
                    currentScoreTab === index && styles.swipeDotActive
                  ]}
                />
              ))}
            </View>
            <Text style={styles.swipeHint}>左右にスワイプして期間を切り替え</Text>
          </View>
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
                  <Text style={styles.feedbackTitle}>{getCurrentAIData().period}の改善提案</Text>
                </TouchableOpacity>

                {expandedFeedback && (
                  <View style={styles.feedbackList}>
                    {getCurrentAIData().feedback.map((feedback, index) => (
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

              <Text style={styles.sectionTitle}>{getCurrentAIData().period}のおすすめアクション</Text>
              <Card style={styles.actionCard}>
                <View style={styles.actionList}>
                  {getCurrentAIData().actions.map((action, index) => (
                    <TouchableOpacity key={index} style={styles.actionItem}>
                      <View style={styles.actionIcon}>
                        {action.icon === 'target' && <Target size={20} color={colors.primary.main} />}
                        {action.icon === 'activity' && <Activity size={20} color={colors.status.success} />}
                        {action.icon === 'calendar' && <Calendar size={20} color={colors.status.warning} />}
                        {action.icon === 'trending-up' && <TrendingUp size={20} color={colors.primary.main} />}
                        {action.icon === 'award' && <Target size={20} color={colors.status.success} />}
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
          )}
        </View>

        {/* アナリティクスセクション */}
        {activeTab === 'analytics' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>データ分析</Text>

            {/* 筋トレボリュームセクション */}
            <View style={styles.analyticsSection}>
              <View style={styles.analyticsSectionHeader}>
                <Text style={styles.analyticsSectionTitle}>🏋️ 筋トレボリューム分析</Text>
              </View>

              <Card style={styles.chartCard}>
                <View style={styles.chartHeader2Row}>
                  <Text style={styles.chartTitle}>筋トレボリューム × 体重変化</Text>
                  <View style={styles.monthSelector}>
                    {periodData.map((data, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.monthButton, currentWorkoutPeriod === index && styles.monthButtonActive]}
                        onPress={() => setCurrentWorkoutPeriod(index)}
                      >
                        <Text style={[styles.monthButtonText, currentWorkoutPeriod === index && styles.monthButtonTextActive]}>
                          {data.period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              <View style={styles.chartContainer}>
                <View style={styles.overlayChartContainer}>
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
                      data={getCurrentWorkoutPeriodData().volumeData}
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
                        data={getCurrentWorkoutPeriodData().weightData}
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

              {/* 筋トレボリューム統計カード */}
              <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentWorkoutPeriodData().stats.weightChange}</Text>
                    <Text style={styles.statLabel}>体重変化</Text>
                    <View style={[styles.statTrend, styles.statTrendSuccess]}>
                      <Text style={styles.statTrendText}>{getCurrentWorkoutPeriodData().stats.weightTrend}</Text>
                    </View>
                  </View>
                </Card>
                <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentWorkoutPeriodData().stats.avgVolume}</Text>
                    <Text style={styles.statLabel}>平均ボリューム</Text>
                    <View style={[styles.statTrend, styles.statTrendPrimary]}>
                      <Text style={styles.statTrendText}>{getCurrentWorkoutPeriodData().stats.volumeTrend}</Text>
                    </View>
                  </View>
                </Card>
              </View>

              <View style={styles.statsGrid}>
                <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentWorkoutPeriodData().stats.workoutCount}</Text>
                    <Text style={styles.statLabel}>筋トレ回数</Text>
                    <View style={[styles.statTrend, styles.statTrendWarning]}>
                      <Text style={styles.statTrendText}>{getCurrentWorkoutPeriodData().stats.workoutTarget}</Text>
                    </View>
                  </View>
                </Card>
                <Card style={{...styles.statCard, ...styles.statCardWorkout}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentWorkoutPeriodData().stats.avgScore}</Text>
                    <Text style={styles.statLabel}>平均スコア</Text>
                    <View style={[styles.statTrend, styles.statTrendSuccess]}>
                      <Text style={styles.statTrendText}>{getCurrentWorkoutPeriodData().stats.scoreTrend}</Text>
                    </View>
                  </View>
                </Card>
              </View>
            </View>
            </View>

            {/* 摂取カロリーセクション */}
            <View style={styles.analyticsSection}>
              <View style={styles.analyticsSectionHeader}>
                <Text style={styles.analyticsSectionTitle}>🍎 摂取カロリー分析</Text>
              </View>

              <Card style={styles.chartCard}>
                <View style={styles.chartHeader2Row}>
                  <Text style={styles.chartTitle}>摂取カロリー × 体重変化</Text>
                  <View style={styles.monthSelector}>
                {periodData.map((data, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.monthButton, currentNutritionPeriod === index && styles.monthButtonActive]}
                    onPress={() => setCurrentNutritionPeriod(index)}
                  >
                    <Text style={[styles.monthButtonText, currentNutritionPeriod === index && styles.monthButtonTextActive]}>
                      {data.period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.chartContainer}>
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
                    data={getCurrentNutritionPeriodData().caloriesData}
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
                      data={getCurrentNutritionPeriodData().weightData}
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

              {/* 摂取カロリー統計カード */}
              <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentNutritionPeriodData().stats.avgCalories}</Text>
                    <Text style={styles.statLabel}>平均カロリー</Text>
                    <View style={[styles.statTrend, styles.statTrendSuccess]}>
                      <Text style={styles.statTrendText}>{getCurrentNutritionPeriodData().stats.caloriesTrend}</Text>
                    </View>
                  </View>
                </Card>

                <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentNutritionPeriodData().stats.avgProtein}</Text>
                    <Text style={styles.statLabel}>平均タンパク質</Text>
                    <View style={[styles.statTrend, styles.statTrendPrimary]}>
                      <Text style={styles.statTrendText}>{getCurrentNutritionPeriodData().stats.proteinTrend}</Text>
                    </View>
                  </View>
                </Card>
              </View>

              <View style={styles.statsGrid}>
                <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentNutritionPeriodData().stats.avgFoodCount}</Text>
                    <Text style={styles.statLabel}>平均食品数</Text>
                    <View style={[styles.statTrend, styles.statTrendWarning]}>
                      <Text style={styles.statTrendText}>{getCurrentNutritionPeriodData().stats.foodTrend}</Text>
                    </View>
                  </View>
                </Card>

                <Card style={{...styles.statCard, ...styles.statCardNutrition}}>
                  <View style={styles.statCardContent}>
                    <Text style={styles.statValue}>{getCurrentNutritionPeriodData().stats.avgScore}</Text>
                    <Text style={styles.statLabel}>栄養スコア</Text>
                    <View style={[styles.statTrend, styles.statTrendSuccess]}>
                      <Text style={styles.statTrendText}>{getCurrentNutritionPeriodData().stats.scoreTrend}</Text>
                    </View>
                  </View>
                </Card>
              </View>
            </View>
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
    // marginBottom: spacing.md,
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
  analyticsSection: {
    marginBottom: spacing.xl,
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 2,
    shadowColor: colors.shadow?.primary || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
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
  scoreTabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.full,
    padding: spacing.xxxs,
    marginBottom: spacing.md,
  },
  scoreTab: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  scoreTabActive: {
    backgroundColor: colors.primary.main,
  },
  scoreTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  scoreTabTextActive: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  scoreCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  scoreCardContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  scoreCardGradient: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  scoreCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreMainContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  scoreStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.inverse,
  },
  modernProgressContainer: {
    width: '100%',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  modernProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  modernProgressFill: {
    height: '100%',
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radius.full,
  },
  scoreDistribution: {
    width: '100%',
    gap: spacing.sm,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distributionLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.inverse,
    width: 40,
    opacity: 0.8,
  },
  distributionBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.7,
  },
  scoreTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  totalScore: {
    fontSize: typography.fontSize['4xl'],
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  scoreUnit: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse + '90',
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing.xs,
  },
  scoreBreakdown: {
    gap: spacing.md,
  },
  scoreDetailItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  scoreDetailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDetailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    flex: 1,
  },
  scoreDetailProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  scoreDetailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'right',
  },
  swipeIndicator: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  swipeDotsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  swipeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  swipeDotActive: {
    backgroundColor: colors.primary.main,
    width: 20,
  },
  swipeHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
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
  statsSection: {
    marginBottom: spacing.sm,
  },
  statsSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
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