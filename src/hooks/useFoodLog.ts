import { useEffect } from 'react';
import { FoodLogItem } from '../screens/nutrition/types/nutrition.types';
import { useFoodLogStore } from '../stores/foodLogStore';

export interface UseFoodLogReturn {
  foodLog: FoodLogItem[];
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  editingFood: FoodLogItem | null;
  isLoading: boolean;
  setSelectedMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  setEditingFood: (food: FoodLogItem | null) => void;
  addFood: (food: Omit<FoodLogItem, 'id' | 'meal' | 'time' | 'foodId'> & { foodId?: string }) => Promise<void>;
  updateFood: (updatedFood: FoodLogItem) => Promise<void>;
  deleteFood: (foodId: string) => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
}

export const useFoodLog = (): UseFoodLogReturn => {
  const store = useFoodLogStore();

  // 初回マウント時にデータを読み込み
  useEffect(() => {
    store.loadTodaysFoodLog();
  }, []);

  // foodLog状態の変化をログ出力
  useEffect(() => {}, [store.foodLog]);

  return {
    foodLog: store.foodLog,
    selectedMeal: store.selectedMeal,
    editingFood: store.editingFood,
    isLoading: store.isLoading,
    setSelectedMeal: store.setSelectedMeal,
    setEditingFood: store.setEditingFood,
    addFood: store.addFood,
    updateFood: store.updateFood,
    deleteFood: store.deleteFood,
    toggleFavorite: store.toggleFavorite,
  };
};
