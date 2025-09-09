import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';

interface UseNotificationPermissionReturn {
  showPermissionModal: boolean;
  handleCloseModal: () => void;
  handlePermissionGranted: () => void;
}

export const useNotificationPermission = (isAppReady: boolean): UseNotificationPermissionReturn => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    if (!isAppReady) return;

    // アプリが準備完了してから通知許可をチェック
    const timer = setTimeout(() => {
      checkNotificationPermission();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAppReady]);

  const checkNotificationPermission = async () => {
    try {
      const hasPermission = await NotificationService.checkPermissions();
      const hasAsked = await AsyncStorage.getItem('hasAskedNotificationPermission');
      
      if (!hasPermission && !hasAsked) {
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const handleCloseModal = async () => {
    try {
      setShowPermissionModal(false);
      await AsyncStorage.setItem('hasAskedNotificationPermission', 'true');
    } catch (error) {
      console.error('Error saving notification permission flag:', error);
    }
  };

  const handlePermissionGranted = () => {
    console.log('Notification permission granted');
    // 必要に応じて追加の処理を実行
  };

  return {
    showPermissionModal,
    handleCloseModal,
    handlePermissionGranted,
  };
};