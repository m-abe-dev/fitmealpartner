import {
  NutritionData,
  UserProfile,
  FeedbackResponse,
  WorkoutData,
  WorkoutSuggestionResponse,
} from '../types/ai.types';
import { ENV } from '../config/environment';
import NutritionResponseCache from './cache/NutritionResponseCache';
import WorkoutResponseCache from './cache/WorkoutResponseCache';
import { debounce } from 'lodash';
import * as Localization from 'expo-localization';

export class AIFeedbackService {
  private static SUPABASE_URL = ENV.supabase.url;
  private static SUPABASE_ANON_KEY = ENV.supabase.anonKey;
  private static requestCount = 0;
  private static lastRequestTime = 0;
  
  // 開発用：手動言語設定（__DEV__ 環境でのみ使用）
  private static manualLanguageOverride: string | null = null;
  
  
  /**
   * 開発用：言語設定を手動で上書き
   */
  static setManualLanguageOverride(language: string | null): void {
    if (__DEV__) {
      this.manualLanguageOverride = language;
      console.log('Manual language override set:', language);
    }
  }

  /**
   * デバイスの言語設定を取得
   */
  private static getDeviceLanguage(): string {
    // 開発用：手動上書きがある場合はそれを使用
    if (__DEV__ && this.manualLanguageOverride) {
      console.log('Using manual language override:', this.manualLanguageOverride);
      return this.manualLanguageOverride;
    }

    try {
      const locales = Localization.getLocales();
      
      if (locales && locales.length > 0) {
        const locale = locales[0];
        const languageTag = locale.languageTag || '';
        const languageCode = locale.languageCode || '';
        
        // 対応言語のチェック
        const supportedLanguages = {
          'ja': ['ja'],
          'en': ['en'],
          'es': ['es'],
          'fr': ['fr']
        };
        
        // languageTagから判定（例: "ja-JP", "en-US", "es-ES", "fr-FR"）
        for (const [lang, prefixes] of Object.entries(supportedLanguages)) {
          if (prefixes.some(prefix => languageTag.startsWith(prefix))) {
            console.log(`Device language detected: ${lang} (from languageTag: ${languageTag})`);
            return lang;
          }
        }
        
        // languageCodeから判定（フォールバック）
        for (const [lang, codes] of Object.entries(supportedLanguages)) {
          if (codes.includes(languageCode)) {
            console.log(`Device language detected: ${lang} (from languageCode: ${languageCode})`);
            return lang;
          }
        }

        console.log('Unsupported language detected:', { languageTag, languageCode });
      }
    } catch (error) {
      console.error('Error getting device language:', error);
    }
    
    return 'en'; // デフォルトは英語
  }
  
  // デバウンス処理（5秒間の遅延）
  private static debouncedFeedback = debounce(
    async (
      nutrition: NutritionData, 
      profile: UserProfile,
      additionalContext?: {
        yesterdayData?: any;
        mealCount?: number;
      }
    ) => {
      return await this.fetchNutritionFeedback(nutrition, profile, additionalContext);
    },
    5000
  );

