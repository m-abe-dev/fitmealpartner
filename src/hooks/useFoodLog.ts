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
      
      // お気に入りテーブルの作成を確認
      await DatabaseService.execAsync(`
        CREATE TABLE IF NOT EXISTS food_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          food_name TEXT,
          food_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, food_name)
        );
      `);
      
      // お気に入り情報を取得
      const favorites = await DatabaseService.getAllAsync<any>(
        'SELECT food_name FROM food_favorites WHERE user_id = ?',
        ['guest']
      );
      const favoriteNames = new Set(favorites.map(f => f.food_name));
      
      // 食事ログを取得
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
        isFavorite: favoriteNames.has(log.food_name)
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

  const toggleFavorite = useCallback(async (foodId: string) => {
    try {
      // 現在のお気に入り状態を取得
      const currentFood = foodLog.find(food => food.id === foodId);
      if (!currentFood) return;
      
      const newFavoriteStatus = !currentFood.isFavorite;
      
      // food_dbテーブルにお気に入り情報を保存
      if (currentFood.foodId) {
        await DatabaseService.runAsync(
          'UPDATE food_db SET is_favorite = ? WHERE food_id = ?',
          [newFavoriteStatus ? 1 : 0, currentFood.foodId]
        );
      }
      
      // お気に入りテーブルを作成して管理
      await DatabaseService.execAsync(`
        CREATE TABLE IF NOT EXISTS food_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          food_name TEXT,
          food_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, food_name)
        );
      `);
      
      if (newFavoriteStatus) {
        // お気に入りに追加
        await DatabaseService.runAsync(
          `INSERT OR REPLACE INTO food_favorites (user_id, food_name, food_id) 
           VALUES (?, ?, ?)`,
          ['guest', currentFood.name, currentFood.foodId || null]
        );
      } else {
        // お気に入りから削除
        await DatabaseService.runAsync(
          'DELETE FROM food_favorites WHERE user_id = ? AND food_name = ?',
          ['guest', currentFood.name]
        );
      }
      
      // 状態を更新
      setFoodLog(prev => prev.map(food =>
        food.id === foodId ? { ...food, isFavorite: newFavoriteStatus } : food
      ));
    } catch (error) {
      console.error('お気に入り更新エラー:', error);
      throw error;
    }
  }, [foodLog]);

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