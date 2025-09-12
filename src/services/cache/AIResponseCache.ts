import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface CachedResponse {
  key: string;
  response: any;
  timestamp: number;
  expiresAt: number;
}

class AIResponseCache {
  private readonly CACHE_PREFIX = '@ai_cache:';
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1時間
  private readonly MAX_CACHE_SIZE = 50; // 最大50件のキャッシュ

  /**
   * リクエストデータからキャッシュキーを生成
   */
  private async generateCacheKey(data: any): Promise<string> {
    try {
      // 重要な栄養データと言語設定を使用してキーを生成
      const relevantData = {
        calories: data.nutrition?.calories ? Math.round(data.nutrition.calories / 50) * 50 : 0, // 50kcal単位で丸める
        protein: data.nutrition?.protein ? Math.round(data.nutrition.protein / 5) * 5 : 0,     // 5g単位で丸める
        carbs: data.nutrition?.carbs ? Math.round(data.nutrition.carbs / 10) * 10 : 0,       // 10g単位で丸める
        fat: data.nutrition?.fat ? Math.round(data.nutrition.fat / 5) * 5 : 0,             // 5g単位で丸める
        goal: data.profile?.goal || 'maintain',
        targetCalories: data.nutrition?.targetCalories ? Math.round(data.nutrition.targetCalories / 100) * 100 : 0, // 100kcal単位
        language: data.language || 'en', // 言語設定を追加
      };
      
      const jsonString = JSON.stringify(relevantData);
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        jsonString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return hash.substring(0, 16); // 最初の16文字を使用
    } catch (error) {
      console.error('Error generating cache key:', error);
      return 'fallback_key_' + Date.now();
    }
  }

  /**
   * キャッシュから取得
   */
  async get(requestData: any): Promise<any | null> {
    try {
      const key = await this.generateCacheKey(requestData);
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const parsedCache: CachedResponse = JSON.parse(cached);
      
      // 有効期限チェック
      if (Date.now() > parsedCache.expiresAt) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      console.log('Cache hit for AI response');
      return parsedCache.response;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * キャッシュに保存
   */
  async set(requestData: any, response: any, ttl?: number): Promise<void> {
    try {
      const key = await this.generateCacheKey(requestData);
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      
      const cacheData: CachedResponse = {
        key,
        response,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl || this.DEFAULT_TTL),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // キャッシュサイズ管理
      await this.cleanupOldCache();
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * 古いキャッシュをクリーンアップ
   */
  private async cleanupOldCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (cacheKeys.length <= this.MAX_CACHE_SIZE) return;
      
      // タイムスタンプでソートして古いものを削除
      const cacheEntries = await Promise.all(
        cacheKeys.map(async (key) => {
          const data = await AsyncStorage.getItem(key);
          return { key, data: data ? JSON.parse(data) : null };
        })
      );
      
      const validEntries = cacheEntries.filter(entry => entry.data);
      validEntries
        .sort((a, b) => a.data.timestamp - b.data.timestamp)
        .slice(0, validEntries.length - this.MAX_CACHE_SIZE)
        .forEach(async (entry) => {
          await AsyncStorage.removeItem(entry.key);
        });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * 全キャッシュクリア
   */
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('AI cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * 類似データかどうかを判定
   */
  isSimilarData(data1: any, data2: any, threshold: number = 0.1): boolean {
    try {
      // 10%以内の差なら類似とみなす
      const calories1 = data1.nutrition?.calories || 0;
      const calories2 = data2.nutrition?.calories || 0;
      const protein1 = data1.nutrition?.protein || 0;
      const protein2 = data2.nutrition?.protein || 0;
      
      if (calories1 === 0 || protein1 === 0) return false;
      
      const caloriesDiff = Math.abs(calories1 - calories2) / calories1;
      const proteinDiff = Math.abs(protein1 - protein2) / protein1;
      
      return caloriesDiff < threshold && proteinDiff < threshold;
    } catch (error) {
      console.error('Error comparing data similarity:', error);
      return false;
    }
  }

  /**
   * キャッシュ統計情報を取得
   */
  async getStats(): Promise<{ count: number; totalSize: number; oldestEntry: number }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      let oldestEntry = Date.now();
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          const parsed = JSON.parse(data);
          if (parsed.timestamp < oldestEntry) {
            oldestEntry = parsed.timestamp;
          }
        }
      }
      
      return {
        count: cacheKeys.length,
        totalSize,
        oldestEntry
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { count: 0, totalSize: 0, oldestEntry: Date.now() };
    }
  }
}

export default new AIResponseCache();