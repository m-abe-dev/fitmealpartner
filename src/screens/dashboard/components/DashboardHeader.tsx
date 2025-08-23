import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Crown, Activity } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';

export const DashboardHeader: React.FC = () => {
  return (
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
  );
};

const styles = StyleSheet.create({
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
});