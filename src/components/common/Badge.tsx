import React from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, radius, spacing } from '../../design-system';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
}) => {
  const badgeStyles = [
    styles.base,
    styles[variant],
    styles[size],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: colors.gray[100],
  },
  success: {
    backgroundColor: colors.status.success,
  },
  warning: {
    backgroundColor: colors.status.warning,
  },
  error: {
    backgroundColor: colors.status.error,
  },
  info: {
    backgroundColor: colors.status.info,
  },
  secondary: {
    backgroundColor: colors.secondary.main,
  },
  small: {
    paddingVertical: spacing.xxxs,
    paddingHorizontal: spacing.xxs,
  },
  medium: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  large: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  defaultText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
  },
  successText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
  },
  warningText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
  },
  errorText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
  },
  infoText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
  },
  secondaryText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
  },
  smallText: {
    fontSize: typography.fontSize.xs,
  },
  mediumText: {
    fontSize: typography.fontSize.sm,
  },
  largeText: {
    fontSize: typography.fontSize.base,
  },
});