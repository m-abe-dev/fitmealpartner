import DatabaseService from '../DatabaseService';

export interface UserSettings {
  user_id: string;
  goal: 'cut' | 'bulk' | 'maintain';
  target_kcal: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carb_g: number;
  weight_kg: number;
  height_cm: number;
  birth_year: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  preferred_unit: 'metric' | 'imperial';
  updated_at?: string;
}

export interface UserProfile extends UserSettings {
  age: number;
  bmi: number;
  bmr: number; // 基礎代謝率
  tdee: number; // 総消費エネルギー
}

export interface WeightRecord {
  id?: number;
  user_id: string;
  weight_kg: number;
  date: string;
  logged_at?: string;
  synced?: boolean;
}

class UserRepository {

  // ユーザー設定を取得
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getFirstAsync(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );
    
    return result ? this.mapRowToUserSettings(result) : null;
  }

  // ユーザー設定を保存/更新
  async saveUserSettings(settings: UserSettings): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO user_settings 
       (user_id, goal, target_kcal, target_protein_g, target_fat_g, target_carb_g, 
        weight_kg, height_cm, birth_year, gender, activity_level, preferred_unit, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        settings.user_id,
        settings.goal,
        settings.target_kcal,
        settings.target_protein_g,
        settings.target_fat_g,
        settings.target_carb_g,
        settings.weight_kg,
        settings.height_cm,
        settings.birth_year,
        settings.gender,
        settings.activity_level,
        settings.preferred_unit
      ]
    );
  }

  // ユーザープロフィール（計算値含む）を取得
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const settings = await this.getUserSettings(userId);
    if (!settings) return null;
    
    const currentYear = new Date().getFullYear();
    const age = currentYear - settings.birth_year;
    const heightM = settings.height_cm / 100;
    const bmi = settings.weight_kg / (heightM * heightM);
    
    // Harris-Benedict式で基礎代謝率を計算
    let bmr: number;
    if (settings.gender === 'male') {
      bmr = 88.362 + (13.397 * settings.weight_kg) + (4.799 * settings.height_cm) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * settings.weight_kg) + (3.098 * settings.height_cm) - (4.330 * age);
    }
    
    // 活動レベルに基づいてTDEEを計算
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    };
    
    const tdee = bmr * activityMultipliers[settings.activity_level];
    
    return {
      ...settings,
      age,
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee)
    };
  }

  // 目標栄養素を更新
  async updateNutritionTargets(userId: string, targets: {
    target_kcal?: number;
    target_protein_g?: number;
    target_fat_g?: number;
    target_carb_g?: number;
  }): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    const fields = [];
    const values = [];
    
    if (targets.target_kcal !== undefined) {
      fields.push('target_kcal = ?');
      values.push(targets.target_kcal);
    }
    if (targets.target_protein_g !== undefined) {
      fields.push('target_protein_g = ?');
      values.push(targets.target_protein_g);
    }
    if (targets.target_fat_g !== undefined) {
      fields.push('target_fat_g = ?');
      values.push(targets.target_fat_g);
    }
    if (targets.target_carb_g !== undefined) {
      fields.push('target_carb_g = ?');
      values.push(targets.target_carb_g);
    }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);
      
      await db.runAsync(
        `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
    }
  }

  // 体重を更新
  async updateWeight(userId: string, weightKg: number): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      'UPDATE user_settings SET weight_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [weightKg, userId]
    );
  }

  // 目標を更新
  async updateGoal(userId: string, goal: 'cut' | 'bulk' | 'maintain'): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      'UPDATE user_settings SET goal = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [goal, userId]
    );
  }

  // 単位設定を更新
  async updatePreferredUnit(userId: string, unit: 'metric' | 'imperial'): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      'UPDATE user_settings SET preferred_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [unit, userId]
    );
  }

  // 体重履歴テーブルの作成（初回のみ）
  async createWeightHistoryTable(): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS weight_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        date TEXT NOT NULL,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_weight_history_user_date ON weight_history(user_id, date);
    `);
  }

  // 体重記録を追加
  async addWeightRecord(record: Omit<WeightRecord, 'id' | 'logged_at' | 'synced'>): Promise<number> {
    // テーブルが存在することを確認
    await this.createWeightHistoryTable();
    
    const db = DatabaseService.getDatabase();
    
    const result = await db.runAsync(
      'INSERT INTO weight_history (user_id, weight_kg, date) VALUES (?, ?, ?)',
      [record.user_id, record.weight_kg, record.date]
    );
    
    // ユーザー設定も更新
    await this.updateWeight(record.user_id, record.weight_kg);
    
    return result.lastInsertRowId;
  }

  // 体重履歴を取得
  async getWeightHistory(userId: string, startDate: string, endDate: string): Promise<WeightRecord[]> {
    await this.createWeightHistoryTable();
    
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      'SELECT * FROM weight_history WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC',
      [userId, startDate, endDate]
    );
    
    return result.map(row => this.mapRowToWeightRecord(row));
  }

  // 最新の体重記録を取得
  async getLatestWeight(userId: string): Promise<WeightRecord | null> {
    await this.createWeightHistoryTable();
    
    const db = DatabaseService.getDatabase();
    
    const result = await db.getFirstAsync(
      'SELECT * FROM weight_history WHERE user_id = ? ORDER BY date DESC, logged_at DESC LIMIT 1',
      [userId]
    );
    
    return result ? this.mapRowToWeightRecord(result) : null;
  }

  // 栄養目標を自動計算（推奨値）
  async calculateRecommendedTargets(userId: string): Promise<{
    target_kcal: number;
    target_protein_g: number;
    target_fat_g: number;
    target_carb_g: number;
  }> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');
    
    let targetKcal: number;
    
    // 目標に基づいてカロリー調整
    switch (profile.goal) {
      case 'cut':
        targetKcal = Math.round(profile.tdee * 0.85); // 15%減
        break;
      case 'bulk':
        targetKcal = Math.round(profile.tdee * 1.15); // 15%増
        break;
      case 'maintain':
      default:
        targetKcal = Math.round(profile.tdee);
        break;
    }
    
    // マクロ栄養素の目標を計算
    // タンパク質: 体重1kgあたり1.6-2.2g（筋トレユーザー向け）
    const targetProteinG = Math.round(profile.weight_kg * 2.0);
    
    // 脂質: 総カロリーの25-30%
    const targetFatG = Math.round((targetKcal * 0.275) / 9); // 脂質は1gあたり9kcal
    
    // 炭水化物: 残りのカロリー
    const remainingKcal = targetKcal - (targetProteinG * 4) - (targetFatG * 9);
    const targetCarbG = Math.round(remainingKcal / 4); // 炭水化物は1gあたり4kcal
    
    return {
      target_kcal: targetKcal,
      target_protein_g: targetProteinG,
      target_fat_g: targetFatG,
      target_carb_g: Math.max(targetCarbG, 50) // 最低50g確保
    };
  }

  // 推奨目標を適用
  async applyRecommendedTargets(userId: string): Promise<void> {
    const targets = await this.calculateRecommendedTargets(userId);
    await this.updateNutritionTargets(userId, targets);
  }

  // ユーザーデータの完全削除（退会時）
  async deleteAllUserData(userId: string): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await DatabaseService.runTransaction(async (db) => {
      // 各テーブルからユーザーデータを削除
      await db.runAsync('DELETE FROM user_settings WHERE user_id = ?', [userId]);
      await db.runAsync('DELETE FROM food_log WHERE user_id = ?', [userId]);
      await db.runAsync('DELETE FROM workout_session WHERE user_id = ?', [userId]);
      
      // 体重履歴テーブルが存在すれば削除
      try {
        await db.runAsync('DELETE FROM weight_history WHERE user_id = ?', [userId]);
      } catch (error) {
        // テーブルが存在しない場合は無視
      }
      
      await db.runAsync('DELETE FROM sync_queue WHERE data LIKE ?', [`%"user_id":"${userId}"%`]);
    });
  }

  // オンボーディング完了状態をチェック
  async isOnboardingCompleted(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    
    return settings !== null && 
           settings.goal !== null &&
           settings.target_kcal > 0 &&
           settings.weight_kg > 0 &&
           settings.height_cm > 0 &&
           settings.birth_year > 0;
  }

  // データマッピング用のヘルパー関数
  private mapRowToUserSettings(row: any): UserSettings {
    return {
      user_id: row.user_id,
      goal: row.goal,
      target_kcal: row.target_kcal,
      target_protein_g: row.target_protein_g,
      target_fat_g: row.target_fat_g,
      target_carb_g: row.target_carb_g,
      weight_kg: row.weight_kg,
      height_cm: row.height_cm,
      birth_year: row.birth_year,
      gender: row.gender,
      activity_level: row.activity_level,
      preferred_unit: row.preferred_unit,
      updated_at: row.updated_at
    };
  }

  private mapRowToWeightRecord(row: any): WeightRecord {
    return {
      id: row.id,
      user_id: row.user_id,
      weight_kg: row.weight_kg,
      date: row.date,
      logged_at: row.logged_at,
      synced: row.synced === 1
    };
  }
}

export default new UserRepository();