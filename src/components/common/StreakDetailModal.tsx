import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, TrendingUp, Calendar, Award } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import DatabaseService from '../../services/database/DatabaseService';
// import { useWorkoutStore } from '../../stores/useWorkoutStore'; // 削除してデータベース直接取得に変更

interface StreakDetailModalProps {
  visible: boolean;
  onClose: () => void;
  currentStreak: number;
}

interface StreakStats {
  total: {
    foodDays: number;
    workoutDays: number;
  };
  week: {
    foodDays: number;
    workoutDays: number;
  };
  month: {
    foodDays: number;
    workoutDays: number;
  };
}

export const StreakDetailModal: React.FC<StreakDetailModalProps> = ({
  visible,
  onClose,
  currentStreak,
}) => {
  const [stats, setStats] = useState<StreakStats>({
    total: { foodDays: 0, workoutDays: 0 },
    week: { foodDays: 0, workoutDays: 0 },
    month: { foodDays: 0, workoutDays: 0 },
  });
  useEffect(() => {
    if (visible) {
      loadStreakStats();
    }
  }, [visible]);

  const loadStreakStats = async () => {
    try {

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 食事記録の統計
      const allFoodLogs = await DatabaseService.getAllAsync<any>(
        'SELECT DISTINCT date FROM food_log ORDER BY date'
      );

      const weekFoodLogs = await DatabaseService.getAllAsync<any>(
        'SELECT DISTINCT date FROM food_log WHERE date >= ? ORDER BY date',
        [weekStart.toISOString().split('T')[0]]
      );

      const monthFoodLogs = await DatabaseService.getAllAsync<any>(
        'SELECT DISTINCT date FROM food_log WHERE date >= ? ORDER BY date',
        [monthStart.toISOString().split('T')[0]]
      );

      // ワークアウト記録 - カレンダーと同じロジックを使用
      const allWorkouts = await DatabaseService.getAllAsync<any>(
        `SELECT DISTINCT ws.date
         FROM workout_session ws
         INNER JOIN workout_set wset ON ws.session_id = wset.session_id
         ORDER BY ws.date`
      );

      const weekWorkouts = await DatabaseService.getAllAsync<any>(
        `SELECT DISTINCT ws.date
         FROM workout_session ws
         INNER JOIN workout_set wset ON ws.session_id = wset.session_id
         WHERE ws.date >= ?
         ORDER BY ws.date`,
        [weekStart.toISOString().split('T')[0]]
      );

      const monthWorkouts = await DatabaseService.getAllAsync<any>(
        `SELECT DISTINCT ws.date
         FROM workout_session ws
         INNER JOIN workout_set wset ON ws.session_id = wset.session_id
         WHERE ws.date >= ?
         ORDER BY ws.date`,
        [monthStart.toISOString().split('T')[0]]
      );

      setStats({
        total: {
          foodDays: allFoodLogs.length,
          workoutDays: allWorkouts.length,
        },
        week: {
          foodDays: weekFoodLogs.length,
          workoutDays: weekWorkouts.length,
        },
        month: {
          foodDays: monthFoodLogs.length,
          workoutDays: monthWorkouts.length,
        },
      });

    } catch (error) {
      console.error('Error loading streak stats:', error);
    }
  };

  const getStreakEmoji = () => {
    if (currentStreak >= 100) return '💎';
    if (currentStreak >= 50) return '🏆';
    if (currentStreak >= 30) return '🥇';
    if (currentStreak >= 7) return '🔥';
    if (currentStreak >= 3) return '⚡';
    return '🌟';
  };

  const getMotivationalMessage = () => {
    if (currentStreak >= 100) return '伝説のストリーク達成！';
    if (currentStreak >= 50) return '素晴らしい継続力です！';
    if (currentStreak >= 30) return '1ヶ月達成おめでとう！';
    if (currentStreak >= 7) return '1週間継続中！その調子！';
    if (currentStreak >= 3) return 'いいスタートです！';
    return '記録を続けましょう！';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>記録統計</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 現在のストリーク */}
            <View style={styles.currentStreakCard}>
              <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
              <Text style={styles.currentStreakNumber}>{currentStreak}</Text>
              <Text style={styles.currentStreakLabel}>日連続</Text>
              <Text style={styles.motivationalMessage}>
                {getMotivationalMessage()}
              </Text>
            </View>

            {/* 累計統計 */}
            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Award size={20} color={colors.primary.main} />
                  <Text style={styles.statTitle}>累計記録</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>🍽 食事記録</Text>
                  <Text style={styles.statValue}>{stats.total.foodDays}日</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>💪 筋トレ記録</Text>
                  <Text style={styles.statValue}>{stats.total.workoutDays}日</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Calendar size={20} color={colors.status.success} />
                  <Text style={styles.statTitle}>7日間の記録</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>🍽 食事記録</Text>
                  <Text style={styles.statValue}>{stats.week.foodDays}日</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>💪 筋トレ記録</Text>
                  <Text style={styles.statValue}>{stats.week.workoutDays}回</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(stats.week.foodDays / 7) * 100}%` }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <TrendingUp size={20} color={colors.status.warning} />
                  <Text style={styles.statTitle}>今月の記録</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>🍽 食事記録</Text>
                  <Text style={styles.statValue}>{stats.month.foodDays}日</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>💪 筋トレ記録</Text>
                  <Text style={styles.statValue}>{stats.month.workoutDays}回</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(stats.month.foodDays / 30) * 100}%`,
                        backgroundColor: colors.status.warning,
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  currentStreakCard: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  currentStreakNumber: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.inverse,
  },
  currentStreakLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  motivationalMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  statsSection: {
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: radius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.status.success,
    borderRadius: radius.full,
  },
  tipsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  tipsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.xs * 1.5,
  },
});