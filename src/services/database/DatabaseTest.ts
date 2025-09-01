import DatabaseService from './DatabaseService';
import FoodRepository from './repositories/FoodRepository';
import WorkoutRepository from './repositories/WorkoutRepository';
import UserRepository from './repositories/UserRepository';

export class DatabaseTest {
  
  static async runAllTests(): Promise<boolean> {
    try {
      // Starting database tests...
      
      // データベース初期化テスト
      await this.testDatabaseInitialization();
      
      // ユーザー設定テスト
      await this.testUserRepository();
      
      // 食品関連テスト
      await this.testFoodRepository();
      
      // ワークアウト関連テスト
      await this.testWorkoutRepository();
      
      // All database tests passed
      return true;
      
    } catch (error) {
      return false;
    }
  }

  static async testDatabaseInitialization(): Promise<void> {
    // Testing database initialization...
    
    // データベースを初期化
    await DatabaseService.initialize();
    
    // 初期化済みかチェック
    if (!DatabaseService.isReady()) {
      throw new Error('Database initialization failed');
    }
    
    // Database initialization test passed
  }

  static async testUserRepository(): Promise<void> {
    // Testing UserRepository...
    
    const testUserId = 'test-user-001';
    
    // テストユーザー設定を作成
    const testSettings = {
      user_id: testUserId,
      goal: 'cut' as const,
      target_kcal: 2000,
      target_protein_g: 150,
      target_fat_g: 67,
      target_carb_g: 200,
      weight_kg: 70,
      height_cm: 175,
      birth_year: 1990,
      gender: 'male' as const,
      activity_level: 'moderately_active' as const,
      preferred_unit: 'metric' as const
    };
    
    // ユーザー設定を保存
    await UserRepository.saveUserSettings(testSettings);
    
    // ユーザー設定を取得
    const retrievedSettings = await UserRepository.getUserSettings(testUserId);
    if (!retrievedSettings || retrievedSettings.user_id !== testUserId) {
      throw new Error('User settings save/retrieve failed');
    }
    
    // プロフィール取得（計算値含む）
    const profile = await UserRepository.getUserProfile(testUserId);
    if (!profile || profile.age < 0 || profile.bmi < 10) {
      throw new Error('User profile calculation failed');
    }
    
    // オンボーディング完了チェック
    const isCompleted = await UserRepository.isOnboardingCompleted(testUserId);
    if (!isCompleted) {
      throw new Error('Onboarding completion check failed');
    }
    
    // UserRepository test passed
  }

  static async testFoodRepository(): Promise<void> {
    // Testing FoodRepository...
    
    const testUserId = 'test-user-001';
    const today = new Date().toISOString().split('T')[0];
    
    // 食品検索テスト（初期データで）
    const searchResults = await FoodRepository.searchFoods('鶏胸肉');
    if (searchResults.length === 0) {
      throw new Error('Food search failed');
    }
    
    const testFood = searchResults[0];
    // Found food
    
    // 栄養計算テスト
    const nutrition = FoodRepository.calculateNutrition(testFood, 150);
    if (nutrition.kcal <= 0) {
      throw new Error('Nutrition calculation failed');
    }
    
    // 食事ログを追加
    const logId = await FoodRepository.logFood({
      user_id: testUserId,
      date: today,
      meal_type: 'lunch',
      food_id: testFood.food_id,
      food_name: testFood.name_ja,
      amount_g: 150,
      protein_g: nutrition.protein_g,
      fat_g: nutrition.fat_g,
      carb_g: nutrition.carb_g,
      kcal: nutrition.kcal
    });
    
    if (!logId) {
      throw new Error('Food log creation failed');
    }
    
    // 食事ログを取得
    const todayLogs = await FoodRepository.getFoodLogsByDate(testUserId, today);
    if (todayLogs.length === 0) {
      throw new Error('Food log retrieval failed');
    }
    
    // 栄養サマリーを取得
    const summary = await FoodRepository.getNutritionSummary(testUserId, today);
    if (summary.total_kcal <= 0) {
      throw new Error('Nutrition summary calculation failed');
    }
    
    // Daily nutrition calculated
    
    // FoodRepository test passed
  }

  static async testWorkoutRepository(): Promise<void> {
    // Testing WorkoutRepository...
    
    const testUserId = 'test-user-001';
    const today = new Date().toISOString().split('T')[0];
    
    // 種目検索テスト
    const exerciseResults = await WorkoutRepository.searchExercises('ベンチプレス');
    if (exerciseResults.length === 0) {
      throw new Error('Exercise search failed');
    }
    
    const testExercise = exerciseResults[0];
    // Found exercise
    
    // ワークアウトセッションを開始
    const sessionId = await WorkoutRepository.startWorkoutSession({
      user_id: testUserId,
      date: today,
      start_time: new Date().toISOString(),
      notes: 'テストワークアウト'
    });
    
    if (!sessionId) {
      throw new Error('Workout session creation failed');
    }
    
    // セットを追加
    const setId1 = await WorkoutRepository.addWorkoutSet({
      session_id: sessionId,
      exercise_id: testExercise.exercise_id,
      set_number: 1,
      weight_kg: 60,
      reps: 10,
      rpe: 7
    });
    
    const setId2 = await WorkoutRepository.addWorkoutSet({
      session_id: sessionId,
      exercise_id: testExercise.exercise_id,
      set_number: 2,
      weight_kg: 62.5,
      reps: 8,
      rpe: 8
    });
    
    if (!setId1 || !setId2) {
      throw new Error('Workout set creation failed');
    }
    
    // セッションを終了
    await WorkoutRepository.endWorkoutSession(sessionId);
    
    // セッションとセットを取得
    const sessionWithSets = await WorkoutRepository.getWorkoutSessionWithSets(sessionId);
    if (!sessionWithSets || sessionWithSets.sets.length !== 2) {
      throw new Error('Workout session retrieval failed');
    }
    
    // Workout volume calculated
    
    // ワークアウトサマリーを取得
    const summaries = await WorkoutRepository.getWorkoutSummary(testUserId, today, today);
    if (summaries.length === 0) {
      throw new Error('Workout summary calculation failed');
    }
    
    // Daily workout calculated
    
    // WorkoutRepository test passed
  }

  static async cleanupTestData(): Promise<void> {
    // Cleaning up test data...
    
    const testUserId = 'test-user-001';
    
    try {
      // テストユーザーのデータを削除
      await UserRepository.deleteAllUserData(testUserId);
      // Test data cleanup completed
    } catch (error) {
      // Test data cleanup failed (this is ok for initial tests)
    }
  }
}

// テスト実行用の関数をエクスポート
export const runDatabaseTests = async (): Promise<boolean> => {
  const success = await DatabaseTest.runAllTests();
  if (success) {
    await DatabaseTest.cleanupTestData();
  }
  return success;
};