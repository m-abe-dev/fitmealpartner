import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Crown, Apple } from 'lucide-react-native';

import { colors, typography, spacing } from '../../design-system';
import { NutritionScoreCard } from '../../components/nutrition/NutritionScoreCard';
import { MealLogCard } from '../../components/nutrition/MealLogCard';
import { AddFoodModal } from '../../components/nutrition/AddFoodModal';
import { useNutritionData } from '../../hooks/useNutritionData';
import { useFoodLog } from '../../hooks/useFoodLog';

export const NutritionScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // カスタムフックを使用
  const { nutritionData, scores } = useNutritionData();
  const {
    foodLog,
    selectedMeal,
    editingFood,
    setSelectedMeal,
    setEditingFood,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
  } = useFoodLog();

  const mealTabs = [
    { id: 'breakfast', label: '朝食', icon: '🌅' },
    { id: 'lunch', label: '昼食', icon: '🌞' },
    { id: 'dinner', label: '夕食', icon: '🌙' },
    { id: 'snack', label: '間食', icon: '🍎' }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // 食材追加ハンドラー
  const handleAddFood = (food: { id: string; name: string; calories: number; protein: number; fat: number; carbs: number; }) => {
    addFood({
      ...food,
      amount: 100,
      unit: 'g',
    });
  };

  // 食事タイプ選択ハンドラー
  const handleSelectMeal = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedMeal(mealType);
    setShowAddFood(true);
  };

  // 食材編集ハンドラー
  const handleEditFood = (food: any) => {
    setEditingFood(food);
    setShowAddFood(true);
  };

  // シェアハンドラー
  const handleShare = () => {
    console.log('Share nutrition data');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
           <Apple size={24} color={colors.primary.main} />
           <Text style={styles.headerTitle}>今日の食事</Text>
           </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButton}>
            <Crown size={16} color={colors.primary.main} />
            <Text style={styles.proButtonText}>PRO</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: 20,
  },
  proButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});