  /**
   * 栄養フィードバックを取得（キャッシュ付き）
   */
  static async getNutritionFeedback(
    nutrition: NutritionData,
    profile: UserProfile,
    additionalContext?: {
      yesterdayData?: any;
      mealCount?: number;
      mealTypeData?: any;
    }
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

      // 言語設定を取得
      const language = this.getDeviceLanguage();
      
      console.log('=== AIFeedbackService.getNutritionFeedback Debug ===');
      console.log('Detected language in service:', language);
      console.log('Cache key data:', { nutrition: !!nutrition, profile: !!profile, language });
      
      // キャッシュチェック（言語情報も含める）
      const cached = await NutritionResponseCache.get({ nutrition, profile, language });
      if (cached) {
        console.log('Using cached nutrition feedback for language:', language);
        return { ...cached, fromCache: true };
      } else {
        console.log('No cache found, making API request for language:', language);
      }

      // 前回のリクエストから短時間なら待機
      if (this.shouldDebounce(nutrition)) {
        const result = await this.debouncedFeedback(nutrition, profile, additionalContext);
        return result || this.getNutritionFallback(nutrition);
      }

      // 新規リクエスト
      this.requestCount++;
      return await this.fetchNutritionFeedback(nutrition, profile, additionalContext);
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
    profile: UserProfile,
    additionalContext?: {
      yesterdayData?: any;
      mealCount?: number;
      mealTypeData?: any;
    }
  ): Promise<FeedbackResponse> {
    // デバイスの言語設定を取得
    const language = this.getDeviceLanguage();
    
    const requestBody = { 
      nutrition, 
      profile, 
      language,
      mealCount: additionalContext?.mealCount || 0,
      yesterdayData: additionalContext?.yesterdayData || null,
      mealTypeData: additionalContext?.mealTypeData || null
    };
    
    const response = await fetch(
      `${this.SUPABASE_URL}/functions/v1/nutrition-feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // キャッシュに保存（言語情報も含める）
    await NutritionResponseCache.set({ nutrition, profile, language }, result);
    
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
    profile: UserProfile
  ): Promise<WorkoutSuggestionResponse> {
    try {
      // デバイスの言語設定を取得
      const language = this.getDeviceLanguage();
      
      // 経験レベルをデフォルト値で設定
      const profileWithExperience = {
        ...profile,
        experience: profile.experience || 'beginner'
      };

      const cacheData = { 
        recentWorkouts, 
        profile: profileWithExperience, 
        language 
      };

      // ワークアウトキャッシュチェック
      const cached = await WorkoutResponseCache.get(cacheData);
      if (cached) {
        console.log('Using cached workout suggestion for language:', language);
        return { ...cached, fromCache: true };
      }

      const requestBody = { 
        recentWorkouts, 
        profile: profileWithExperience, 
        language 
      };

      const response = await fetch(
        `${this.SUPABASE_URL}/functions/v1/workout-suggestion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // ワークアウトキャッシュに保存
      await WorkoutResponseCache.set(cacheData, result);
      
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
    const language = this.getDeviceLanguage();
    console.log('=== Fallback Debug ===');
    console.log('Language in fallback:', language);
    
    const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
    const calorieGap = Math.max(0, nutrition.targetCalories - nutrition.calories);
    const proteinAchievement = (nutrition.protein / nutrition.targetProtein) * 100;

    // 言語別のフォールバックメッセージ
    const fallbackMessages = {
      en: {
        lowProtein: `You're about ${Math.round(proteinGap)}g short on protein.`,
        goodProtein: 'Your protein intake looks good!',
        keepTrack: 'Keep up the great work with tracking!',
        suggestions: {
          addProtein: [
            'Add chicken breast (about 25g protein per 100g)',
            'Protein shake or Greek yogurt (15-20g)',
            'Include eggs or tofu (10-15g protein)'
          ],
          maintain: [
            'Keep staying hydrated',
            'Continue your balanced diet',
            'Consider meal timing for optimal results'
          ],
          addMore: [
            'Try adding a bit more protein',
            'Check your calorie balance as well'
          ]
        },
        action: {
          high: 'Add protein-rich foods to your next meal',
          medium: 'Add healthy snacks like nuts or fruits for energy',
          highReason: 'Support muscle recovery and growth',
          mediumReason: 'Maintain your metabolism'
        },
        error: 'Please check your network connection'
      },
      es: {
        lowProtein: `Te faltan aproximadamente ${Math.round(proteinGap)}g de proteína.`,
        goodProtein: '¡Tu ingesta de proteínas se ve bien!',
        keepTrack: '¡Excelente trabajo registrando tus comidas!',
        suggestions: {
          addProtein: [
            'Agrega pechuga de pollo (unos 25g de proteína por 100g)',
            'Batido de proteínas o yogur griego (15-20g)',
            'Incluye huevos o tofu (10-15g de proteína)'
          ],
          maintain: [
            'Mantente hidratado',
            'Continúa con tu dieta equilibrada',
            'Considera el horario de las comidas para resultados óptimos'
          ],
          addMore: [
            'Intenta agregar un poco más de proteína',
            'Verifica también tu balance calórico'
          ]
        },
        action: {
          high: 'Agrega alimentos ricos en proteínas a tu próxima comida',
          medium: 'Agrega snacks saludables como nueces o frutas para energía',
          highReason: 'Apoya la recuperación y el crecimiento muscular',
          mediumReason: 'Mantén tu metabolismo'
        },
        error: 'Por favor verifica tu conexión a internet'
      },
      fr: {
        lowProtein: `Il vous manque environ ${Math.round(proteinGap)}g de protéines.`,
        goodProtein: 'Votre apport en protéines semble bon!',
        keepTrack: 'Excellent travail pour suivre votre alimentation!',
        suggestions: {
          addProtein: [
            'Ajoutez de la poitrine de poulet (environ 25g de protéines pour 100g)',
            'Shake protéiné ou yaourt grec (15-20g)',
            'Incluez des œufs ou du tofu (10-15g de protéines)'
          ],
          maintain: [
            'Restez hydraté',
            'Continuez votre régime équilibré',
            'Considérez le timing des repas pour des résultats optimaux'
          ],
          addMore: [
            'Essayez d\'ajouter un peu plus de protéines',
            'Vérifiez aussi votre équilibre calorique'
          ]
        },
        action: {
          high: 'Ajoutez des aliments riches en protéines à votre prochain repas',
          medium: 'Ajoutez des collations saines comme des noix ou des fruits pour l\'énergie',
          highReason: 'Soutient la récupération et la croissance musculaire',
          mediumReason: 'Maintenez votre métabolisme'
        },
        error: 'Veuillez vérifier votre connexion internet'
      },
      ja: {
        lowProtein: `タンパク質が約${Math.round(proteinGap)}g不足しています。`,
        goodProtein: 'タンパク質の摂取量は良好です！',
        keepTrack: '栄養記録お疲れ様です！',
        suggestions: {
          addProtein: [
            'サラダチキン（約25g）を追加',
            'プロテインドリンク（約20g）を飲む',
            '卵2個（約12g）をプラス'
          ],
          maintain: [
            '水分補給を忘れずに',
            'バランスの良い食事を継続',
            '食事の時間も意識してみましょう'
          ],
          addMore: [
            'タンパク質をもう少し増やしましょう',
            'カロリーバランスも確認してみてください'
          ]
        },
        action: {
          high: 'サラダチキンまたはプロテインを摂取',
          medium: 'おにぎりやバナナなどでエネルギー補給',
          highReason: '筋肉の維持・成長に必要',
          mediumReason: '基礎代謝の維持'
        },
        error: 'ネットワーク接続を確認してください'
      }
    };

    // 言語が存在しない場合は英語をデフォルトとする
    const messages = fallbackMessages[language] || fallbackMessages.en;
    console.log('Using fallback messages for language:', language);
    console.log('Messages object exists:', !!messages);
    
    let feedback: string;
    const suggestions: string[] = [];
    const actionItems: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      reason: string;
    }> = [];

    if (proteinGap > 20) {
      feedback = messages.lowProtein;
      suggestions.push(...messages.suggestions.addProtein);
      actionItems.push({
        priority: 'high',
        action: messages.action.high,
        reason: messages.action.highReason,
      });
    } else if (proteinAchievement >= 80) {
      feedback = messages.goodProtein;
      suggestions.push(...messages.suggestions.maintain);
    } else {
      feedback = messages.keepTrack;
      suggestions.push(...messages.suggestions.addMore);
    }

    if (calorieGap > 300) {
      actionItems.push({
        priority: 'medium',
        action: messages.action.medium,
        reason: messages.action.mediumReason,
      });
    }

    console.log('Final fallback feedback:', feedback);
    console.log('Final fallback suggestions:', suggestions);

    return {
      success: false,
      feedback,
      suggestions,
      actionItems,
      error: messages.error,
    };
  }

