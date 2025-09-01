import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Activity, Target, Share } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { ScoreData } from '../types/dashboard.types';

interface ScoreCardProps {
  scoreData: ScoreData[];
  currentScoreTab: number;
  onScoreTabChange: (index: number) => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  scoreData,
  currentScoreTab,
  onScoreTabChange,
}) => {
  // データが未定義または空の場合の早期リターン
  if (!scoreData || scoreData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>スコアサマリー</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>スコアを計算中...</Text>
        </View>
      </View>
    );
  }
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // タッチハンドリング用の状態
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

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
      onScoreTabChange(newIndex);
    }
  };

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

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
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

    if (deltaX > swipeThreshold && currentScoreTab > 0) {
      handleSwipe(currentScoreTab - 1);
    } else if (deltaX < -swipeThreshold && currentScoreTab < scoreData.length - 1) {
      handleSwipe(currentScoreTab + 1);
    }

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setTouchStart(null);
    setIsSwiping(false);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.status.success;
    if (score >= 60) return colors.status.warning;
    return colors.status.error;
  };

  const formatScore = (score: number, period: string): string => {
    if (period === '今日') {
      return Math.round(score).toString();
    }
    return score.toFixed(1);
  };

  const getCurrentScoreData = (): ScoreData => {
    return scoreData[currentScoreTab] || scoreData[0];
  };

  return (
    <View style={styles.container}>
      {/* セクションヘッダー */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>スコアサマリー</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            console.log('Share score to SNS');
          }}
        >
          <Share size={20} color={colors.text.secondary} />
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
            onPress={() => onScoreTabChange(index)}
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

      {/* スワイプ対応スコアカード */}
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
                  <Animated.View style={[styles.scoreDisplayContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.totalScore}>{formatScore(getCurrentScoreData().total_score, getCurrentScoreData().period)}</Text>
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
                      <Text style={styles.scoreDetailValue}>{formatScore(getCurrentScoreData().nutrition_score, getCurrentScoreData().period)}</Text>
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
                      <Text style={styles.scoreDetailValue}>{formatScore(getCurrentScoreData().training_score, getCurrentScoreData().period)}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
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
    shadowOffset: { width: 0, height: 4 },
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  modernProgressFill: {
    height: '100%',
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: radius.full,
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
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
});