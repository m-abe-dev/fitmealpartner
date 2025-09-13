import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { RootStackParamList, isNotificationData } from '../../../types/notification.types';

type NutritionScreenRouteProp = RouteProp<RootStackParamList, 'Nutrition'>;

interface UseNotificationNavigationProps {
  setSelectedMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  setShowAddFood: (show: boolean) => void;
}

export const useNotificationNavigation = ({
  setSelectedMeal,
  setShowAddFood,
}: UseNotificationNavigationProps) => {
  const route = useRoute<NutritionScreenRouteProp>();

  const showProteinAlert = useCallback((proteinGap: number) => {
    setTimeout(() => {
      Alert.alert(
        '🍽️ タンパク質不足のお知らせ',
        `あと${Math.round(proteinGap)}gのタンパク質が必要です。\n\nプロテインや高タンパク食品を摂って目標達成しましょう！`,
        [{ text: 'OK', style: 'default' }]
      );
    }, 500);
  }, []);

  const handleNotificationNavigation = useCallback(
    (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', proteinGap?: number) => {
      setSelectedMeal(mealType);
      setShowAddFood(true);
      
      if (typeof proteinGap === 'number' && proteinGap > 0) {
        showProteinAlert(proteinGap);
      }
    },
    [setSelectedMeal, setShowAddFood, showProteinAlert]
  );

  useFocusEffect(
    useCallback(() => {
      const checkNotificationNavigation = async () => {
        try {
          // route.paramsから通知データをチェック
          const params = route.params;
          
          if (params?.fromNotification && params?.mealType) {
            handleNotificationNavigation(params.mealType, params.proteinGap);
            return;
          }
          
          // 最後の通知レスポンスをチェック（フォールバック）
          const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
          const notificationData = lastNotificationResponse?.notification.request.content.data;
          
          if (
            notificationData && 
            isNotificationData(notificationData) && 
            notificationData.type === 'protein_reminder' &&
            notificationData.mealType &&
            !params?.fromNotification
          ) {
            handleNotificationNavigation(notificationData.mealType, notificationData.proteinGap);
          }
        } catch (error) {
        }
      };

      checkNotificationNavigation();
    }, [route.params, handleNotificationNavigation])
  );
};