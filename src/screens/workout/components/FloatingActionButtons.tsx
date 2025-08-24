import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Share } from 'lucide-react-native';
import { colors, spacing, shadows } from '../../../design-system';

interface FloatingActionButtonsProps {
  onSharePress: () => void;
  onAddPress: () => void;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onSharePress,
  onAddPress
}) => {
  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity style={styles.fabShare} onPress={onSharePress}>
        <Share size={20} color={colors.text.secondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.fabMain} onPress={onAddPress}>
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  fabShare: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.md,
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});