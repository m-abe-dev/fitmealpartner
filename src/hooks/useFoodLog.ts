import { useState, useCallback } from 'react';
import { FoodLogItem } from '../components/nutrition/MealLogCard';

export interface UseFoodLogReturn {
  foodLog: FoodLogItem[];
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  editingFood: FoodLogItem | null;
  setSelectedMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  setEditingFood: (food: FoodLogItem | null) => void;
  addFood: (food: Omit<FoodLogItem, 'id' | 'meal' | 'time'>) => void;
  updateFood: (updatedFood: FoodLogItem) => void;
  deleteFood: (foodId: string) => void;
  toggleFavorite: (foodId: string) => void;
}

export const useFoodLog = (): UseFoodLogReturn => {
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [editingFood, setEditingFood] = useState<FoodLogItem | null>(null);

  // TODO: 将来的にはローカルDBやAPIから取得する
  const [foodLog, setFoodLog] = useState<FoodLogItem[]>([
    {
      id: '1',
      name: '鶏胸肉（皮なし）',
      amount: 150,
      unit: 'g',
      calories: 165,
      protein: 33,
      fat: 2,
      carbs: 0,
      meal: 'lunch',
      time: '12:30',
    },
    {
      id: '2',
      name: '白米（炊飯済み）',
      amount: 200,
      unit: 'g',
      calories: 312,
      protein: 5,
      fat: 1,
      carbs: 74,
      meal: 'lunch',
      time: '12:30',
    },
    {
      id: '3',
      name: 'ブロッコリー',
      amount: 100,
      unit: 'g',
      calories: 33,
      protein: 4,
      fat: 0,
      carbs: 5,
      meal: 'lunch',
      time: '12:30',
    },
    {
      id: '4',
      name: 'ホエイプロテイン',
      amount: 30,
      unit: 'g',
      calories: 117,
      protein: 24,
      fat: 2,
      carbs: 2,
      meal: 'snack',
      time: '15:00',
    },
    {
      id: '5',
      name: 'バナナ',
      amount: 120,
      unit: 'g',
      calories: 103,
      protein: 1,
      fat: 0,
      carbs: 27,
      meal: 'snack',
      time: '10:00',
    }
  ]);

  const addFood = useCallback((food: Omit<FoodLogItem, 'id' | 'meal' | 'time'>) => {
    const newFoodItem: FoodLogItem = {
      ...food,
      id: Date.now().toString(),
      meal: selectedMeal,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    };

    setFoodLog(prev => [...prev, newFoodItem]);
  }, [selectedMeal]);

  const updateFood = useCallback((updatedFood: FoodLogItem) => {
    setFoodLog(prev => prev.map(food =>
      food.id === updatedFood.id ? updatedFood : food
    ));
    setEditingFood(null);
  }, []);

  const deleteFood = useCallback((foodId: string) => {
    setFoodLog(prev => prev.filter(food => food.id !== foodId));
  }, []);

  const toggleFavorite = useCallback((foodId: string) => {
    setFoodLog(prev => prev.map(food =>
      food.id === foodId ? { ...food, isFavorite: !food.isFavorite } : food
    ));
  }, []);

  return {
    foodLog,
    selectedMeal,
    editingFood,
    setSelectedMeal,
    setEditingFood,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
  };
};