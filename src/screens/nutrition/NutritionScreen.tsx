import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple } from 'lucide-react-native';

import { colors } from '../../design-system';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { AppRefreshControl } from '../../components/common/AppRefreshControl';
import { NutritionScoreCard } from './components/NutritionScoreCard';
import { MealLogCard } from './components/MealLogCard';
import { AddFoodModal } from './components/AddFoodModal';
import { useNutritionScreen } from './hooks/useNutritionScreen';

export const NutritionScreen: React.FC = () => {
  const {
    // Data
    foodLog,
    selectedMeal,
    nutritionData,
    scores,
    mealTabs,
    refreshing,

    // Food Management State
    showAddFood,
    editingFood,
    searchQuery,
    setSearchQuery,

    // Food Management Handlers
    handleAddFood,
    handleEditFood,
    handleSelectMeal,
    handleCloseModal,
    updateFood,
    deleteFood,
    toggleFavorite,

    // Other Handlers
    onRefresh,
    handleShare,
  } = useNutritionScreen();

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
          <AppRefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
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
        onClose={handleCloseModal}
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