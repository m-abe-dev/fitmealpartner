import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { FoodLogItem } from '../types/nutrition.types';
import FoodRepository from '../../../services/database/repositories/FoodRepository';

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface UseFoodManagementProps {
  addFood: (food: Omit<FoodLogItem, 'id' | 'meal' | 'time' | 'foodId'> & { foodId?: string }) => Promise<void>;
  updateFood: (updatedFood: FoodLogItem) => Promise<void>;
  deleteFood: (foodId: string) => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
}

export const useFoodManagement = ({
  addFood,
  updateFood,
  deleteFood,
  toggleFavorite,
}: UseFoodManagementProps) => {
  const [showAddFood, setShowAddFood] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodLogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const registerFoodInDatabase = useCallback(async (food: Food) => {
    try {
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
      } else if (food.id.startsWith('jfc_')) {
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
    } catch (error) {
      console.error('Error registering food in database:', error);
      throw error;
    }
  }, []);

  const handleAddFood = useCallback(async (food: Food) => {
    try {
      await registerFoodInDatabase(food);
      
      await addFood({
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
  }, [addFood, registerFoodInDatabase]);

  const handleEditFood = useCallback((food: FoodLogItem) => {
    setEditingFood(food);
    setShowAddFood(true);
  }, []);

  const handleSelectMeal = useCallback((mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setShowAddFood(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddFood(false);
    setEditingFood(null);
  }, []);

  return {
    // State
    showAddFood,
    setShowAddFood,
    editingFood,
    setEditingFood,
    searchQuery,
    setSearchQuery,
    
    // Handlers
    handleAddFood,
    handleEditFood,
    handleSelectMeal,
    handleCloseModal,
    
    // Original handlers (passed through)
    updateFood,
    deleteFood,
    toggleFavorite,
  };
};