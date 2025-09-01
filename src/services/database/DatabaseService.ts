import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log('Initializing database...');

      // Expo SDK 53の新しいAPI - openDatabaseAsync を使用
      this.db = await SQLite.openDatabaseAsync('fitmeal.db');
      console.log('Database opened successfully');

      // テーブル作成
      await this.createTables();

      // データマイグレーション実行
      await this.migrateData();

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

    try {
      console.log('Creating tables...');

      // 外部キー制約を有効化
      await this.db.execAsync('PRAGMA foreign_keys = ON;');

      // 1. 食品マスタテーブル
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
      console.log('food_db table created');

      // 2. 食事ログテーブル
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
      console.log('food_log table created');

      // 3. ワークアウトセッションテーブル
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
      console.log('workout_session table created');

      // 4. ワークアウトセットテーブル
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
      console.log('workout_set table created');

      // 5. 種目マスタテーブル
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
      console.log('exercise_master table created');

      // 6. ユーザー設定テーブル
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
      console.log('user_settings table created');

      // 7. 同期キューテーブル
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
      console.log('sync_queue table created');

      console.log('All tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private async migrateData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('Running data migration...');

      // workout_setテーブルに有酸素運動用カラムを追加
      try {
        await this.db.execAsync(`
          ALTER TABLE workout_set ADD COLUMN time_minutes REAL;
        `);
        console.log('Added time_minutes column to workout_set');
      } catch (error) {
        // カラムが既に存在する場合はエラーを無視
        console.log('time_minutes column already exists or error:', error);
      }

      try {
        await this.db.execAsync(`
          ALTER TABLE workout_set ADD COLUMN distance_km REAL;
        `);
        console.log('Added distance_km column to workout_set');
      } catch (error) {
        // カラムが既に存在する場合はエラーを無視
        console.log('distance_km column already exists or error:', error);
      }

      // ID 19-33の不要データを削除
      await this.db.runAsync(
        'DELETE FROM exercise_master WHERE exercise_id BETWEEN 19 AND 33',
        []
      );

      // カテゴリ名を日本語に統一
      const categoryMappings = [
        ['Chest', '胸'],
        ['Back', '背中'],
        ['Leg', '脚'],
        ['Shoulder', '肩'],
        ['Arm', '腕'],
        ['Cardio', '有酸素'],
        ['Other', 'その他'],
      ];

      for (const [oldName, newName] of categoryMappings) {
        await this.db.runAsync(
          'UPDATE exercise_master SET muscle_group = ? WHERE muscle_group = ?',
          [newName, oldName]
        );
      }

      // 古い無効なfood_logエントリをクリーンアップ
      await this.db.runAsync(`
        DELETE FROM food_log 
        WHERE food_id NOT IN (SELECT food_id FROM food_db)
        AND food_id NOT LIKE 'manual_%'
        AND food_id NOT LIKE 'jfc_%'
      `);
      console.log('Cleaned up invalid food_log entries');

      console.log('Data migration completed');
    } catch (error) {
      console.error('Error in data migration:', error);
      // マイグレーションエラーは処理を続行
    }
  }

  private async insertInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('Inserting initial data...');

      // 初期食品データを投入（日本の一般的な食品）
      const initialFoods = [
        // 主食
        {
          food_id: 'rice_cooked',
          name_ja: '白米（炊飯済み）',
          name_en: 'Cooked White Rice',
          category: '主食',
          p100: 2.5,
          f100: 0.3,
          c100: 37.1,
          kcal100: 156,
        },
        {
          food_id: 'bread_shokupan',
          name_ja: '食パン',
          name_en: 'White Bread',
          category: '主食',
          p100: 9.3,
          f100: 4.4,
          c100: 46.7,
          kcal100: 264,
        },
        {
          food_id: 'pasta_cooked',
          name_ja: 'パスタ（茹で）',
          name_en: 'Cooked Pasta',
          category: '主食',
          p100: 5.2,
          f100: 0.9,
          c100: 26.9,
          kcal100: 149,
        },

        // タンパク質源
        {
          food_id: 'chicken_breast',
          name_ja: '鶏胸肉（皮なし）',
          name_en: 'Chicken Breast Skinless',
          category: 'タンパク質',
          p100: 22.3,
          f100: 1.5,
          c100: 0,
          kcal100: 108,
        },
        {
          food_id: 'beef_lean',
          name_ja: '牛もも肉（赤身）',
          name_en: 'Lean Beef',
          category: 'タンパク質',
          p100: 21.2,
          f100: 9.6,
          c100: 0.2,
          kcal100: 165,
        },
        {
          food_id: 'salmon',
          name_ja: '鮭',
          name_en: 'Salmon',
          category: 'タンパク質',
          p100: 22.3,
          f100: 4.1,
          c100: 0.1,
          kcal100: 133,
        },
        {
          food_id: 'egg',
          name_ja: '鶏卵',
          name_en: 'Chicken Egg',
          category: 'タンパク質',
          p100: 12.3,
          f100: 10.3,
          c100: 0.3,
          kcal100: 151,
        },
        {
          food_id: 'tofu_silken',
          name_ja: '絹豆腐',
          name_en: 'Silken Tofu',
          category: 'タンパク質',
          p100: 4.9,
          f100: 3.0,
          c100: 1.7,
          kcal100: 56,
        },

        // 野菜
        {
          food_id: 'broccoli',
          name_ja: 'ブロッコリー',
          name_en: 'Broccoli',
          category: '野菜',
          p100: 4.3,
          f100: 0.5,
          c100: 5.2,
          kcal100: 33,
        },
        {
          food_id: 'spinach',
          name_ja: 'ほうれん草',
          name_en: 'Spinach',
          category: '野菜',
          p100: 2.2,
          f100: 0.4,
          c100: 3.1,
          kcal100: 20,
        },
        {
          food_id: 'tomato',
          name_ja: 'トマト',
          name_en: 'Tomato',
          category: '野菜',
          p100: 0.7,
          f100: 0.1,
          c100: 4.7,
          kcal100: 19,
        },

        // 果物
        {
          food_id: 'banana',
          name_ja: 'バナナ',
          name_en: 'Banana',
          category: '果物',
          p100: 1.1,
          f100: 0.2,
          c100: 22.5,
          kcal100: 86,
        },
        {
          food_id: 'apple',
          name_ja: 'りんご',
          name_en: 'Apple',
          category: '果物',
          p100: 0.2,
          f100: 0.1,
          c100: 14.6,
          kcal100: 54,
        },

        // サプリメント・プロテイン
        {
          food_id: 'whey_protein',
          name_ja: 'ホエイプロテイン',
          name_en: 'Whey Protein',
          category: 'サプリ',
          p100: 80.0,
          f100: 5.0,
          c100: 5.0,
          kcal100: 390,
        },
        {
          food_id: 'protein_bar',
          name_ja: 'プロテインバー',
          name_en: 'Protein Bar',
          category: 'サプリ',
          p100: 20.0,
          f100: 8.0,
          c100: 25.0,
          kcal100: 240,
        },
      ];

      let insertedCount = 0;
      for (const food of initialFoods) {
        // 既存データを確認
        const existing = await this.db.getFirstAsync<{ food_id: string }>(
          'SELECT food_id FROM food_db WHERE food_id = ?',
          [food.food_id]
        );

        if (!existing) {
          await this.db.runAsync(
            'INSERT INTO food_db (food_id, name_ja, name_en, category, p100, f100, c100, kcal100, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              food.food_id,
              food.name_ja,
              food.name_en,
              food.category,
              food.p100,
              food.f100,
              food.c100,
              food.kcal100,
              'initial',
            ]
          );
          insertedCount++;
        }
      }
      console.log(`Inserted ${insertedCount} food items`);

      // 初期種目データを投入
      const initialExercises = [
        // 胸
        {
          exercise_id: 1,
          name_ja: 'インクラインベンチプレス',
          name_en: 'Incline Bench Press',
          muscle_group: '胸',
          equipment: 'バーベル',
          is_compound: 1,
        },
        {
          exercise_id: 2,
          name_ja: 'ベンチプレス',
          name_en: 'Bench Press',
          muscle_group: '胸',
          equipment: 'バーベル',
          is_compound: 1,
        },
        {
          exercise_id: 3,
          name_ja: 'チェストフライ',
          name_en: 'Chest Fly',
          muscle_group: '胸',
          equipment: 'ダンベル',
          is_compound: 0,
        },
        {
          exercise_id: 4,
          name_ja: 'ケーブルクロスオーバー',
          name_en: 'Cable Crossover',
          muscle_group: '胸',
          equipment: 'ケーブル',
          is_compound: 0,
        },
        {
          exercise_id: 5,
          name_ja: 'プッシュアップ',
          name_en: 'Push up',
          muscle_group: '胸',
          equipment: '自重',
          is_compound: 1,
        },
        {
          exercise_id: 6,
          name_ja: 'ダンベルプレス',
          name_en: 'Dumbbell Press',
          muscle_group: '胸',
          equipment: 'ダンベル',
          is_compound: 1,
        },

        // 背中
        {
          exercise_id: 7,
          name_ja: 'プルアップ',
          name_en: 'Pull-ups',
          muscle_group: '背中',
          equipment: '自重',
          is_compound: 1,
        },
        {
          exercise_id: 8,
          name_ja: 'ラットプルダウン',
          name_en: 'Lat Pulldowns',
          muscle_group: '背中',
          equipment: 'マシン',
          is_compound: 1,
        },
        {
          exercise_id: 9,
          name_ja: 'ロウイング',
          name_en: 'Rows',
          muscle_group: '背中',
          equipment: 'ケーブル',
          is_compound: 1,
        },
        {
          exercise_id: 10,
          name_ja: 'Tバーロウ',
          name_en: 'T-bar Rows',
          muscle_group: '背中',
          equipment: 'バーベル',
          is_compound: 1,
        },
        {
          exercise_id: 11,
          name_ja: 'フェイスプル',
          name_en: 'Face Pulls',
          muscle_group: '背中',
          equipment: 'ケーブル',
          is_compound: 0,
        },

        // 脚
        {
          exercise_id: 12,
          name_ja: 'スクワット',
          name_en: 'Squat',
          muscle_group: '脚',
          equipment: 'バーベル',
          is_compound: 1,
        },
        {
          exercise_id: 13,
          name_ja: 'デッドリフト',
          name_en: 'Deadlift',
          muscle_group: '脚',
          equipment: 'バーベル',
          is_compound: 1,
        },
        {
          exercise_id: 14,
          name_ja: 'レッグプレス',
          name_en: 'Leg Press',
          muscle_group: '脚',
          equipment: 'マシン',
          is_compound: 1,
        },
        {
          exercise_id: 15,
          name_ja: 'ランジ',
          name_en: 'Lunges',
          muscle_group: '脚',
          equipment: 'ダンベル',
          is_compound: 1,
        },
        {
          exercise_id: 16,
          name_ja: 'レッグカール',
          name_en: 'Leg Curls',
          muscle_group: '脚',
          equipment: 'マシン',
          is_compound: 0,
        },
        {
          exercise_id: 17,
          name_ja: 'カーフレイズ',
          name_en: 'Calf Raises',
          muscle_group: '脚',
          equipment: '自重',
          is_compound: 0,
        },

        // 肩
        {
          exercise_id: 18,
          name_ja: 'ショルダープレス',
          name_en: 'Shoulder Press',
          muscle_group: '肩',
          equipment: 'ダンベル',
          is_compound: 1,
        },
        {
          exercise_id: 19,
          name_ja: 'ラテラルレイズ',
          name_en: 'Lateral Raises',
          muscle_group: '肩',
          equipment: 'ダンベル',
          is_compound: 0,
        },
        {
          exercise_id: 20,
          name_ja: 'フロントレイズ',
          name_en: 'Front Raises',
          muscle_group: '肩',
          equipment: 'ダンベル',
          is_compound: 0,
        },
        {
          exercise_id: 21,
          name_ja: 'リアデルトフライ',
          name_en: 'Rear Delt Fly',
          muscle_group: '肩',
          equipment: 'ダンベル',
          is_compound: 0,
        },
        {
          exercise_id: 22,
          name_ja: 'アップライトロウ',
          name_en: 'Upright Rows',
          muscle_group: '肩',
          equipment: 'バーベル',
          is_compound: 0,
        },

        // 腕
        {
          exercise_id: 23,
          name_ja: 'バイセップカール',
          name_en: 'Bicep Curls',
          muscle_group: '腕',
          equipment: 'ダンベル',
          is_compound: 0,
        },
        {
          exercise_id: 24,
          name_ja: 'トライセップディップ',
          name_en: 'Tricep Dips',
          muscle_group: '腕',
          equipment: '自重',
          is_compound: 0,
        },
        {
          exercise_id: 25,
          name_ja: 'ハンマーカール',
          name_en: 'Hammer Curls',
          muscle_group: '腕',
          equipment: 'ダンベル',
          is_compound: 0,
        },
        {
          exercise_id: 26,
          name_ja: 'トライセッププッシュダウン',
          name_en: 'Tricep Pushdowns',
          muscle_group: '腕',
          equipment: 'ケーブル',
          is_compound: 0,
        },
        {
          exercise_id: 27,
          name_ja: 'プリーチャーカール',
          name_en: 'Preacher Curls',
          muscle_group: '腕',
          equipment: 'マシン',
          is_compound: 0,
        },

        // 有酸素
        {
          exercise_id: 28,
          name_ja: 'トレッドミル',
          name_en: 'Treadmill Running',
          muscle_group: '有酸素',
          equipment: 'マシン',
          is_compound: 0,
        },
        {
          exercise_id: 29,
          name_ja: 'サイクリング',
          name_en: 'Cycling',
          muscle_group: '有酸素',
          equipment: 'マシン',
          is_compound: 0,
        },
        {
          exercise_id: 30,
          name_ja: 'ローイングマシン',
          name_en: 'Rowing Machine',
          muscle_group: '有酸素',
          equipment: 'マシン',
          is_compound: 0,
        },
        {
          exercise_id: 31,
          name_ja: '縄跳び',
          name_en: 'Jump Rope',
          muscle_group: '有酸素',
          equipment: '自重',
          is_compound: 0,
        },
        {
          exercise_id: 32,
          name_ja: '水泳',
          name_en: 'Swimming',
          muscle_group: '有酸素',
          equipment: 'その他',
          is_compound: 0,
        },
        {
          exercise_id: 33,
          name_ja: 'ハイキング',
          name_en: 'Hiking',
          muscle_group: '有酸素',
          equipment: 'その他',
          is_compound: 0,
        },
        // その他
        {
          exercise_id: 34,
          name_ja: '腹筋',
          name_en: 'Sit-ups',
          muscle_group: 'その他',
          equipment: 'その他',
          is_compound: 0,
        },
      ];

      insertedCount = 0;
      for (const exercise of initialExercises) {
        // 既存データを確認
        const existing = await this.db.getFirstAsync<{ exercise_id: number }>(
          'SELECT exercise_id FROM exercise_master WHERE exercise_id = ?',
          [exercise.exercise_id]
        );

        if (!existing) {
          await this.db.runAsync(
            'INSERT INTO exercise_master (exercise_id, name_ja, name_en, muscle_group, equipment, is_compound) VALUES (?, ?, ?, ?, ?, ?)',
            [
              exercise.exercise_id,
              exercise.name_ja,
              exercise.name_en,
              exercise.muscle_group,
              exercise.equipment,
              exercise.is_compound,
            ]
          );
          insertedCount++;
        }
      }
      console.log(`Inserted ${insertedCount} exercise items`);

      console.log('Initial data insertion completed');
    } catch (error) {
      console.error('Error inserting initial data:', error);
      // 初期データの挿入エラーは致命的ではないので、処理を続行
    }
  }

  // public メソッド

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
  async runTransaction(
    callback: (db: SQLite.SQLiteDatabase) => Promise<void>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return await this.db.withTransactionAsync(async () => {
      return await callback(this.db!);
    });
  }

  // データベースの状態確認
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  // データ操作のヘルパーメソッド
  async getAllAsync<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return (await this.db.getAllAsync(sql, params || [])) as T[];
  }

  async getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');
    return (await this.db.getFirstAsync(sql, params || [])) as T | null;
  }

  async runAsync(sql: string, params?: any[]): Promise<SQLite.SQLiteRunResult> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.runAsync(sql, params || []);
  }

  async execAsync(sql: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.execAsync(sql);
  }

  // エクスポート用メソッド
  async exportToJSON(): Promise<string> {
    const data: any = {};

    // 全テーブルのデータを取得
    data.food_db = await this.getAllAsync('SELECT * FROM food_db');
    data.food_log = await this.getAllAsync('SELECT * FROM food_log');
    data.workout_session = await this.getAllAsync(
      'SELECT * FROM workout_session'
    );
    data.workout_set = await this.getAllAsync('SELECT * FROM workout_set');
    data.exercise_master = await this.getAllAsync(
      'SELECT * FROM exercise_master'
    );
    data.user_settings = await this.getAllAsync('SELECT * FROM user_settings');

    return JSON.stringify(data, null, 2);
  }

  // インポート用メソッド
  async importFromJSON(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);

      // トランザクション内で全データをインポート
      await this.runTransaction(async db => {
        // データをインポート
        if (data.food_db) {
          for (const item of data.food_db) {
            await db.runAsync(
              'INSERT OR REPLACE INTO food_db VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              Object.values(item)
            );
          }
        }

        if (data.exercise_master) {
          for (const item of data.exercise_master) {
            await db.runAsync(
              'INSERT OR REPLACE INTO exercise_master VALUES (?, ?, ?, ?, ?, ?)',
              Object.values(item)
            );
          }
        }

        // 他のテーブルも同様に処理
      });

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
