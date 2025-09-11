import {
  NutritionData,
  AIUserProfile,
  FeedbackResponse,
  WorkoutData,
  WorkoutSuggestionResponse,
} from '../types/ai.types';
import { ENV } from '../config/environment';
import AIResponseCache from './cache/AIResponseCache';
import { debounce } from 'lodash';

export class AIFeedbackService {
  private static SUPABASE_URL = ENV.supabase.url;
  private static SUPABASE_ANON_KEY = ENV.supabase.anonKey;
  private static requestCount = 0;
  private static lastRequestTime = 0;
  
  // デバウンス処理（5秒間の遅延）
  private static debouncedFeedback = debounce(
    async (nutrition: NutritionData, profile: AIUserProfile) => {
      return await this.fetchNutritionFeedback(nutrition, profile);
    },
    5000
  );

  /**
   * 栄養フィードバックを取得（キャッシュ付き）
   */
  static async getNutritionFeedback(
    nutrition: NutritionData,
    profile: AIUserProfile
  ): Promise<FeedbackResponse> {
    try {
      // レート制限チェック（1分間に5回まで）
      const now = Date.now();
      if (now - this.lastRequestTime > 60000) {
        this.requestCount = 0;
        this.lastRequestTime = now;
      }
      
      if (this.requestCount >= 5) {
        console.warn('Rate limit reached, using fallback');
        return this.getNutritionFallback(nutrition);
      }

      // キャッシュチェック
      const cached = await AIResponseCache.get({ nutrition, profile });
      if (cached) {
        console.log('Using cached AI response');
        return { ...cached, fromCache: true };
      }

      // 前回のリクエストから短時間なら待機
      if (this.shouldDebounce(nutrition)) {
        console.log('Debouncing request');
        const result = await this.debouncedFeedback(nutrition, profile);
        return result || this.getNutritionFallback(nutrition);
      }

      // 新規リクエスト
      this.requestCount++;
      return await this.fetchNutritionFeedback(nutrition, profile);
    } catch (error) {
      console.error('Error getting nutrition feedback:', error);
      return this.getNutritionFallback(nutrition);
    }
  }

