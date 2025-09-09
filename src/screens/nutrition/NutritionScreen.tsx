import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple } from 'lucide-react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { colors } from '../../design-system';
import { NotificationData, NavigationParams, RootStackParamList, isNotificationData } from '../../types/notification.types';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { NutritionScoreCard } from './components/NutritionScoreCard';
import { MealLogCard } from './components/MealLogCard';
import { AddFoodModal } from './components/AddFoodModal';
import { useNutritionData } from '../../hooks/useNutritionData';
import { useFoodLog } from '../../hooks/useFoodLog';
import { useProfileData } from '../../hooks/useProfileData';
import { MealTab, FoodLogItem } from './types/nutrition.types';
import FoodRepository from '../../services/database/repositories/FoodRepository';

type NutritionScreenRouteProp = RouteProp<RootStackParamList, 'Nutrition'>;

export const NutritionScreen: React.FC = () => {
  const route = useRoute<NutritionScreenRouteProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // プロフィールデータから動的な目標値を取得
  const { nutritionTargets } = useProfileData();

  // カスタムフックを使用
  const {
    foodLog,
    selectedMeal,
    editingFood,
    isLoading,
    setSelectedMeal,
    setEditingFood,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
  } = useFoodLog();

  // foodLogと動的な目標値を使って栄養データを計算
  const { nutritionData, scores } = useNutritionData(foodLog, nutritionTargets);


  const mealTabs: MealTab[] = [
    { id: 'breakfast', label: '朝食', icon: '🌅' },
    { id: 'lunch', label: '昼食', icon: '🌞' },
    { id: 'dinner', label: '夕食', icon: '🌙' },
    { id: 'snack', label: '間食', icon: '🍎' }
  ];

  // 通知から遷移してきた場合の処理
  useFocusEffect(
    useCallback(() => {
      const checkNotificationNavigation = async () => {
        // route.paramsから通知データをチェック
        const params = route.params;
        
        if (params?.fromNotification && params?.mealType) {
          // 指定された食事タイプに合わせて遷移
          const mealType = params.mealType;
          setSelectedMeal(mealType);
          setShowAddFood(true); // 食材追加モーダルを開く
          
          // タンパク質不足の情報がある場合はアラートで表示
          if (typeof params.proteinGap === 'number' && params.proteinGap > 0) {
            setTimeout(() => {
              Alert.alert(
                '🍽️ タンパク質不足のお知らせ',
                `あと${Math.round(params.proteinGap!)}gのタンパク質が必要です。\n\nプロテインや高タンパク食品を摂って目標達成しましょう！`,
                [
                  {
                    text: 'OK',
                    style: 'default',
                  },
                ]
              );
            }, 500); // モーダルが開いてからアラートを表示
          }
        }
        
        // 最後の通知レスポンスをチェック（フォールバック）
        try {
          const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
          const notificationData = lastNotificationResponse?.notification.request.content.data;
          
          if (notificationData && isNotificationData(notificationData) && notificationData.type === 'protein_reminder') {
            if (notificationData.mealType && !params?.fromNotification) {
              const mealType = notificationData.mealType;
              setSelectedMeal(mealType);
              setShowAddFood(true);
              
              if (typeof notificationData.proteinGap === 'number' && notificationData.proteinGap > 0) {
                setTimeout(() => {
                  Alert.alert(
                    '🍽️ タンパク質不足のお知らせ',
                    `あと${Math.round(notificationData.proteinGap!)}gのタンパク質が必要です。\n\nプロテインや高タンパク食品を摂って目標達成しましょう！`,
                    [{ text: 'OK' }]
                  );
                }, 500);
              }
              
              // 使用済みの通知レスポンスをクリア（実際のAPIは存在しないためコメントアウト）
              // await Notifications.clearLastNotificationResponseAsync();
            }
          }
        } catch (error) {
          console.log('Error checking last notification response:', error);
        }
      };

      checkNotificationNavigation();
    }, [route.params, setSelectedMeal])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // 通知データのクリア
  useEffect(() => {
    // コンポーネントがアンマウントされる時に通知データをクリア
    return () => {
      // クリーンアップ処理が必要であればここに追加
    };
  }, []);

  // 食材追加ハンドラー
  const handleAddFood = async (food: { id: string; name: string; calories: number; protein: number; fat: number; carbs: number; }) => {
    try {
      // 手入力された食材の場合、food_dbに登録
      if (food.id.startsWith('manual_')) {
        await FoodRepository.addFood({
          food_id: food.id,
          name_ja: food.name,
          name_en: food.name,
          category: '手入力',
          p100: food.protein,
          f100: food.fat,
          c100: food.carbs,
          kcal100: food.calories,
          source: 'manual',
          is_favorite: false
        });
      }
      // 日本食品成分表からの食品の場合
      else if (food.id.startsWith('jfc_')) {
        await FoodRepository.addFood({
          food_id: food.id,
          name_ja: food.name,
          name_en: food.name,
          category: '日本食品成分表',
          p100: food.protein,
          f100: food.fat,
          c100: food.carbs,
          kcal100: food.calories,
          source: 'jfc',
          is_favorite: false
        });
      }

      // FoodRepository.logFoodを削除（useFoodLogStore.addFoodで処理される）

      // UIの食事ログに追加（これがDBへの保存も行う）
      addFood({
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        fat: food.fat,
        carbs: food.carbs,
        foodId: food.id,
        amount: 100,
        unit: 'g',
      });
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('エラー', '食材の追加に失敗しました');
    }
  };

  // 食事タイプ選択ハンドラー
  const handleSelectMeal = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedMeal(mealType);
    setShowAddFood(true);
  };

  // 食材編集ハンドラー
  const handleEditFood = (food: FoodLogItem) => {
    setEditingFood(food);
    setShowAddFood(true);
  };

  // シェアハンドラー
  const handleShare = () => {
    // Share functionality to be implemented
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="今日の食事"
        icon={<Apple size={24} color={colors.primary.main} />}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 栄養進歩カード */}
        <NutritionScoreCard
          nutritionData={nutritionData}
          scores={scores}
        />


        {/* 食事ログ */}
        <MealLogCard
          foodLog={foodLog}
          mealTabs={mealTabs}
          onAddFood={handleSelectMeal}
          onEditFood={handleEditFood}
          onDeleteFood={deleteFood}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
        />
      </ScrollView>

      {/* 食品追加モーダル */}
      <AddFoodModal
        isVisible={showAddFood}
        onClose={() => {
          setShowAddFood(false);
          setEditingFood(null);
        }}
        selectedMeal={selectedMeal}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onAddFood={handleAddFood}
        editingFood={editingFood}
        onUpdateFood={updateFood}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
  },
});