import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import DatabaseService from './src/services/database/DatabaseService';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/design-system';

// スプラッシュスクリーンを保持
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // フォント読み込み（必要に応じて）
        // await Font.loadAsync({
        //   'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
        //   'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
        //   'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        // });

        // データベース初期化
        await DatabaseService.initialize();

        // 少し待機（スプラッシュ画面の最小表示時間）
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary
      }}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <>
            <StatusBar style="auto" />
            <AppNavigator />
          </>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
