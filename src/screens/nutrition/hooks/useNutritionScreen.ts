import { useState, useCallback } from 'react';
import { useFoodLog } from '../../../hooks/useFoodLog';
import { useNutritionData } from '../../../hooks/useNutritionData';
import { useProfileData } from '../../../hooks/useProfileData';
import { useNotificationNavigation } from './useNotificationNavigation';
import { useFoodManagement } from './useFoodManagement';
import { MealTab } from '../types/nutrition.types';

export const useNutritionScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  // プロフィールデータから動的な目標値を取得
  const { nutritionTargets } = useProfileData();

  // 食事ログデータ
  const foodLogHook = useFoodLog();
  const { 
    foodLog, 
    selectedMeal, 
    setSelectedMeal,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
  } = foodLogHook;

  // 栄養データ計算
  const { nutritionData, scores } = useNutritionData(foodLog, nutritionTargets);

  // 食材管理
  const foodManagement = useFoodManagement({
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
    selectedMeal,
    setSelectedMeal,
  });

  // 通知ナビゲーション
  useNotificationNavigation({
    setSelectedMeal: (meal) => {
      setSelectedMeal(meal);
      foodManagement.setShowAddFood(true);
    },
    setShowAddFood: foodManagement.setShowAddFood,
  });

  // リフレッシュハンドラー
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // シェアハンドラー
  const handleShare = useCallback(() => {
    // Share functionality to be implemented
  }, []);

  // 食事タブの定義
  const mealTabs: MealTab[] = [
    { id: 'breakfast', label: '朝食', icon: '🌅' },
    { id: 'lunch', label: '昼食', icon: '🌞' },
    { id: 'dinner', label: '夕食', icon: '🌙' },
    { id: 'snack', label: '間食', icon: '🍎' }
  ];

  return {
    // Data
    foodLog,
    selectedMeal,
    nutritionData,
    scores,
    mealTabs,
    refreshing,

    // Food Management
    ...foodManagement,

    // Handlers
    onRefresh,
    handleShare,
  };
};