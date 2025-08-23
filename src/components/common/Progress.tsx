import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import { colors, typography, radius, spacing } from '../../design-system';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
  animated?: boolean;
  duration?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  color = colors.primary.main,
  backgroundColor = colors.gray[200],
  height = 8,
  showLabel = false,
  label,
  style,
  animated = true,
  duration = 500,
}) => {
  const [animatedValue] = React.useState(new Animated.Value(0));
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(percentage);
    }
  }, [percentage, animated, duration, animatedValue]);

  const progressWidth = animated
    ? animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      })
    : `${percentage}%`;

  return (
    <View style={[styles.container, style]}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label || `${Math.round(percentage)}%`}
          </Text>
        </View>
      )}
      
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth as any,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  color = colors.primary.main,
  backgroundColor = colors.gray[200],
  children,
  style,
}) => {
  const [animatedValue] = React.useState(new Animated.Value(0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(progress, 0), 100);

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [percentage, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      {/* Background Circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />
      
      {/* Progress Circle */}
      <Animated.View
        style={[
          styles.circle,
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
      
      {/* Content */}
      {children && (
        <View style={styles.circularContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Multi Progress Component for nutrition tracking
interface MultiProgressProps {
  data: Array<{
    label: string;
    value: number;
    max: number;
    color: string;
  }>;
  style?: ViewStyle;
  height?: number;
}

export const MultiProgress: React.FC<MultiProgressProps> = ({
  data,
  style,
  height = 8,
}) => {
  return (
    <View style={[styles.multiContainer, style]}>
      {data.map((item, index) => (
        <View key={index} style={styles.multiItem}>
          <View style={styles.multiLabelContainer}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <Text style={styles.multiLabel}>{item.label}</Text>
            <Text style={styles.multiValue}>
              {item.value}/{item.max}
            </Text>
          </View>
          <Progress
            value={item.value}
            max={item.max}
            color={item.color}
            height={height}
            animated
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    marginBottom: spacing.xxs,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  // Circular Progress Styles
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circularContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Multi Progress Styles
  multiContainer: {
    gap: spacing.sm,
  },
  multiItem: {
    gap: spacing.xxs,
  },
  multiLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  multiLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  multiValue: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});