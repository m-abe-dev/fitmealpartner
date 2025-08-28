import { useState, useCallback, useEffect } from 'react';
import { FoodLogItem } from '../screens/nutrition/types/nutrition.types';
import DatabaseService from '../services/database/DatabaseService';


export interface UseFoodLogReturn {
  foodLog: FoodLogItem[];
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  editingFood: FoodLogItem | null;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  const [foodLog, setFoodLog] = useState<FoodLogItem[]>([]);

  // 起動時にSQLiteからデータを読み込み
  useEffect(() => {
    loadTodaysFoodLog();
  }, []);

  const loadTodaysFoodLog = async () => {
    try {
      await DatabaseService.initialize();
      const today = new Date().toISOString().split('T')[0];
      const logs = await DatabaseService.getAllAsync<any>(
        'SELECT * FROM food_log WHERE date = ? ORDER BY logged_at',
        [today]
      );
      
      const mappedLogs: FoodLogItem[] = logs.map(log => ({
        id: log.id.toString(),
        foodId: log.food_id,
        name: log.food_name,
        amount: log.amount_g,
        unit: 'g',
        calories: log.kcal,
        protein: log.protein_g,
        fat: log.fat_g,
        carbs: log.carb_g,
        meal: log.meal_type,
        time: new Date(log.logged_at).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isFavorite: false
      }));
      
      setFoodLog(mappedLogs);
    } catch (error) {
      console.error('食事ログの読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFood = useCallback(async (food: Omit<FoodLogItem, 'id' | 'meal' | 'time'>) => {
    const newFoodItem: FoodLogItem = {
      ...food,
      id: Date.now().toString(),
      meal: selectedMeal,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      // SQLiteに保存
      const result = await DatabaseService.runAsync(
        `INSERT INTO food_log (
          user_id, date, meal_type, food_id, food_name, 
          amount_g, protein_g, fat_g, carb_g, kcal
        ) VALUES (?, date('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'guest',
          selectedMeal,
          food.foodId || null,
          food.name,
          food.amount,
          food.protein,
          food.fat,
          food.carbs,
          food.calories
        ]
      );

      // IDをSQLiteのauto incrementされたIDに更新
      newFoodItem.id = result.lastInsertRowId?.toString() || newFoodItem.id;

      // 状態を更新
      setFoodLog(prev => [...prev, newFoodItem]);
    } catch (error) {
      console.error('食事の保存エラー:', error);
      throw error;
    }
  }, [selectedMeal]);

  const updateFood = useCallback(async (updatedFood: FoodLogItem) => {
    try {
      // SQLiteを更新
      await DatabaseService.runAsync(
        `UPDATE food_log SET 
          food_name = ?, amount_g = ?, protein_g = ?, 
          fat_g = ?, carb_g = ?, kcal = ?, meal_type = ?
        WHERE id = ?`,
        [
          updatedFood.name,
          updatedFood.amount,
          updatedFood.protein,
          updatedFood.fat,
          updatedFood.carbs,
          updatedFood.calories,
          updatedFood.meal,
          parseInt(updatedFood.id)
        ]
      );

      // 状態を更新
      setFoodLog(prev => prev.map(food =>
        food.id === updatedFood.id ? updatedFood : food
      ));
      setEditingFood(null);
    } catch (error) {
      console.error('更新エラー:', error);
      throw error;
    }
  }, []);

  const deleteFood = useCallback(async (foodId: string) => {
    try {
      // SQLiteから削除
      await DatabaseService.runAsync(
        'DELETE FROM food_log WHERE id = ?',
        [parseInt(foodId)]
      );

      // 状態を更新
      setFoodLog(prev => prev.filter(food => food.id !== foodId));
    } catch (error) {
      console.error('削除エラー:', error);
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback((foodId: string) => {
    // 状態を更新
    setFoodLog(prev => prev.map(food =>
      food.id === foodId ? { ...food, isFavorite: !food.isFavorite } : food
    ));
  }, []);

  return {
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
  };
};