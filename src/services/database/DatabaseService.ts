import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      // データベースを開く
      this.db = await SQLite.openDatabaseAsync('fitmeal.db');
      
      // プラグマ設定（外部キー制約を有効化）
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      // テーブル作成
      await this.createTables();
      
      // 初期データ投入
      await this.insertInitialData();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 食品マスタテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_db (
        food_id TEXT PRIMARY KEY,
        name_ja TEXT NOT NULL,
        name_en TEXT,
        barcode TEXT,
        brand TEXT,
        category TEXT,
        p100 REAL DEFAULT 0,
        f100 REAL DEFAULT 0,
        c100 REAL DEFAULT 0,
        kcal100 REAL DEFAULT 0,
        source TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_food_barcode ON food_db(barcode);
      CREATE INDEX IF NOT EXISTS idx_food_favorite ON food_db(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_food_name_ja ON food_db(name_ja);
    `);

    // 食事ログテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        date TEXT NOT NULL,
        meal_type TEXT CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
        food_id TEXT,
        food_name TEXT,
        amount_g REAL NOT NULL,
        protein_g REAL,
        fat_g REAL,
        carb_g REAL,
        kcal REAL,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_food_log_date ON food_log(date);
      CREATE INDEX IF NOT EXISTS idx_food_log_user ON food_log(user_id);
    `);

    // ワークアウトセッションテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_session (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        date TEXT NOT NULL,
        start_time DATETIME,
        end_time DATETIME,
        notes TEXT,
        total_volume_kg REAL DEFAULT 0,
        synced INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_workout_session_date ON workout_session(date);
      CREATE INDEX IF NOT EXISTS idx_workout_session_user ON workout_session(user_id);
    `);

    // ワークアウトセットテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_set (
        set_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        exercise_id INTEGER,
        set_number INTEGER,
        weight_kg REAL,
        reps INTEGER,
        rpe REAL,
        rest_seconds INTEGER,
        FOREIGN KEY (session_id) REFERENCES workout_session(session_id)
      );

      CREATE INDEX IF NOT EXISTS idx_workout_set_session ON workout_set(session_id);
    `);

    // 種目マスタテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercise_master (
        exercise_id INTEGER PRIMARY KEY,
        name_ja TEXT NOT NULL,
        name_en TEXT,
        muscle_group TEXT,
        equipment TEXT,
        is_compound INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_exercise_muscle_group ON exercise_master(muscle_group);
    `);

    // ユーザー設定テーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        goal TEXT CHECK(goal IN ('cut','bulk','maintain')),
        target_kcal INTEGER,
        target_protein_g INTEGER,
        target_fat_g INTEGER,
        target_carb_g INTEGER,
        weight_kg REAL,
        height_cm REAL,
        birth_year INTEGER,
        gender TEXT,
        activity_level TEXT,
        preferred_unit TEXT DEFAULT 'metric',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 同期キューテーブル
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        operation TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
    `);
  }

  private async insertInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 初期食品データを投入（日本の一般的な食品）
    const initialFoods = [
      // 主食
      { food_id: 'rice_cooked', name_ja: '白米（炊飯済み）', name_en: 'Cooked White Rice', category: '主食', p100: 2.5, f100: 0.3, c100: 37.1, kcal100: 156 },
      { food_id: 'bread_shokupan', name_ja: '食パン', name_en: 'White Bread', category: '主食', p100: 9.3, f100: 4.4, c100: 46.7, kcal100: 264 },
      { food_id: 'pasta_cooked', name_ja: 'パスタ（茹で）', name_en: 'Cooked Pasta', category: '主食', p100: 5.2, f100: 0.9, c100: 26.9, kcal100: 149 },
      
      // タンパク質源
      { food_id: 'chicken_breast', name_ja: '鶏胸肉（皮なし）', name_en: 'Chicken Breast Skinless', category: 'タンパク質', p100: 22.3, f100: 1.5, c100: 0, kcal100: 108 },
      { food_id: 'beef_lean', name_ja: '牛もも肉（赤身）', name_en: 'Lean Beef', category: 'タンパク質', p100: 21.2, f100: 9.6, c100: 0.2, kcal100: 165 },
      { food_id: 'salmon', name_ja: '鮭', name_en: 'Salmon', category: 'タンパク質', p100: 22.3, f100: 4.1, c100: 0.1, kcal100: 133 },
      { food_id: 'egg', name_ja: '鶏卵', name_en: 'Chicken Egg', category: 'タンパク質', p100: 12.3, f100: 10.3, c100: 0.3, kcal100: 151 },
      { food_id: 'tofu_silken', name_ja: '絹豆腐', name_en: 'Silken Tofu', category: 'タンパク質', p100: 4.9, f100: 3.0, c100: 1.7, kcal100: 56 },
      
      // 野菜
      { food_id: 'broccoli', name_ja: 'ブロッコリー', name_en: 'Broccoli', category: '野菜', p100: 4.3, f100: 0.5, c100: 5.2, kcal100: 33 },
      { food_id: 'spinach', name_ja: 'ほうれん草', name_en: 'Spinach', category: '野菜', p100: 2.2, f100: 0.4, c100: 3.1, kcal100: 20 },
      { food_id: 'tomato', name_ja: 'トマト', name_en: 'Tomato', category: '野菜', p100: 0.7, f100: 0.1, c100: 4.7, kcal100: 19 },
      
      // 果物
      { food_id: 'banana', name_ja: 'バナナ', name_en: 'Banana', category: '果物', p100: 1.1, f100: 0.2, c100: 22.5, kcal100: 86 },
      { food_id: 'apple', name_ja: 'りんご', name_en: 'Apple', category: '果物', p100: 0.2, f100: 0.1, c100: 14.6, kcal100: 54 },
      
      // サプリメント・プロテイン
      { food_id: 'whey_protein', name_ja: 'ホエイプロテイン', name_en: 'Whey Protein', category: 'サプリ', p100: 80.0, f100: 5.0, c100: 5.0, kcal100: 390 },
      { food_id: 'protein_bar', name_ja: 'プロテインバー', name_en: 'Protein Bar', category: 'サプリ', p100: 20.0, f100: 8.0, c100: 25.0, kcal100: 240 }
    ];

    for (const food of initialFoods) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO food_db (food_id, name_ja, name_en, category, p100, f100, c100, kcal100, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [food.food_id, food.name_ja, food.name_en, food.category, food.p100, food.f100, food.c100, food.kcal100, 'initial']
      );
    }

    // 初期種目データを投入
    const initialExercises = [
      // 大胸筋
      { exercise_id: 1, name_ja: 'ベンチプレス', name_en: 'Bench Press', muscle_group: '大胸筋', equipment: 'バーベル', is_compound: 1 },
      { exercise_id: 2, name_ja: 'ダンベルプレス', name_en: 'Dumbbell Press', muscle_group: '大胸筋', equipment: 'ダンベル', is_compound: 1 },
      { exercise_id: 3, name_ja: 'プッシュアップ', name_en: 'Push Up', muscle_group: '大胸筋', equipment: '自重', is_compound: 1 },
      
      // 背中
      { exercise_id: 4, name_ja: 'デッドリフト', name_en: 'Deadlift', muscle_group: '背中', equipment: 'バーベル', is_compound: 1 },
      { exercise_id: 5, name_ja: 'ラットプルダウン', name_en: 'Lat Pulldown', muscle_group: '背中', equipment: 'マシン', is_compound: 1 },
      { exercise_id: 6, name_ja: 'ベントオーバーロウ', name_en: 'Bent Over Row', muscle_group: '背中', equipment: 'バーベル', is_compound: 1 },
      
      // 脚
      { exercise_id: 7, name_ja: 'スクワット', name_en: 'Squat', muscle_group: '脚', equipment: 'バーベル', is_compound: 1 },
      { exercise_id: 8, name_ja: 'レッグプレス', name_en: 'Leg Press', muscle_group: '脚', equipment: 'マシン', is_compound: 1 },
      { exercise_id: 9, name_ja: 'ランジ', name_en: 'Lunge', muscle_group: '脚', equipment: 'ダンベル', is_compound: 1 },
      
      // 肩
      { exercise_id: 10, name_ja: 'ショルダープレス', name_en: 'Shoulder Press', muscle_group: '肩', equipment: 'ダンベル', is_compound: 1 },
      { exercise_id: 11, name_ja: 'サイドレイズ', name_en: 'Side Raise', muscle_group: '肩', equipment: 'ダンベル', is_compound: 0 },
      { exercise_id: 12, name_ja: 'リアレイズ', name_en: 'Rear Raise', muscle_group: '肩', equipment: 'ダンベル', is_compound: 0 },
      
      // 腕
      { exercise_id: 13, name_ja: 'バーベルカール', name_en: 'Barbell Curl', muscle_group: '上腕二頭筋', equipment: 'バーベル', is_compound: 0 },
      { exercise_id: 14, name_ja: 'ダンベルカール', name_en: 'Dumbbell Curl', muscle_group: '上腕二頭筋', equipment: 'ダンベル', is_compound: 0 },
      { exercise_id: 15, name_ja: 'トライセプスプレスダウン', name_en: 'Triceps Pressdown', muscle_group: '上腕三頭筋', equipment: 'ケーブル', is_compound: 0 },
      
      // 腹筋
      { exercise_id: 16, name_ja: 'プランク', name_en: 'Plank', muscle_group: '腹筋', equipment: '自重', is_compound: 0 },
      { exercise_id: 17, name_ja: 'クランチ', name_en: 'Crunch', muscle_group: '腹筋', equipment: '自重', is_compound: 0 },
      { exercise_id: 18, name_ja: 'レッグレイズ', name_en: 'Leg Raise', muscle_group: '腹筋', equipment: '自重', is_compound: 0 }
    ];

    for (const exercise of initialExercises) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO exercise_master (exercise_id, name_ja, name_en, muscle_group, equipment, is_compound) VALUES (?, ?, ?, ?, ?, ?)',
        [exercise.exercise_id, exercise.name_ja, exercise.name_en, exercise.muscle_group, exercise.equipment, exercise.is_compound]
      );
    }

    console.log('Initial data inserted successfully');
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // トランザクション実行のヘルパーメソッド
  async runTransaction(callback: (db: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.withTransactionAsync(async () => {
      return await callback(this.db!);
    });
  }

  // データベースの状態確認
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

export default new DatabaseService();