import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Crown } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { NotificationCenter } from './NotificationCenter';

interface ScreenHeaderProps {
  title: string;
  icon?: React.ReactNode;
  showNotification?: boolean;
  notificationCount?: number;
  showProButton?: boolean;
  onNotificationPress?: () => void;
  onProButtonPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  icon,
  showNotification = true,
  notificationCount,
  showProButton = true,
  onNotificationPress,
  onProButtonPress,
  rightComponent,
}) => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const handleBellPress = () => {
    setShowNotificationCenter(true);
    if (onNotificationPress) {
      onNotificationPress();
    }
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
    gap: spacing.sm,
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
    paddingHorizontal: spacing.sm,
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
});