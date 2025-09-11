import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFoodLog } from '../../../hooks/useFoodLog';
import { useNutritionData } from '../../../hooks/useNutritionData';
import { useProfileData } from '../../../hooks/useProfileData';
import { useNotificationNavigation } from './useNotificationNavigation';
import { useFoodManagement } from './useFoodManagement';
import { MealTab } from '../types/nutrition.types';
import { AIFeedbackService } from '../../../services/AIFeedbackService';
import { useFoodLogStore } from '../../../stores/foodLogStore';

export const useNutritionScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const refreshCountRef = useRef(0);

  // ストア
  const foodLogStore = useFoodLogStore();

  // プロフィールデータから動的な目標値を取得
  const { nutritionTargets, userProfile } = useProfileData();

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
    try {
      refreshCountRef.current++;
      console.log(`🔄 Nutrition refresh #${refreshCountRef.current}`);
      setRefreshing(true);
      
      // 1. データベースから最新の食事ログを再読み込み
      await foodLogStore.loadTodaysFoodLog();
      
      // 2. 栄養データがある場合、AIフィードバックを更新
      if (nutritionData.calories.current > 0) {
        const aiProfile = {
          age: userProfile?.age || 30,
          weight: userProfile?.weight || 70,
          height: userProfile?.height || 175,
          goal: userProfile?.goal || 'maintain',
          activityLevel: 'moderate',
          gender: userProfile?.gender || 'male',
        };

        const aiNutritionData = {
          calories: nutritionData.calories.current,
          protein: nutritionData.protein.current,
          carbs: nutritionData.carbs.current,
          fat: nutritionData.fat.current,
          targetCalories: nutritionTargets.calories,
          targetProtein: nutritionTargets.protein,
          targetCarbs: nutritionTargets.carbs,
          targetFat: nutritionTargets.fat,
          meals: foodLog.map(item => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })),
        };

        await AIFeedbackService.getNutritionFeedback(aiNutritionData, aiProfile);
      }
      
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('エラー', 'データの更新に失敗しました');
    } finally {
      setRefreshing(false);
    }
  }, [nutritionData, foodLog, userProfile, nutritionTargets, foodLogStore]);

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