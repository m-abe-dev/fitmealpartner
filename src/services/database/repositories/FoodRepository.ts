import DatabaseService from '../DatabaseService';

export interface Food {
  food_id: string;
  name_ja: string;
  name_en?: string;
  barcode?: string;
  brand?: string;
  category: string;
  p100: number; // タンパク質 (g/100g)
  f100: number; // 脂質 (g/100g)
  c100: number; // 炭水化物 (g/100g)
  kcal100: number; // カロリー (kcal/100g)
  source?: string;
  is_favorite: boolean;
  created_at?: string;
}

export interface FoodLog {
  id?: number;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_id: string;
  food_name: string;
  amount_g: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  kcal: number;
  logged_at?: string;
  synced?: boolean;
}

export interface NutritionSummary {
  date: string;
  total_kcal: number;
  total_protein: number;
  total_fat: number;
  total_carb: number;
  meal_breakdown: {
    breakfast: { kcal: number; protein: number; fat: number; carb: number };
    lunch: { kcal: number; protein: number; fat: number; carb: number };
    dinner: { kcal: number; protein: number; fat: number; carb: number };
    snack: { kcal: number; protein: number; fat: number; carb: number };
  };
}

class FoodRepository {
  // 食品検索（名前での部分一致）
  async searchFoods(query: string, limit: number = 20): Promise<Food[]> {
    const result = (await DatabaseService.getAllAsync(
      `SELECT * FROM food_db
       WHERE name_ja LIKE ? OR name_en LIKE ?
       ORDER BY is_favorite DESC, name_ja ASC
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit]
    )) as Record<string, any>[];

    return result.map(row => this.mapRowToFood(row));
  }

  // バーコードで食品検索
  async getFoodByBarcode(barcode: string): Promise<Food | null> {
    const result = (await DatabaseService.getFirstAsync(
      'SELECT * FROM food_db WHERE barcode = ?',
      [barcode]
    )) as Record<string, any> | null;

    return result ? this.mapRowToFood(result) : null;
  }

  // 食品IDで取得
  async getFoodById(foodId: string): Promise<Food | null> {
    const result = (await DatabaseService.getFirstAsync(
      'SELECT * FROM food_db WHERE food_id = ?',
      [foodId]
    )) as Record<string, any> | null;

    return result ? this.mapRowToFood(result) : null;
  }

  // お気に入り食品の取得
  async getFavoriteFoods(limit: number = 50): Promise<Food[]> {
    const result = (await DatabaseService.getAllAsync(
      'SELECT * FROM food_db WHERE is_favorite = 1 ORDER BY name_ja ASC LIMIT ?',
      [limit]
    )) as Record<string, any>[];

    return result.map(row => this.mapRowToFood(row));
  }

  // 最近使用した食品の取得
  async getRecentFoods(userId: string, limit: number = 10): Promise<Food[]> {
    try {
      // 最近のログから重複なしで食品IDを取得（NULL値を除外）
      const recentLogs = (await DatabaseService.getAllAsync(
        `SELECT DISTINCT food_id, MAX(logged_at) as last_used
         FROM food_log
         WHERE user_id = ? AND food_id IS NOT NULL AND food_id != ''
         GROUP BY food_id
         ORDER BY last_used DESC
         LIMIT ?`,
        [userId, limit]
      )) as Array<{ food_id: string; last_used: string }>;

      if (recentLogs.length === 0) {
        return [];
      }

      // 各food_idの食品情報を個別に取得
      const foods: Food[] = [];
      for (const log of recentLogs) {
        const food = (await DatabaseService.getFirstAsync(
          'SELECT * FROM food_db WHERE food_id = ?',
          [log.food_id]
        )) as Record<string, any> | null;

        if (food) {
          foods.push(this.mapRowToFood(food));
        }
      }

      return foods;
    } catch (error) {
      return [];
    }
  }

  // 食品をお気に入りに追加/削除
  async toggleFavorite(foodId: string): Promise<void> {
    await DatabaseService.runAsync(
      'UPDATE food_db SET is_favorite = NOT is_favorite WHERE food_id = ?',
      [foodId]
    );
  }

  // 新しい食品を追加（重複チェック付き）
  async addFood(food: Omit<Food, 'created_at'>): Promise<void> {
    try {
      // 既存の食品があるかチェック
      const existing = await DatabaseService.getFirstAsync(
        'SELECT food_id FROM food_db WHERE food_id = ?',
        [food.food_id]
      );

      if (!existing) {
        await DatabaseService.runAsync(
          `INSERT INTO food_db
           (food_id, name_ja, name_en, barcode, brand, category, p100, f100, c100, kcal100, source, is_favorite)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            food.food_id,
            food.name_ja,
            food.name_en || null,
            food.barcode || null,
            food.brand || null,
            food.category,
            food.p100,
            food.f100,
            food.c100,
            food.kcal100,
            food.source || 'user',
            food.is_favorite ? 1 : 0,
          ]
        );
      }
    } catch (error) {
      console.error('Error adding food to database:', error);
      // エラーを再スローしない（重複エラーの場合は無視）
    }
  }

  // 食事ログを追加
  async logFood(
    foodLog: Omit<FoodLog, 'id' | 'logged_at' | 'synced'>
  ): Promise<number> {
    const result = await DatabaseService.runAsync(
      `INSERT INTO food_log
       (user_id, date, meal_type, food_id, food_name, amount_g, protein_g, fat_g, carb_g, kcal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        foodLog.user_id,
        foodLog.date,
        foodLog.meal_type,
        foodLog.food_id,
        foodLog.food_name,
        foodLog.amount_g,
        foodLog.protein_g,
        foodLog.fat_g,
        foodLog.carb_g,
        foodLog.kcal,
      ]
    );

    return result.lastInsertRowId;
  }

  // 食事ログを更新
  async updateFoodLog(logId: number, amount_g: number): Promise<void> {
    // まず元の食品データを取得
    const logData = (await DatabaseService.getFirstAsync(
      'SELECT food_id FROM food_log WHERE id = ?',
      [logId]
    )) as { food_id: string } | null;

    if (!logData) throw new Error('Food log not found');

    const food = await this.getFoodById(logData.food_id);
    if (!food) throw new Error('Food not found');

    // 新しい量に基づいて栄養素を再計算
    const ratio = amount_g / 100;
    const protein_g = food.p100 * ratio;
    const fat_g = food.f100 * ratio;
    const carb_g = food.c100 * ratio;
    const kcal = food.kcal100 * ratio;

    await DatabaseService.runAsync(
      `UPDATE food_log
       SET amount_g = ?, protein_g = ?, fat_g = ?, carb_g = ?, kcal = ?, synced = 0
       WHERE id = ?`,
      [amount_g, protein_g, fat_g, carb_g, kcal, logId]
    );
  }

  // 食事ログを削除
  async deleteFoodLog(logId: number): Promise<void> {
    await DatabaseService.runAsync('DELETE FROM food_log WHERE id = ?', [
      logId,
    ]);
  }

  // 特定日の食事ログを取得
  async getFoodLogsByDate(userId: string, date: string): Promise<FoodLog[]> {
    const result = (await DatabaseService.getAllAsync(
      'SELECT * FROM food_log WHERE user_id = ? AND date = ? ORDER BY logged_at ASC',
      [userId, date]
    )) as Record<string, any>[];

    return result.map(row => this.mapRowToFoodLog(row));
  }

  // 食事タイプ別のログを取得
  async getFoodLogsByMeal(
    userId: string,
    date: string,
    mealType: string
  ): Promise<FoodLog[]> {
    const result = (await DatabaseService.getAllAsync(
      'SELECT * FROM food_log WHERE user_id = ? AND date = ? AND meal_type = ? ORDER BY logged_at ASC',
      [userId, date, mealType]
    )) as Record<string, any>[];

    return result.map(row => this.mapRowToFoodLog(row));
  }

  // 栄養サマリーを取得
  async getNutritionSummary(
    userId: string,
    date: string
  ): Promise<NutritionSummary> {
    const result = (await DatabaseService.getAllAsync(
      `SELECT
         meal_type,
         SUM(kcal) as total_kcal,
         SUM(protein_g) as total_protein,
         SUM(fat_g) as total_fat,
         SUM(carb_g) as total_carb
       FROM food_log
       WHERE user_id = ? AND date = ?
       GROUP BY meal_type`,
      [userId, date]
    )) as Record<string, any>[];

    const summary: NutritionSummary = {
      date,
      total_kcal: 0,
      total_protein: 0,
      total_fat: 0,
      total_carb: 0,
      meal_breakdown: {
        breakfast: { kcal: 0, protein: 0, fat: 0, carb: 0 },
        lunch: { kcal: 0, protein: 0, fat: 0, carb: 0 },
        dinner: { kcal: 0, protein: 0, fat: 0, carb: 0 },
        snack: { kcal: 0, protein: 0, fat: 0, carb: 0 },
      },
    };

    result.forEach((row: Record<string, any>) => {
      const mealType = row.meal_type as keyof typeof summary.meal_breakdown;
      const kcal = row.total_kcal || 0;
      const protein = row.total_protein || 0;
      const fat = row.total_fat || 0;
      const carb = row.total_carb || 0;

      summary.meal_breakdown[mealType] = { kcal, protein, fat, carb };
      summary.total_kcal += kcal;
      summary.total_protein += protein;
      summary.total_fat += fat;
      summary.total_carb += carb;
    });

    return summary;
  }

  // 指定期間の栄養データを取得（グラフ用）
  async getNutritionTrend(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<NutritionSummary[]> {
    const result = (await DatabaseService.getAllAsync(
      `SELECT
         date,
         SUM(kcal) as total_kcal,
         SUM(protein_g) as total_protein,
         SUM(fat_g) as total_fat,
         SUM(carb_g) as total_carb
       FROM food_log
       WHERE user_id = ? AND date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    )) as Record<string, any>[];

    return result.map((row: Record<string, any>) => ({
      date: row.date,
      total_kcal: row.total_kcal || 0,
      total_protein: row.total_protein || 0,
      total_fat: row.total_fat || 0,
      total_carb: row.total_carb || 0,
      meal_breakdown: {
        breakfast: { kcal: 0, protein: 0, fat: 0, carb: 0 },
        lunch: { kcal: 0, protein: 0, fat: 0, carb: 0 },
        dinner: { kcal: 0, protein: 0, fat: 0, carb: 0 },
        snack: { kcal: 0, protein: 0, fat: 0, carb: 0 },
      },
    }));
  }

  // 100gあたりの栄養素から実際の量を計算するヘルパー関数
  calculateNutrition(
    food: Food,
    amountG: number
  ): {
    protein_g: number;
    fat_g: number;
    carb_g: number;
    kcal: number;
  } {
    const ratio = amountG / 100;
    return {
      protein_g: Math.round(food.p100 * ratio * 10) / 10,
      fat_g: Math.round(food.f100 * ratio * 10) / 10,
      carb_g: Math.round(food.c100 * ratio * 10) / 10,
      kcal: Math.round(food.kcal100 * ratio),
    };
  }

  // 未同期の食事ログを取得（オフライン対応）
  async getUnsyncedFoodLogs(): Promise<FoodLog[]> {
    const result = (await DatabaseService.getAllAsync(
      'SELECT * FROM food_log WHERE synced = 0 ORDER BY logged_at ASC'
    )) as Record<string, any>[];

    return result.map(row => this.mapRowToFoodLog(row));
  }

  // 食事ログの同期状態を更新
  async markFoodLogAsSynced(logId: number): Promise<void> {
    await DatabaseService.runAsync(
      'UPDATE food_log SET synced = 1 WHERE id = ?',
      [logId]
    );
  }

  // データマッピング用のヘルパー関数
  private mapRowToFood(row: Record<string, any>): Food {
    return {
      food_id: row.food_id,
      name_ja: row.name_ja,
      name_en: row.name_en,
      barcode: row.barcode,
      brand: row.brand,
      category: row.category,
      p100: row.p100,
      f100: row.f100,
      c100: row.c100,
      kcal100: row.kcal100,
      source: row.source,
      is_favorite: row.is_favorite === 1,
      created_at: row.created_at,
    };
  }

  private mapRowToFoodLog(row: Record<string, any>): FoodLog {
    return {
      id: row.id,
      user_id: row.user_id,
      date: row.date,
      meal_type: row.meal_type,
      food_id: row.food_id,
      food_name: row.food_name,
      amount_g: row.amount_g,
      protein_g: row.protein_g,
      fat_g: row.fat_g,
      carb_g: row.carb_g,
      kcal: row.kcal,
      logged_at: row.logged_at,
      synced: row.synced === 1,
    };
  }
}

export default new FoodRepository();
