import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../design-system';

export const NotificationCenter: React.FC = () => {
  return (
    <TouchableOpacity style={styles.iconButton}>
      <Bell size={24} color={colors.text.primary} />
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>2</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});