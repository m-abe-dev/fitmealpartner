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
        // データベース初期化
        await DatabaseService.initialize();

        // 通知の初期設定（リスナーは設定しない）
        // NotificationServiceの初期化のみ
        
        // 少し待機（スプラッシュ画面の最小表示時間）
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsReady(true);
        // SplashScreen.hideAsync()を削除 - App.tsxで制御
      }
    }

    prepare();
  }, []);

  return { isReady };
};