  /**
   * 実際のAPI呼び出し
   */
  private static async fetchNutritionFeedback(
    nutrition: NutritionData,
    profile: AIUserProfile
  ): Promise<FeedbackResponse> {
    const response = await fetch(
      `${this.SUPABASE_URL}/functions/v1/nutrition-feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ nutrition, profile }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Nutrition feedback received from API');
    
    // キャッシュに保存
    await AIResponseCache.set({ nutrition, profile }, result);
    
    return result;
  }

  /**
   * デバウンスが必要かどうかを判定
   */
  private static shouldDebounce(nutrition: NutritionData): boolean {
    // 目標達成率が80%以上または20%以下ならデバウンス不要（重要な変更）
    const achievementRate = nutrition.calories / (nutrition.targetCalories || 1);
    return achievementRate >= 0.2 && achievementRate <= 0.8;
  }

  /**
   * ワークアウト提案を取得
   */
  static async getWorkoutSuggestion(
    recentWorkouts: WorkoutData[],
    profile: AIUserProfile
  ): Promise<WorkoutSuggestionResponse> {
    try {
      console.log('Requesting workout suggestion...');

      const response = await fetch(
        `${this.SUPABASE_URL}/functions/v1/workout-suggestion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ recentWorkouts, profile }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Workout suggestion received');

      return result;
    } catch (error) {
      console.error('Error getting workout suggestion:', error);

      // オフライン時またはエラー時のフォールバック
      return this.getWorkoutFallback(recentWorkouts);
    }
  }

  /**
   * 栄養フィードバックのフォールバック
   */
  private static getNutritionFallback(
    nutrition: NutritionData
  ): FeedbackResponse {
    const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
    const calorieGap = Math.max(
      0,
      nutrition.targetCalories - nutrition.calories
    );
    const proteinAchievement =
      (nutrition.protein / nutrition.targetProtein) * 100;

    let feedback = '栄養記録お疲れ様です！';
    const suggestions: string[] = [];
    const actionItems: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      reason: string;
    }> = [];

    if (proteinGap > 20) {
      feedback = `タンパク質が約${Math.round(proteinGap)}g不足しています。`;
      suggestions.push(
        'サラダチキン（約25g）を追加',
        'プロテインドリンク（約20g）を飲む',
        '卵2個（約12g）をプラス'
      );
      actionItems.push({
        priority: 'high',
        action: 'サラダチキンまたはプロテインを摂取',
        reason: '筋肉の維持・成長に必要',
      });
    } else if (proteinAchievement >= 80) {
      feedback = 'タンパク質の摂取量は良好です！';
      suggestions.push(
        '水分補給を忘れずに',
        'バランスの良い食事を継続',
        '食事の時間も意識してみましょう'
      );
    } else {
      suggestions.push(
        'タンパク質をもう少し増やしましょう',
        'カロリーバランスも確認してみてください'
      );
    }

    if (calorieGap > 300) {
      actionItems.push({
        priority: 'medium',
        action: 'おにぎりやバナナなどでエネルギー補給',
        reason: '基礎代謝の維持',
      });
    }

    return {
      success: false,
      feedback,
      suggestions,
      actionItems,
      error: 'ネットワーク接続を確認してください',
    };
  }

  /**
   * ワークアウト提案のフォールバック
   */
  private static getWorkoutFallback(
    recentWorkouts: WorkoutData[]
  ): WorkoutSuggestionResponse {
    // 最近のワークアウトから使用頻度の低い筋群を特定
    const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    const workoutHistory = recentWorkouts.flatMap(w =>
      w.exercises.map(e => e.muscleGroup)
    );

    // 最も使用頻度の低い筋群を選択
    const underused = muscleGroups.filter(
      muscle => !workoutHistory.includes(muscle)
    );

    const targetMuscles =
      underused.length > 0 ? underused.slice(0, 2) : ['chest', 'arms'];

    return {
      success: false,
      nextWorkout: {
        targetMuscleGroups: targetMuscles,
        recommendedExercises: [
          {
            name: 'プッシュアップ',
            sets: 3,
            reps: '10-15',
            notes: '自重で基本的な胸筋トレーニング',
          },
          {
            name: 'プランク',
            sets: 3,
            reps: '30秒',
            notes: 'コア強化の基本種目',
          },
        ],
        estimatedDuration: 30,
      },
      feedback: 'オフライン時の基本的なワークアウト提案です。',
      error: 'AI提案機能が利用できません',
    };
  }

  /**
   * サービスの健全性チェック
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // 簡単なヘルスチェック
      const testData = {
        calories: 1500,
        protein: 50,
        carbs: 150,
        fat: 50,
        targetCalories: 2000,
        targetProtein: 100,
        targetCarbs: 200,
        targetFat: 70,
        meals: [],
      };

      const testProfile = {
        age: 30,
        weight: 70,
        height: 175,
        goal: 'maintain' as const,
        activityLevel: 'moderate',
        gender: 'male' as const,
      };

      const result = await this.getNutritionFeedback(testData, testProfile);
      return !!result; // レスポンスがあればOK
    } catch (error) {
      console.warn('AI service health check failed:', error);
      return false;
    }
  }

  /**
   * キャッシュをクリア
   */
  static async clearCache(): Promise<void> {
    await AIResponseCache.clearAll();
    this.requestCount = 0;
    console.log('AI feedback cache cleared');
  }

  /**
   * キャッシュ統計情報を取得
   */
  static async getCacheStats(): Promise<{ count: number; totalSize: number; oldestEntry: number }> {
    return await AIResponseCache.getStats();
  }

  /**
   * バッチ処理でワークアウト提案を取得（将来実装用）
   */
  static async getWorkoutSuggestionBatch(
    workoutsList: WorkoutData[][],
    profile: AIUserProfile
  ): Promise<WorkoutSuggestionResponse[]> {
    // 複数のワークアウトを一度に処理する場合の実装
    // 現在は単体処理のみ対応
    const results = [];
    for (const workouts of workoutsList) {
      const result = await this.getWorkoutSuggestion(workouts, profile);
      results.push(result);
    }
    return results;
  }
}
