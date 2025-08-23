import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, shadows, radius, spacing } from '../../design-system';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  padding = 'md' 
}) => {
  return (
    <View style={[
      styles.base,
      variant === 'elevated' && styles.elevated,
      variant === 'bordered' && styles.bordered,
      { padding: spacing[padding] },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
  },
  elevated: {
    ...shadows.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});