import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface WorkoutCachedResponse {
  key: string;
  response: any;
  timestamp: number;
  expiresAt: number;
  language: string;
}

class WorkoutResponseCache {
  private readonly CACHE_PREFIX = '@workout_cache:';
  private readonly DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4時間
  private readonly MAX_CACHE_SIZE = 20;

  private async generateCacheKey(data: any): Promise<string> {
    try {
      // ワークアウト履歴の特徴を抽出
      const relevantData = {
        workoutCount: data.recentWorkouts?.length || 0,
        totalVolume: Math.round(data.recentWorkouts?.[0]?.totalVolume || 0),
        muscleGroups:
          data.recentWorkouts?.[0]?.exercises
            ?.map((e: any) => e.muscleGroup)
            .sort()
            .join(',') || '',
        lastWorkoutDate: data.recentWorkouts?.[0]?.date || '',
        experience: data.profile?.experience || 'beginner',
        goal: data.profile?.goal || 'maintain',
        weight: Math.round(data.profile?.weight || 70),
        language: data.language || 'en', // 言語を必ず含める
      };

      const jsonString = JSON.stringify(relevantData);
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        jsonString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      return hash.substring(0, 16);
    } catch (error) {
      console.error('Error generating workout cache key:', error);
      return 'workout_fallback_' + Date.now();
    }
  }

  async get(requestData: any): Promise<any | null> {
    try {
      const key = await this.generateCacheKey(requestData);
      const cacheKey = `${this.CACHE_PREFIX}${key}`;

      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache: WorkoutCachedResponse = JSON.parse(cached);

      // 有効期限チェック
      if (Date.now() > parsedCache.expiresAt) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      // 言語が一致しない場合はキャッシュを使わない
      if (parsedCache.language !== (requestData.language || 'en')) {
        return null;
      }

      return parsedCache.response;
    } catch (error) {
      console.error('Workout cache retrieval error:', error);
      return null;
    }
  }

  async set(requestData: any, response: any, ttl?: number): Promise<void> {
    try {
      const key = await this.generateCacheKey(requestData);
      const cacheKey = `${this.CACHE_PREFIX}${key}`;

      const cacheData: WorkoutCachedResponse = {
        key,
        response,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl || this.DEFAULT_TTL),
        language: requestData.language || 'en',
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      await this.cleanupOldCache();

    } catch (error) {
      console.error('Workout cache storage error:', error);
    }
  }

  // 言語変更時の古いキャッシュクリア
  async clearByLanguage(excludeLanguage: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(this.CACHE_PREFIX)
      );

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed: WorkoutCachedResponse = JSON.parse(data);
          if (parsed.language !== excludeLanguage) {
            await AsyncStorage.removeItem(key);
          }
        }
      }

    } catch (error) {
      console.error('Language-specific workout cache clear error:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(this.CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Workout cache clear error:', error);
    }
  }

  private async cleanupOldCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(this.CACHE_PREFIX)
      );

      if (cacheKeys.length <= this.MAX_CACHE_SIZE) return;

      // キャッシュデータを取得してタイムスタンプでソート
      const cacheEntries = await Promise.all(
        cacheKeys.map(async key => {
          const data = await AsyncStorage.getItem(key);
          if (!data) return null;
          try {
            const parsed = JSON.parse(data) as WorkoutCachedResponse;
            return { key, timestamp: parsed.timestamp };
          } catch {
            return { key, timestamp: 0 };
          }
        })
      );

      const validEntries = cacheEntries
        .filter(
          (entry): entry is { key: string; timestamp: number } => entry !== null
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      // 古いキャッシュを削除
      const entriesToDelete = validEntries.slice(
        0,
        validEntries.length - this.MAX_CACHE_SIZE
      );
      const keysToDelete = entriesToDelete.map(entry => entry.key);

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }
    } catch (error) {
      console.error('Workout cache cleanup error:', error);
    }
  }

  async getStats(): Promise<{
    count: number;
    totalSize: number;
    oldestEntry: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(this.CACHE_PREFIX)
      );

      let totalSize = 0;
      let oldestEntry = Date.now();

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          try {
            const parsed = JSON.parse(data) as WorkoutCachedResponse;
            if (parsed.timestamp < oldestEntry) {
              oldestEntry = parsed.timestamp;
            }
          } catch {
            // パースエラーは無視
          }
        }
      }

      return {
        count: cacheKeys.length,
        totalSize,
        oldestEntry: cacheKeys.length > 0 ? oldestEntry : Date.now(),
      };
    } catch (error) {
      console.error('Error getting workout cache stats:', error);
      return { count: 0, totalSize: 0, oldestEntry: Date.now() };
    }
  }
}

export default new WorkoutResponseCache();
