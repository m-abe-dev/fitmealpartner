import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from './database/DatabaseService';

class StreakService {
  private static instance: StreakService;

  private constructor() {}

  public static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  // 連続記録日数を更新
  async updateStreak(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0];

      // 今日の食事記録があるかチェック
      const todayLogs = await this.checkTodayLogs(today);

      if (todayLogs) {
        const lastRecordDate = await AsyncStorage.getItem('lastRecordDate');
        let currentStreak = parseInt(
          (await AsyncStorage.getItem('currentStreak')) || '0'
        );

        if (lastRecordDate === yesterday) {
          // 連続記録を継続
          currentStreak += 1;
        } else if (lastRecordDate !== today) {
          // 新しく記録開始または連続記録がリセット
          currentStreak = 1;
        }
        // lastRecordDate === today の場合は何もしない（同じ日の複数更新を避ける）

        await AsyncStorage.setItem('lastRecordDate', today);
        await AsyncStorage.setItem('currentStreak', currentStreak.toString());

        // マイルストーンバッジのチェック
        await this.checkMilestone(currentStreak);

        return currentStreak;
      }

      return 0;
    } catch (error) {
      console.error('Error updating streak:', error);
      return 0;
    }
  }

  // 今日の記録があるかチェック
  private async checkTodayLogs(today: string): Promise<boolean> {
    try {
      const db = await DatabaseService.getDatabase();
      const result = (await db.getAllAsync(
        'SELECT COUNT(*) as count FROM food_log WHERE date = ?',
        [today]
      )) as any[];

      return result[0]?.count > 0;
    } catch (error) {
      console.error('Error checking today logs:', error);
      return false;
    }
  }

  // 現在のストリーク日数を取得
  async getStreakDays(): Promise<number> {
    try {
      const streak = await AsyncStorage.getItem('currentStreak');
      return parseInt(streak || '0');
    } catch (error) {
      console.error('Error getting streak days:', error);
      return 0;
    }
  }

  // 最後の記録日を取得
  async getLastRecordDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('lastRecordDate');
    } catch (error) {
      console.error('Error getting last record date:', error);
      return null;
    }
  }

  // ストリークをリセット（開発用）
  async resetStreak(): Promise<void> {
    await AsyncStorage.removeItem('currentStreak');
    await AsyncStorage.removeItem('lastRecordDate');
    console.log('Streak data cleared');
  }

  // 実際の記録に基づいてストリークを再計算
  async recalculateStreak(): Promise<number> {
    try {
      await DatabaseService.initialize();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 今日から遡って連続記録日数を計算
      let streakCount = 0;
      let checkDate = new Date(today);

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];

        // その日に食事記録があるか確認
        const foodLogs = await DatabaseService.getAllAsync(
          'SELECT * FROM food_log WHERE date = ? LIMIT 1',
          [dateStr]
        );

        if (foodLogs.length > 0) {
          streakCount++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // 今日の記録がない場合は昨日をチェック
          if (streakCount === 0 && checkDate.getTime() === today.getTime()) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }

        // 安全のため最大365日まで
        if (streakCount > 365) break;
      }

      // 新しい値を保存
      await AsyncStorage.setItem('currentStreak', streakCount.toString());
      if (streakCount > 0) {
        await AsyncStorage.setItem(
          'lastRecordDate',
          today.toISOString().split('T')[0]
        );
      }

      return streakCount;
    } catch (error) {
      console.error('Error recalculating streak:', error);
      return 0;
    }
  }

  // マイルストーンバッジのチェック
  private async checkMilestone(streakDays: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 100];

    for (const milestone of milestones) {
      if (streakDays === milestone) {
        // バッジ獲得の通知やローカルストレージへの保存
        await this.saveMilestone(milestone);
        console.log(`🎉 ${milestone}日連続記録達成！`);
        break;
      }
    }
  }

  // マイルストーンの保存
  private async saveMilestone(milestone: number): Promise<void> {
    try {
      const existingMilestones = await AsyncStorage.getItem('milestones');
      const milestones = existingMilestones
        ? JSON.parse(existingMilestones)
        : [];

      if (!milestones.includes(milestone)) {
        milestones.push(milestone);
        await AsyncStorage.setItem('milestones', JSON.stringify(milestones));
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
  }

  // 獲得済みマイルストーンを取得
  async getMilestones(): Promise<number[]> {
    try {
      const milestones = await AsyncStorage.getItem('milestones');
      return milestones ? JSON.parse(milestones) : [];
    } catch (error) {
      console.error('Error getting milestones:', error);
      return [];
    }
  }

  // ストリークの色を取得
  getStreakColor(): string {
    // この関数は使用する側で実装されるため、ここでは色の基準のみ定義
    return 'default';
  }

  // テスト用のストリーク設定
  async setTestStreak(days: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('lastRecordDate', today);
      await AsyncStorage.setItem('currentStreak', days.toString());
    } catch (error) {
      console.error('Error setting test streak:', error);
    }
  }
}

export default StreakService.getInstance();
