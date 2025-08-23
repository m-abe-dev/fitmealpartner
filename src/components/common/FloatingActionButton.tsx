import React from 'react';
import { 
  TouchableOpacity, 
  View, 
  Text,
  StyleSheet, 
  ViewStyle, 
  Animated, 
  Dimensions 
} from 'react-native';
import { colors, shadows, radius, spacing } from '../../design-system';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  disabled?: boolean;
  position?: 'bottomRight' | 'bottomLeft' | 'bottomCenter';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  style,
  size = 'medium',
  color = colors.primary.main,
  disabled = false,
  position = 'bottomRight',
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const fabStyles = [
    styles.base,
    styles[size],
    styles[position],
    { backgroundColor: color },
    disabled && styles.disabled,
    style,
  ];

  return (
    <Animated.View 
      style={[
        fabStyles,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Extended FAB with menu items
interface ExtendedFABProps {
  mainAction: {
    onPress: () => void;
    icon: React.ReactNode;
  };
  actions: Array<{
    onPress: () => void;
    icon: React.ReactNode;
    label?: string;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  style?: ViewStyle;
  color?: string;
}

export const ExtendedFAB: React.FC<ExtendedFABProps> = ({
  mainAction,
  actions,
  isOpen,
  onToggle,
  style,
  color = colors.primary.main,
}) => {
  const [rotateAnim] = React.useState(new Animated.Value(0));
  const [scaleAnims] = React.useState(
    actions.map(() => new Animated.Value(0))
  );

  React.useEffect(() => {
    // Rotate main button
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Scale action items
    if (isOpen) {
      Animated.stagger(50, 
        scaleAnims.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      Animated.parallel(
        scaleAnims.map(anim => 
          Animated.timing(anim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [isOpen, rotateAnim, scaleAnims]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[styles.extendedContainer, style]}>
      {/* Action Items */}
      {actions.map((action, index) => (
        <Animated.View
          key={index}
          style={[
            styles.actionItem,
            {
              transform: [{ scale: scaleAnims[index] }],
              bottom: 70 + (index * 60),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: color }]}
            onPress={() => {
              action.onPress();
              onToggle();
            }}
            activeOpacity={0.8}
          >
            {action.icon}
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onToggle}
          activeOpacity={1}
        />
      )}

      {/* Main FAB */}
      <Animated.View 
        style={[
          styles.mainFab,
          { backgroundColor: color, transform: [{ rotate: rotation }] }
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          {mainAction.icon}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Speed Dial FAB
interface SpeedDialFABProps {
  actions: Array<{
    onPress: () => void;
    icon: React.ReactNode;
    label: string;
    color?: string;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  mainIcon: React.ReactNode;
  style?: ViewStyle;
}

export const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({
  actions,
  isOpen,
  onToggle,
  mainIcon,
  style,
}) => {
  const screenHeight = Dimensions.get('window').height;
  
  return (
    <View style={[styles.speedDialContainer, style]}>
      {isOpen && (
        <>
          {/* Backdrop */}
          <TouchableOpacity
            style={[styles.speedDialBackdrop, { height: screenHeight }]}
            onPress={onToggle}
            activeOpacity={0.3}
          />
          
          {/* Action Items */}
          <View style={styles.speedDialActions}>
            {actions.map((action, index) => (
              <View key={index} style={styles.speedDialItem}>
                <View style={styles.speedDialLabel}>
                  <Text style={styles.speedDialLabelText}>
                    {action.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.speedDialAction,
                    { backgroundColor: action.color || colors.background.primary }
                  ]}
                  onPress={() => {
                    action.onPress();
                    onToggle();
                  }}
                  activeOpacity={0.8}
                >
                  {action.icon}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Main FAB */}
      <FloatingActionButton
        onPress={onToggle}
        icon={mainIcon}
        size="large"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    ...shadows.lg,
  },
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    width: 40,
    height: 40,
  },
  medium: {
    width: 56,
    height: 56,
  },
  large: {
    width: 64,
    height: 64,
  },
  bottomRight: {
    bottom: spacing.xl,
    right: spacing.xl,
  },
  bottomLeft: {
    bottom: spacing.xl,
    left: spacing.xl,
  },
  bottomCenter: {
    bottom: spacing.xl,
    alignSelf: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Extended FAB Styles
  extendedContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  actionItem: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  
  // Speed Dial Styles
  speedDialContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
  },
  speedDialBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  speedDialActions: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    alignItems: 'flex-end',
  },
  speedDialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  speedDialLabel: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  speedDialLabelText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  speedDialAction: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});