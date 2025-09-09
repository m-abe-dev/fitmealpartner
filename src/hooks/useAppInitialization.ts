import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import DatabaseService from '../services/database/DatabaseService';
import NotificationService from '../services/NotificationService';

export const useAppInitialization = () => {
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

        // 通知リスナーの設定
        NotificationService.setupNotificationListeners(
          undefined,
          (response) => {
            // 通知タップ時の画面遷移
            const screen = response.notification.request.content.data?.screen;
            if (screen) {
              // ナビゲーション処理
              console.log('Navigate to:', screen);
            }
          }
        );

        // 少し待機（スプラッシュ画面の最小表示時間）
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        // エラーが発生してもアプリを起動
        setIsReady(true);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();

    // クリーンアップ
    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, []);

  return { isReady };
};