import { create } from 'zustand';
import { FoodLogItem } from '../screens/nutrition/types/nutrition.types';
import DatabaseService from '../services/database/DatabaseService';
import StreakService from '../services/StreakService';
import TimezoneHelper from '../utils/timezone';

interface FoodLogState {
  foodLog: FoodLogItem[];
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  editingFood: FoodLogItem | null;
  isLoading: boolean;

  // Actions
  setSelectedMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  setEditingFood: (food: FoodLogItem | null) => void;
  loadTodaysFoodLog: () => Promise<void>;
  addFood: (
    food: Omit<FoodLogItem, 'id' | 'meal' | 'time' | 'foodId'> & {
      foodId?: string;
    },
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => Promise<void>;
  updateFood: (updatedFood: FoodLogItem) => Promise<void>;
  deleteFood: (foodId: string) => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  foodLog: [],
  selectedMeal: 'breakfast',
  editingFood: null,
  isLoading: true,

  setSelectedMeal: meal => set({ selectedMeal: meal }),

  setEditingFood: food => set({ editingFood: food }),

  loadTodaysFoodLog: async () => {
    try {
      await DatabaseService.initialize();

      // ローカルタイムゾーンでの今日の日付を取得
      const todayString = TimezoneHelper.getCurrentLocalDate();

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

      const favorites = await DatabaseService.getAllAsync<any>(
        'SELECT * FROM food_favorites WHERE user_id = ?',
        ['user_1']
      );
      const favoriteNames = new Set(favorites.map(f => f.food_name));

      const logs = await DatabaseService.getAllAsync<any>(
        'SELECT * FROM food_log WHERE date = ? ORDER BY logged_at DESC',
        [todayString]
      );

      const mappedLogs: FoodLogItem[] = logs.map(log => {
        // デバッグ用ログ
        if (__DEV__) {
          console.log('Raw logged_at:', log.logged_at);
        }
        
        const timeString = log.logged_at 
          ? TimezoneHelper.convertUTCToLocal(log.logged_at) 
          : '--:--';
          
        if (__DEV__) {
          console.log('Converted time:', timeString);
        }

        return {
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
          time: timeString,
          isFavorite: favoriteNames.has(log.food_name),
        };
      });

      set({ foodLog: mappedLogs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addFood: async (food, mealType) => {
    const { selectedMeal } = get();
    const meal = mealType || selectedMeal;

    // foodIdが設定されていない場合は手動入力として一意のIDを生成
    const foodId = food.foodId || `manual_${Date.now()}`;

    // 手動入力の食品の場合、food_dbに登録
    if (!food.foodId || foodId.startsWith('manual_')) {
      try {
        await DatabaseService.runAsync(
          `INSERT OR REPLACE INTO food_db
           (food_id, name_ja, name_en, category, p100, f100, c100, kcal100, source, is_favorite)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            foodId,
            food.name,
            food.name,
            '手動入力',
            food.protein,
            food.fat,
            food.carbs,
            food.calories,
            'manual',
            0,
          ]
        );
      } catch (error) {
        // Ignore errors
      }
    }

    const itemId = Date.now().toString();
    const newFoodItem: FoodLogItem = {
      ...food,
      id: itemId,
      foodId: foodId,
      meal: meal,
      time: TimezoneHelper.getCurrentLocalTime(),
    };

    try {
      // ローカルタイムゾーンでの今日の日付を取得
      const dateString = TimezoneHelper.getCurrentLocalDate();

      const result = await DatabaseService.runAsync(
        `INSERT INTO food_log (
          user_id, date, meal_type, food_id, food_name,
          amount_g, protein_g, fat_g, carb_g, kcal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'user_1',
          dateString,
          meal,
          foodId,
          food.name,
          food.amount,
          food.protein,
          food.fat,
          food.carbs,
          food.calories,
        ]
      );

      newFoodItem.id = result.lastInsertRowId?.toString() || newFoodItem.id;

      set(state => {
        const updated = [...state.foodLog, newFoodItem];
        return { foodLog: updated };
      });

      // ストリークを更新（非同期だが待機しない）
      StreakService.updateStreak().catch(error => {
        console.error('Failed to update streak:', error);
      });
    } catch (error) {
      throw error;
    }
  },

  updateFood: async updatedFood => {
    try {
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
          parseInt(updatedFood.id),
        ]
      );

      set(state => ({
        foodLog: state.foodLog.map(food =>
          food.id === updatedFood.id ? updatedFood : food
        ),
        editingFood: null,
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteFood: async foodId => {
    try {
      await DatabaseService.runAsync('DELETE FROM food_log WHERE id = ?', [
        parseInt(foodId),
      ]);

      set(state => {
        const updated = state.foodLog.filter(food => food.id !== foodId);
        return { foodLog: updated };
      });
    } catch (error) {
      throw error;
    }
  },

  toggleFavorite: async foodId => {
    try {
      const { foodLog } = get();
      const currentFood = foodLog.find(food => food.id === foodId);
      if (!currentFood) return;

      const newFavoriteStatus = !currentFood.isFavorite;
      const actualFoodId = currentFood.foodId;


      // food_dbテーブルのお気に入り状態を更新
      if (actualFoodId) {
        const updateResult = await DatabaseService.runAsync(
          'UPDATE food_db SET is_favorite = ? WHERE food_id = ?',
          [newFavoriteStatus ? 1 : 0, actualFoodId]
        );
      }

      set(state => ({
        foodLog: state.foodLog.map(food =>
          food.id === foodId ? { ...food, isFavorite: newFavoriteStatus } : food
        ),
      }));
    } catch (error) {
      throw error;
    }
  },
}));