  /**
   * ワークアウト提案のフォールバック
   */
  private static getWorkoutFallback(
    recentWorkouts: WorkoutData[]
  ): WorkoutSuggestionResponse {
    const language = this.getDeviceLanguage();
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

    if (language === 'en') {
      return {
        success: false,
        nextWorkout: {
          targetMuscleGroups: targetMuscles,
          recommendedExercises: [
            {
              name: 'Push-ups',
              sets: 3,
              reps: '10-15',
              notes: 'Basic chest exercise using body weight',
            },
            {
              name: 'Plank',
              sets: 3,
              reps: '30 seconds',
              notes: 'Core strengthening exercise',
            },
          ],
          estimatedDuration: 30,
        },
        feedback: 'Basic workout suggestions for offline mode.',
        error: 'AI suggestion feature is temporarily unavailable',
      };
    } else {
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
   * 言語変更時のキャッシュ処理
   */
  static async onLanguageChange(newLanguage: string): Promise<void> {
    try {
      // 新しい言語以外のキャッシュをクリア
      await WorkoutResponseCache.clearByLanguage(newLanguage);
      await NutritionResponseCache.clearAll(); // 栄養キャッシュも全クリア
      this.requestCount = 0;
      console.log(`Cache cleared for language change to: ${newLanguage}`);
    } catch (error) {
      console.error('Error during language change cache management:', error);
    }
  }

  /**
   * キャッシュをクリア
   */
  static async clearCache(): Promise<void> {
    await NutritionResponseCache.clearAll();
    await WorkoutResponseCache.clearAll();
    this.requestCount = 0;
    console.log('All AI feedback cache cleared');
  }

  /**
   * キャッシュ統計情報を取得
   */
  static async getCacheStats(): Promise<{ 
    nutrition: { count: number; totalSize: number; oldestEntry: number };
    workout: { count: number; totalSize: number; oldestEntry: number };
  }> {
    const nutritionStats = await NutritionResponseCache.getStats();
    const workoutStats = await WorkoutResponseCache.getStats();
    
    return {
      nutrition: nutritionStats,
      workout: workoutStats,
    };
  }

  /**
   * バッチ処理でワークアウト提案を取得（将来実装用）
   */
  static async getWorkoutSuggestionBatch(
    workoutsList: WorkoutData[][],
    profile: UserProfile
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
