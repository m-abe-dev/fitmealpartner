import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { colors, typography, radius, spacing, shadows } from '../../design-system';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50;

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
  title?: string;
  showHandle?: boolean;
  enablePanGesture?: boolean;
  backdropOpacity?: number;
  style?: any;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  snapPoints = ['50%'],
  title,
  showHandle = true,
  enablePanGesture = true,
  backdropOpacity = 0.5,
  style,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity_ = useRef(new Animated.Value(0)).current;
  
  const lastGestureY = useRef(0);

  useEffect(() => {
    if (isVisible) {
      showBottomSheet();
    } else {
      hideBottomSheet();
    }
  }, [isVisible]);

  const showBottomSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: MAX_TRANSLATE_Y,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity_, {
        toValue: backdropOpacity,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideBottomSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity_, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePanGesture = (gestureState: any) => {
    if (!enablePanGesture) return;

    const { dy, vy } = gestureState;
    const shouldClose = dy > SCREEN_HEIGHT * 0.3 || vy > 500;
    
    if (shouldClose) {
      onClose();
    } else {
      Animated.spring(translateY, {
        toValue: MAX_TRANSLATE_Y,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity_ },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY }],
            },
            style,
          ]}
        >
          {/* Handle */}
          {showHandle && (
            <TouchableOpacity 
              style={styles.handleContainer}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <View style={styles.handle} />
            </TouchableOpacity>
          )}

          {/* Header */}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Draggable Bottom Sheet Hook
export const useDraggableBottomSheet = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);
  
  return {
    isVisible,
    show,
    hide,
  };
};

// Bottom Sheet with Snap Points
interface SnapBottomSheetProps extends Omit<BottomSheetProps, 'snapPoints'> {
  snapPoints: number[]; // Array of heights (0-1 representing percentage of screen)
  initialSnap?: number;
}

export const SnapBottomSheet: React.FC<SnapBottomSheetProps> = ({
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  ...props
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [currentSnapIndex, setCurrentSnapIndex] = React.useState(initialSnap);

  const snapToPoint = (index: number) => {
    const snapPoint = snapPoints[index];
    const targetY = -SCREEN_HEIGHT * snapPoint + 50;
    
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    setCurrentSnapIndex(index);
  };

  const handleSnapGesture = (gestureState: any) => {
    if (!props.enablePanGesture) return;

    const { dy, vy } = gestureState;
    
    // Find closest snap point
    const currentY = Math.abs(dy);
    let closestIndex = 0;
    let closestDistance = Math.abs(currentY - snapPoints[0] * SCREEN_HEIGHT);

    snapPoints.forEach((point, index) => {
      const distance = Math.abs(currentY - point * SCREEN_HEIGHT);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Consider velocity for snapping
    if (vy > 500 && currentSnapIndex > 0) {
      closestIndex = Math.max(0, currentSnapIndex - 1);
    } else if (vy < -500 && currentSnapIndex < snapPoints.length - 1) {
      closestIndex = Math.min(snapPoints.length - 1, currentSnapIndex + 1);
    }

    if (closestIndex === 0 && dy > SCREEN_HEIGHT * 0.3) {
      props.onClose();
    } else {
      snapToPoint(closestIndex);
    }
  };

  React.useEffect(() => {
    if (props.isVisible) {
      snapToPoint(initialSnap);
    }
  }, [props.isVisible, initialSnap]);

  return (
    <BottomSheet
      {...props}
      style={[
        props.style,
        { transform: [{ translateY }] },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: radius.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});