import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing, radius } from '../../design-system';

interface MacroData {
  protein: { current: number; target: number; color?: string };
  fat: { current: number; target: number; color?: string };
  carbs: { current: number; target: number; color?: string };
  calories: { current: number; target: number; color?: string };
}

interface MacroDisplayProps {
  data: MacroData;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
  showLabels?: boolean;
  showValues?: boolean;
  variant?: 'circle' | 'donut' | 'progress';
}

export const MacroDisplay: React.FC<MacroDisplayProps> = ({
  data,
  size = 200,
  strokeWidth = 12,
  style,
  showLabels = true,
  showValues = true,
  variant = 'donut',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Default colors for macros
  const defaultColors = {
    protein: colors.nutrition.protein,
    fat: colors.nutrition.fat,
    carbs: colors.nutrition.carbs,
    calories: colors.nutrition.calories,
  };

  // Calculate percentages and segments
  const proteinPercent = Math.min((data.protein.current / data.protein.target) * 100, 100);
  const fatPercent = Math.min((data.fat.current / data.fat.target) * 100, 100);
  const carbsPercent = Math.min((data.carbs.current / data.carbs.target) * 100, 100);
  const caloriesPercent = Math.min((data.calories.current / data.calories.target) * 100, 100);

  // Calculate stroke dash arrays for progress rings
  const proteinStroke = (proteinPercent / 100) * circumference;
  const fatStroke = (fatPercent / 100) * circumference;
  const carbsStroke = (carbsPercent / 100) * circumference;
  const caloriesStroke = (caloriesPercent / 100) * circumference;

  if (variant === 'circle') {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.gray[200]}
            strokeWidth={strokeWidth}
          />
          
          {/* Calories Progress */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={data.calories.color || defaultColors.calories}
            strokeWidth={strokeWidth}
            strokeDasharray={`${caloriesStroke} ${circumference - caloriesStroke}`}
            strokeDashoffset={circumference / 4} // Start from top
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
          
          {/* Center Text */}
          <SvgText
            x={size / 2}
            y={size / 2 - 10}
            textAnchor="middle"
            fontSize={typography.fontSize['2xl']}
            fontFamily={typography.fontFamily.bold}
            fill={colors.text.primary}
          >
            {Math.round(caloriesPercent)}%
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 15}
            textAnchor="middle"
            fontSize={typography.fontSize.sm}
            fontFamily={typography.fontFamily.regular}
            fill={colors.text.secondary}
          >
            カロリー
          </SvgText>
        </Svg>
      </View>
    );
  }

  if (variant === 'progress') {
    return (
      <View style={[styles.progressContainer, style]}>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.macroLabel}>タンパク質</Text>
            <Text style={styles.macroValue}>
              {data.protein.current}g / {data.protein.target}g
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${proteinPercent}%`,
                  backgroundColor: data.protein.color || defaultColors.protein,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.macroLabel}>脂質</Text>
            <Text style={styles.macroValue}>
              {data.fat.current}g / {data.fat.target}g
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${fatPercent}%`,
                  backgroundColor: data.fat.color || defaultColors.fat,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.macroLabel}>炭水化物</Text>
            <Text style={styles.macroValue}>
              {data.carbs.current}g / {data.carbs.target}g
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${carbsPercent}%`,
                  backgroundColor: data.carbs.color || defaultColors.carbs,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.macroLabel}>カロリー</Text>
            <Text style={styles.macroValue}>
              {data.calories.current} / {data.calories.target} kcal
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${caloriesPercent}%`,
                  backgroundColor: data.calories.color || defaultColors.calories,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  // Default donut variant
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.donutContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.gray[100]}
            strokeWidth={strokeWidth}
          />
          
          {/* Protein Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth * 0.5}
            fill="none"
            stroke={data.protein.color || defaultColors.protein}
            strokeWidth={strokeWidth * 0.8}
            strokeDasharray={`${proteinStroke} ${circumference - proteinStroke}`}
            strokeDashoffset={circumference / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
          
          {/* Fat Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth * 1.5}
            fill="none"
            stroke={data.fat.color || defaultColors.fat}
            strokeWidth={strokeWidth * 0.6}
            strokeDasharray={`${fatStroke} ${circumference - fatStroke}`}
            strokeDashoffset={circumference / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
          
          {/* Carbs Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth * 2.5}
            fill="none"
            stroke={data.carbs.color || defaultColors.carbs}
            strokeWidth={strokeWidth * 0.6}
            strokeDasharray={`${carbsStroke} ${circumference - carbsStroke}`}
            strokeDashoffset={circumference / 4}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
          
          {/* Center Content */}
          <SvgText
            x={size / 2}
            y={size / 2 - 15}
            textAnchor="middle"
            fontSize={typography.fontSize['2xl']}
            fontFamily={typography.fontFamily.bold}
            fill={colors.text.primary}
          >
            {data.calories.current}
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 5}
            textAnchor="middle"
            fontSize={typography.fontSize.sm}
            fontFamily={typography.fontFamily.regular}
            fill={colors.text.secondary}
          >
            kcal
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 25}
            textAnchor="middle"
            fontSize={typography.fontSize.xs}
            fontFamily={typography.fontFamily.regular}
            fill={colors.text.tertiary}
          >
            目標: {data.calories.target}
          </SvgText>
        </Svg>
        
        {showLabels && (
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: data.protein.color || defaultColors.protein },
                ]}
              />
              <Text style={styles.legendText}>P: {data.protein.current}g</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: data.fat.color || defaultColors.fat },
                ]}
              />
              <Text style={styles.legendText}>F: {data.fat.current}g</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: data.carbs.color || defaultColors.carbs },
                ]}
              />
              <Text style={styles.legendText}>C: {data.carbs.current}g</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// Compact Macro Display for smaller spaces
