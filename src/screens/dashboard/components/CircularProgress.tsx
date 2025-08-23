import React, { useRef } from 'react';
import { View, Animated } from 'react-native';
import { CircularProgressProps } from '../types/dashboard.types';

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  size, 
  strokeWidth, 
  progress, 
  color, 
  backgroundColor = '#ffffff30', 
  children 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {/* 背景の円 */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />

      {/* プログレス円 */}
      <View style={{ position: 'absolute', width: size, height: size, overflow: 'hidden' }}>
        {/* 左半分（0-50%）*/}
        {progress > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              left: size / 2,
              width: size / 2,
              height: size,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderRightColor: color,
                transform: [
                  { rotate: '0deg' },
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 50],
                      outputRange: ['0deg', '180deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                marginLeft: -size / 2,
              }}
            />
          </Animated.View>
        )}

        {/* 右半分（50-100%）*/}
        {progress > 50 && (
          <Animated.View
            style={{
              position: 'absolute',
              right: size / 2,
              width: size / 2,
              height: size,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderLeftColor: color,
                transform: [
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [50, 100],
                      outputRange: ['0deg', '180deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                marginRight: -size / 2,
              }}
            />
          </Animated.View>
        )}
      </View>

      {/* 中央のコンテンツ */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
};