import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Crown, Flame } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { NotificationCenter } from './NotificationCenter';
import { StreakDetailModal } from './StreakDetailModal';
import StreakService from '../../services/StreakService';

interface ScreenHeaderProps {
  title: string;
  icon?: React.ReactNode;
  showNotification?: boolean;
  notificationCount?: number;
  showProButton?: boolean;
  showStreak?: boolean;
  onNotificationPress?: () => void;
  onProButtonPress?: () => void;
  onStreakPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  icon,
  showNotification = true,
  notificationCount,
  showProButton = true,
  showStreak = true,
  onNotificationPress,
  onProButtonPress,
  onStreakPress,
  rightComponent,
}) => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    if (showStreak) {
      loadStreakData();
      // 定期的にストリークデータを更新
      const interval = setInterval(loadStreakData, 60000); // 1分ごと
      return () => clearInterval(interval);
    }
  }, [showStreak]);

  const loadStreakData = async () => {
    try {
      const streak = await StreakService.getStreakDays();
      setStreakDays(streak);

      // テスト用: 実際のプロダクションでは削除
      await StreakService.setTestStreak(7);
      setStreakDays(7);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const handleBellPress = () => {
    setShowNotificationCenter(true);
    if (onNotificationPress) {
      onNotificationPress();
    }
  };

  const handleStreakPress = () => {
    setShowStreakModal(true);
    if (onStreakPress) {
      onStreakPress();
    }
  };

  const getStreakColor = () => {
    if (streakDays >= 30) return colors.status.warning; // ゴールド
    if (streakDays >= 7) return colors.status.error; // オレンジ
    return colors.text.secondary; // グレー
  };

  const getStreakIcon = () => {
    if (streakDays >= 30) return '🔥'; // ゴールド炎
    if (streakDays >= 7) return '🔥'; // オレンジ炎
    if (streakDays >= 3) return '⚡'; // 稲妻
    return '🔥'; // 基本の炎
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon && icon}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {rightComponent ? (
            rightComponent
          ) : (
            <>
              {showStreak && streakDays > 0 && (
                <TouchableOpacity
                  style={[styles.streakBadge, {
                    backgroundColor: getStreakColor() + '15',
                    borderColor: getStreakColor() + '30',
                  }]}
                  onPress={handleStreakPress}
                >
                  <Flame size={16} color={getStreakColor()} />
                  <Text style={[styles.streakText, { color: getStreakColor() }]}>
                    {streakDays}
                  </Text>
                </TouchableOpacity>
              )}

              {showNotification && (
                <NotificationCenter
                  visible={showNotificationCenter}
                  onClose={() => setShowNotificationCenter(false)}
                  renderTrigger={(unreadCount) => (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleBellPress}
                    >
                      <Bell size={24} color={colors.text.primary} />
                      {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount.toString()}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}

              {showProButton && (
                <TouchableOpacity
                  style={styles.proButton}
                  onPress={onProButtonPress}
                >
                  <Crown size={16} color={colors.primary.main} />
                  <Text style={styles.proButtonText}>PRO</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* ストリーク詳細モーダル */}
      <StreakDetailModal
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        currentStreak={streakDays}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.status.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: typography.fontSize.xs - 2,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: 20,
  },
  proButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 32,
    backgroundColor: 'transparent',
  },
  streakText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    minWidth: 16,
    textAlign: 'center',
  },
});