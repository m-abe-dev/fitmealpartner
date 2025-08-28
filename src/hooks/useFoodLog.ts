import { useState, useCallback, useEffect } from 'react';
import { FoodLogItem } from '../screens/nutrition/types/nutrition.types';
import DatabaseService from '../services/database/DatabaseService';

// グローバル状態として食事ログを管理
let globalFoodLog: FoodLogItem[] = [
  {
    id: '1',
    foodId: 'food_001',
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
    foodId: 'food_002',
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
    foodId: 'food_003',
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
    foodId: 'food_004',
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
    foodId: 'food_005',
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
];

// グローバル状態の変更を通知するためのリスナー
let listeners: (() => void)[] = [];

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
  const [, forceUpdate] = useState({});

  // グローバル状態から食事ログを取得
  const [foodLog, setFoodLog] = useState<FoodLogItem[]>(globalFoodLog);

  // 起動時にSQLiteからデータを読み込み
  useEffect(() => {
    loadTodaysFoodLog();
  }, []);

  // グローバル状態の変更を監視
  useEffect(() => {
    const listener = () => {
      setFoodLog([...globalFoodLog]);
      forceUpdate({});
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
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
      
      globalFoodLog = mappedLogs;
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

      // グローバル状態を更新
      globalFoodLog = [...globalFoodLog, newFoodItem];
      
      // 全てのリスナーに通知
      listeners.forEach(listener => listener());
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

      // グローバル状態を更新
      globalFoodLog = globalFoodLog.map(food =>
        food.id === updatedFood.id ? updatedFood : food
      );
      
      // 全てのリスナーに通知
      listeners.forEach(listener => listener());
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

      // グローバル状態を更新
      globalFoodLog = globalFoodLog.filter(food => food.id !== foodId);
      
      // 全てのリスナーに通知
      listeners.forEach(listener => listener());
    } catch (error) {
      console.error('削除エラー:', error);
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback((foodId: string) => {
    // グローバル状態を更新
    globalFoodLog = globalFoodLog.map(food =>
      food.id === foodId ? { ...food, isFavorite: !food.isFavorite } : food
    );
    
    // 全てのリスナーに通知
    listeners.forEach(listener => listener());
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