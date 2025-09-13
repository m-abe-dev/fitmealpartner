import 'react-native-gesture-handler';
import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import AppNavigator from './src/navigation/AppNavigator';
import { LoadingScreen } from './src/components/LoadingScreen';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import NotificationService from './src/services/NotificationService';
import { NotificationData, isNotificationData } from './src/types/notification.types';

// スプラッシュスクリーンを保持
SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const { isReady } = useAppInitialization();

  // SplashScreenを非表示にする
  useEffect(() => {
    async function hideSplash() {
      if (isReady) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isReady]);

  // 通知リスナーの設定
  useEffect(() => {
    if (!isReady) return;

    NotificationService.setupNotificationListeners(
      (notification) => {
        // 通知受信時（アプリがフォアグラウンド）
      },
      (response) => {
        // 通知タップ時の画面遷移処理

        const rawData = response.notification.request.content.data;

        if (!rawData || !isNotificationData(rawData)) {
          return;
        }

        const notificationData = rawData as NotificationData;
        const screen = notificationData.screen;

        if (screen && navigationRef.current?.isReady()) {

          // タブナビゲーターの画面に遷移
          switch (screen) {
            case 'Nutrition':
              navigationRef.current.navigate('Nutrition', {
                mealType: notificationData.mealType,
                proteinGap: notificationData.proteinGap,
                fromNotification: true,
              });
              break;
            case 'Workout':
              navigationRef.current.navigate('Workout', {
                fromNotification: true,
              });
              break;
            case 'Dashboard':
              navigationRef.current.navigate('Dashboard', {
                fromNotification: true,
              });
              break;
            case 'Profile':
              navigationRef.current.navigate('Profile', {
                fromNotification: true,
              });
              break;
            default:
          }
        } else {
        }
      }
    );

    // クリーンアップ関数
    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, [isReady]);

  // ローディング中はローディング画面を表示
  if (!isReady) {
    return <LoadingScreen />;
  }

  // メインアプリUIを表示
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
