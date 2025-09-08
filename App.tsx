import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './src/navigation/AppNavigator';
import { LoadingScreen } from './src/components/LoadingScreen';
import { NotificationPermissionModal } from './src/components/NotificationPermissionModal';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { useNotificationPermission } from './src/hooks/useNotificationPermission';

// スプラッシュスクリーンを保持
SplashScreen.preventAutoHideAsync();

export default function App() {
  // カスタムフックでロジックを分離
  const { isReady } = useAppInitialization();
  const { showPermissionModal, handleCloseModal, handlePermissionGranted } = useNotificationPermission(isReady);

  // ローディング中はローディング画面を表示
  if (!isReady) {
    return <LoadingScreen />;
  }

  // メインアプリUIを表示
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
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
