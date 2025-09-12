import { useState, useEffect, useRef, useCallback } from 'react';
import { AIFeedbackService } from '../services/AIFeedbackService';
import AIResponseCache from '../services/cache/AIResponseCache';
import { NutritionData, UserProfile, FeedbackResponse } from '../types/ai.types';

interface UseOptimizedAIFeedbackOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // ミリ秒
  enableCache?: boolean;
}

export const useOptimizedAIFeedback = (options: UseOptimizedAIFeedbackOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5分間隔
    enableCache = true
  } = options;

  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState({ count: 0, totalSize: 0, oldestEntry: Date.now() });

  const lastRequestRef = useRef<string>('');
  const requestCountRef = useRef(0);
  const lastSuccessfulDataRef = useRef<{ nutrition: NutritionData; profile: UserProfile } | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 最適化されたフィードバック取得
   */
  const getFeedback = useCallback(async (
    nutrition: NutritionData,
    profile: UserProfile,
    force: boolean = false
  ): Promise<FeedbackResponse | null> => {
    try {
      // リクエストの重複チェック
      const requestKey = JSON.stringify({ 
        calories: Math.round(nutrition.calories / 10) * 10, // 10kcal単位で丸める
        protein: Math.round(nutrition.protein / 2) * 2,    // 2g単位で丸める
        goal: profile.goal 
      });

      if (!force && requestKey === lastRequestRef.current && feedback && !feedback.fromCache) {
        console.log('Skipping duplicate request');
        return feedback;
      }

      // 類似データのチェック（キャッシュが有効な場合）
      if (enableCache && lastSuccessfulDataRef.current && !force) {
        const isSimilar = AIResponseCache.isSimilarData(
          { nutrition: lastSuccessfulDataRef.current.nutrition, profile: lastSuccessfulDataRef.current.profile },
          { nutrition, profile },
          0.05 // 5%以内の差
        );
        
        if (isSimilar && feedback) {
          console.log('Using similar cached data');
          return feedback;
        }
      }

      setLoading(true);
      setError(null);

      const result = await AIFeedbackService.getNutritionFeedback(nutrition, profile);
      
      setFeedback(result);
      lastRequestRef.current = requestKey;
      lastSuccessfulDataRef.current = { nutrition, profile };
      requestCountRef.current++;

      console.log('AI feedback received:', result.fromCache ? 'from cache' : 'from API');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to get AI feedback:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [feedback, enableCache]);

  /**
   * 自動リフレッシュの設定
   */
  const setupAutoRefresh = useCallback((nutrition: NutritionData, profile: UserProfile) => {
    if (!autoRefresh) return;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(async () => {
      // 目標達成率が低い場合のみ自動リフレッシュ
      const achievementRate = nutrition.calories / (nutrition.targetCalories || 1);
      if (achievementRate < 0.7) {
        console.log('Auto refreshing AI feedback');
        await getFeedback(nutrition, profile, true);
      }
    }, refreshInterval);
  }, [autoRefresh, refreshInterval, getFeedback]);

  /**
   * キャッシュをクリア
   */
  const clearCache = useCallback(async () => {
    try {
      await AIFeedbackService.clearCache();
      setFeedback(null);
      setError(null);
      lastRequestRef.current = '';
      lastSuccessfulDataRef.current = null;
      requestCountRef.current = 0;
      console.log('Cache cleared successfully');
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  /**
   * キャッシュ統計を更新
   */
  const updateCacheStats = useCallback(async () => {
    try {
      const stats = await AIFeedbackService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.error('Failed to get cache stats:', err);
    }
  }, []);

  /**
   * フィードバックを強制更新
   */
  const forceRefresh = useCallback(async (nutrition: NutritionData, profile: UserProfile) => {
    return await getFeedback(nutrition, profile, true);
  }, [getFeedback]);

  /**
   * 接続テスト
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      // testConnectionメソッドが存在しない場合のフォールバック
      if ('testConnection' in AIFeedbackService && typeof AIFeedbackService.testConnection === 'function') {
        const isHealthy = await (AIFeedbackService as any).testConnection();
        if (!isHealthy) {
          setError('AI service is not available');
        }
        return isHealthy;
      } else {
        // フォールバック: 簡単なテストリクエストを送信
        const testResult = await getFeedback({
          calories: 2000,
          protein: 100,
          carbs: 250,
          fat: 70,
          targetCalories: 2000,
          targetProtein: 120,
          targetCarbs: 250,
          targetFat: 70,
          meals: []
        }, {
          age: 30,
          weight: 70,
          height: 175,
          goal: 'maintain',
          activityLevel: 'moderate',
          gender: 'male'
        });
        return testResult !== null;
      }
    } catch (err) {
      setError('Connection test failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getFeedback]);

  // キャッシュ統計を定期的に更新
  useEffect(() => {
    updateCacheStats();
    const statsInterval = setInterval(updateCacheStats, 30000); // 30秒毎
    
    return () => clearInterval(statsInterval);
  }, [updateCacheStats]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    feedback,
    loading,
    error,
    cacheStats,
    requestCount: requestCountRef.current,
    
    // メソッド
    getFeedback,
    clearCache,
    forceRefresh,
    testConnection,
    setupAutoRefresh,
    updateCacheStats,
  };
};