import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  animated?: boolean;
  duration?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  color = colors.primary.main,
  backgroundColor = colors.gray[200],
  children,
  style,
  animated = true,
  duration = 1000,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(progress, 0), 100);
  const center = size / 2;

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(percentage);
    }
  }, [percentage, animated, duration]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  // プログレスに応じた色の変化（栄養素用CircularProgressでは元の色を保持）
  const getDynamicColor = (progress: number): string => {
    // NutritionCircularProgressから呼ばれた場合は、元の色を保持
    if (color && (color === colors.nutrition.protein || 
                  color === colors.nutrition.fat || 
                  color === colors.nutrition.carbs || 
                  color === colors.nutrition.calories)) {
      return color;
    }
    
    if (progress >= 100) return colors.status.success;
    if (progress >= 80) return color;
    if (progress >= 60) return colors.status.warning;
    return colors.status.error;
  };

  const progressColor = getDynamicColor(percentage);

  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svgStyle}>
        {/* 背景の円 */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* プログレスの円 */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* 中央のコンテンツ */}
      {children && (
        <View style={styles.circularContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// 栄養素用の特別なCircularProgress
interface NutritionCircularProgressProps extends Omit<CircularProgressProps, 'progress'> {
  current: number;
  target: number;
  nutrientType: 'protein' | 'fat' | 'carbs' | 'calories';
  showUnit?: boolean;
  unit?: string;
}

export const NutritionCircularProgress: React.FC<NutritionCircularProgressProps> = ({
  current,
  target,
  nutrientType,
  showUnit = true,
  unit,
  size = 80,
  strokeWidth = 6,
  color: customColor,
  backgroundColor: customBackgroundColor,
  ...props
}) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;

  // 栄養素タイプに応じた色
  const getNutrientColor = (): string => {
    if (customColor) return customColor;
    
    switch (nutrientType) {
      case 'protein':
        return colors.nutrition.protein;
      case 'fat':
        return colors.nutrition.fat;
      case 'carbs':
        return colors.nutrition.carbs;
      case 'calories':
        return colors.nutrition.calories;
      default:
        return colors.primary.main;
    }
  };

  // 文字色を決定（コントラスト重視）
  const getTextColor = (): string => {
    // 背景が薄いので濃い色を使用
    switch (nutrientType) {
      case 'protein':
        return colors.nutrition.protein;
      case 'fat':
        return colors.nutrition.fat;
      case 'carbs':
        return colors.nutrition.carbs;
      case 'calories':
        return colors.primary.main;
      default:
        return colors.text.primary;
    }
  };

  // 栄養素タイプに応じた単位
  const getUnit = (): string => {
    if (unit) return unit;
    return nutrientType === 'calories' ? 'kcal' : 'g';
  };

  // 達成率に応じた背景色の透明度
  const getBackgroundColor = (): string => {
    if (customBackgroundColor) return customBackgroundColor;
    
    const baseColor = getNutrientColor();
    if (percentage >= 100) return baseColor + '30';
    if (percentage >= 80) return baseColor + '20';
    return baseColor + '10';
  };

  return (
    <CircularProgress
      size={size}
      strokeWidth={strokeWidth}
      progress={percentage}
      color={getNutrientColor()}
      backgroundColor={getBackgroundColor()}
      {...props}
    >
      <View style={styles.nutritionContent}>
        <Text style={[styles.nutritionValue, { color: getTextColor() }]}>
          {Math.round(current)}{showUnit && getUnit()}
        </Text>
        <Text style={[styles.nutritionTarget, { color: colors.text.secondary }]}>
          /{target}{showUnit && getUnit()}
        </Text>
        {percentage >= 100 && (
          <View style={[styles.completedBadge, { backgroundColor: getNutrientColor() }]}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
      </View>
    </CircularProgress>
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
  svgStyle: {
    transform: [{ rotateZ: '0deg' }],
  },
  circularContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary + 'F5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 55,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.md * 1.1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nutritionTarget: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    lineHeight: typography.fontSize.sm * 1.1,
    textAlign: 'center',
    marginTop: 2,
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.status.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
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