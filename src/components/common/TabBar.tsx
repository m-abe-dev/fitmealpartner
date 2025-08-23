import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors, typography, spacing, shadows, radius } from '../../design-system';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  style?: ViewStyle;
  variant?: 'default' | 'pills' | 'underline';
  position?: 'top' | 'bottom';
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  style,
  variant = 'default',
  position = 'bottom',
}) => {
  const [indicatorPosition] = React.useState(new Animated.Value(0));
  const tabWidth = 100 / tabs.length;

  React.useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab, tabs, tabWidth, indicatorPosition]);

  const containerStyles = [
    styles.container,
    styles[variant],
    position === 'top' && styles.topPosition,
    style,
  ];

  return (
    <View style={containerStyles}>
      {variant === 'underline' && (
        <Animated.View
          style={[
            styles.underlineIndicator,
            {
              left: indicatorPosition.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              width: `${tabWidth}%`,
            },
          ]}
        />
      )}
      
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const tabStyles = [
          styles.tab,
          variant === 'pills' && styles.pillTab,
          isActive && styles.activeTab,
          variant === 'pills' && isActive && styles.activePillTab,
        ];

        const textStyles = [
          styles.tabText,
          isActive && styles.activeTabText,
          variant === 'pills' && isActive && styles.activePillText,
        ];

        return (
          <TouchableOpacity
            key={tab.id}
            style={tabStyles}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {tab.icon && (
                <View style={styles.iconContainer}>
                  {tab.icon}
                </View>
              )}
              
              <Text style={textStyles} numberOfLines={1}>
                {tab.label}
              </Text>
              
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            
            {variant === 'default' && isActive && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Segmented Control Component
interface SegmentedControlProps {
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onChange,
  style,
}) => {
  const [indicatorPosition] = React.useState(new Animated.Value(0));
  const segmentWidth = 100 / options.length;

  React.useEffect(() => {
    const activeIndex = options.findIndex(option => option.value === selectedValue);
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * segmentWidth,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [selectedValue, options, segmentWidth, indicatorPosition]);

  return (
    <View style={[styles.segmentedContainer, style]}>
      <Animated.View
        style={[
          styles.segmentedIndicator,
          {
            left: indicatorPosition.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            width: `${segmentWidth}%`,
          },
        ]}
      />
      
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.segment}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isActive && styles.activeSegmentText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // TabBar Styles
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
  },
  default: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingVertical: spacing.xs,
  },
  pills: {
    backgroundColor: colors.background.secondary,
    padding: spacing.xxs,
    borderRadius: radius.lg,
    margin: spacing.sm,
  },
  underline: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    position: 'relative',
  },
  topPosition: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  pillTab: {
    borderRadius: radius.md,
    margin: spacing.xxxs,
  },
  activeTab: {
    backgroundColor: colors.primary[50],
  },
  activePillTab: {
    backgroundColor: colors.primary.main,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    marginBottom: spacing.xxxs,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.semibold,
  },
  activePillText: {
    color: colors.text.inverse,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -spacing.md,
    width: spacing.xl,
    height: 2,
    backgroundColor: colors.primary.main,
    borderRadius: radius.sm,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary.main,
    borderRadius: radius.sm,
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: colors.status.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs - 2,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  
  // Segmented Control Styles
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.xxs,
    position: 'relative',
    ...shadows.sm,
  },
  segmentedIndicator: {
    position: 'absolute',
    top: spacing.xxs,
    bottom: spacing.xxs,
    backgroundColor: colors.background.primary,
    borderRadius: radius.sm,
    ...shadows.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activeSegmentText: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semibold,
  },
});