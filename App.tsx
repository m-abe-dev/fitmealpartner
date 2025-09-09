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
import { NotificationPermissionModal } from './src/components/NotificationPermissionModal';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { useNotificationPermission } from './src/hooks/useNotificationPermission';
import NotificationService from './src/services/NotificationService';
import { NotificationData, isNotificationData } from './src/types/notification.types';

// スプラッシュスクリーンを保持
SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  // カスタムフックでロジックを分離
  const { isReady } = useAppInitialization();
  const { showPermissionModal, handleCloseModal, handlePermissionGranted } = useNotificationPermission(isReady);

  // 通知リスナーの設定
  useEffect(() => {
    if (!isReady) return;

    NotificationService.setupNotificationListeners(
      (notification) => {
        // 通知受信時（アプリがフォアグラウンド）
        console.log('通知受信:', notification.request.content);
      },
      (response) => {
        // 通知タップ時の画面遷移処理
        console.log('通知タップ:', response.notification.request.content.data);
        
        const rawData = response.notification.request.content.data;
        
        if (!rawData || !isNotificationData(rawData)) {
          console.log('Invalid notification data:', rawData);
          return;
        }
        
        const notificationData = rawData as NotificationData;
        const screen = notificationData.screen;
        
        if (screen && navigationRef.current?.isReady()) {
          console.log(`画面遷移: ${screen}`);
          
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
              console.log('Unknown screen:', screen);
          }
        } else {
          console.log('Navigation not ready or no screen specified');
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
          <>
            <StatusBar style="auto" />
            <AppNavigator />
            
            <NotificationPermissionModal
              visible={showPermissionModal}
              onClose={handleCloseModal}
              onPermissionGranted={handlePermissionGranted}
            />
          </>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