interface CompactMacroDisplayProps {
  data: MacroData;
  style?: ViewStyle;
}

export const CompactMacroDisplay: React.FC<CompactMacroDisplayProps> = ({
  data,
  style,
}) => {
  const defaultColors = {
    protein: colors.nutrition.protein,
    fat: colors.nutrition.fat,
    carbs: colors.nutrition.carbs,
    calories: colors.nutrition.calories,
  };

  return (
    <View style={[styles.compactContainer, style]}>
      <View style={styles.compactRow}>
        <View style={styles.compactItem}>
          <View
            style={[
              styles.compactIndicator,
              { backgroundColor: defaultColors.protein },
            ]}
          />
          <Text style={styles.compactLabel}>P</Text>
          <Text style={styles.compactValue}>{data.protein.current}g</Text>
        </View>
        
        <View style={styles.compactItem}>
          <View
            style={[
              styles.compactIndicator,
              { backgroundColor: defaultColors.fat },
            ]}
          />
          <Text style={styles.compactLabel}>F</Text>
          <Text style={styles.compactValue}>{data.fat.current}g</Text>
        </View>
        
        <View style={styles.compactItem}>
          <View
            style={[
              styles.compactIndicator,
              { backgroundColor: defaultColors.carbs },
            ]}
          />
          <Text style={styles.compactLabel}>C</Text>
          <Text style={styles.compactValue}>{data.carbs.current}g</Text>
        </View>
        
        <View style={styles.compactItem}>
          <View
            style={[
              styles.compactIndicator,
              { backgroundColor: defaultColors.calories },
            ]}
          />
          <Text style={styles.compactLabel}>Cal</Text>
          <Text style={styles.compactValue}>{data.calories.current}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    position: 'absolute',
    bottom: -spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: radius.sm,
    marginRight: spacing.xxs,
  },
  legendText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  
  // Progress variant styles
  progressContainer: {
    gap: spacing.md,
  },
  progressItem: {
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  macroValue: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  
  // Compact variant styles
  compactContainer: {
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactItem: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  compactIndicator: {
    width: 8,
    height: 8,
    borderRadius: radius.sm,
  },
  compactLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  compactValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
});