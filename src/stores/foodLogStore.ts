import { create } from 'zustand';
import { FoodLogItem } from '../screens/nutrition/types/nutrition.types';
import DatabaseService from '../services/database/DatabaseService';

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
    }
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

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;

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
          minute: '2-digit',
        }),
        isFavorite: favoriteNames.has(log.food_name),
      }));

      set({ foodLog: mappedLogs, isLoading: false });
    } catch (error) {
      console.error('食事ログの読み込みエラー:', error);
      set({ isLoading: false });
    }
  },

  addFood: async food => {
    const { selectedMeal } = get();

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
        console.error('food_db登録エラー:', error);
      }
    }

    const itemId = Date.now().toString();
    const newFoodItem: FoodLogItem = {
      ...food,
      id: itemId,
      foodId: foodId,
      meal: selectedMeal,
      time: new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const result = await DatabaseService.runAsync(
        `INSERT INTO food_log (
          user_id, date, meal_type, food_id, food_name,
          amount_g, protein_g, fat_g, carb_g, kcal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'user_1',
          dateString,
          selectedMeal,
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
      console.log('📝 DB保存完了 - food_id:', foodId);

      set(state => {
        const updated = [...state.foodLog, newFoodItem];
        console.log('🔄 Store - foodLog状態更新完了:', updated.length);
        return { foodLog: updated };
      });
    } catch (error) {
      console.error('❌ 保存エラー:', error);
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
      console.error('更新エラー:', error);
      throw error;
    }
  },

  deleteFood: async foodId => {
    try {
      await DatabaseService.runAsync('DELETE FROM food_log WHERE id = ?', [
        parseInt(foodId),
      ]);

      console.log('🗑️ Store - foodLog状態削除実行:', foodId);
      set(state => {
        const updated = state.foodLog.filter(food => food.id !== foodId);
        console.log('🗑️ Store - foodLog状態削除完了:', updated.length);
        return { foodLog: updated };
      });
    } catch (error) {
      console.error('削除エラー:', error);
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

      console.log(
        `お気に入り切り替え: ID=${actualFoodId}, 新状態=${newFavoriteStatus}`
      );

      // food_dbテーブルのお気に入り状態を更新
      if (actualFoodId) {
        const updateResult = await DatabaseService.runAsync(
          'UPDATE food_db SET is_favorite = ? WHERE food_id = ?',
          [newFavoriteStatus ? 1 : 0, actualFoodId]
        );
        console.log(`お気に入り状態更新完了: 変更行数=${updateResult.changes}`);
      }

      set(state => ({
        foodLog: state.foodLog.map(food =>
          food.id === foodId ? { ...food, isFavorite: newFavoriteStatus } : food
        ),
      }));
    } catch (error) {
      console.error('お気に入り切り替えエラー:', error);
      throw error;
    }
  },
}));
