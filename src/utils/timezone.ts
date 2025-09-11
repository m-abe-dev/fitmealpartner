import * as Localization from 'expo-localization';

class TimezoneHelper {
  private static instance: TimezoneHelper;
  private userTimezone: string;

  private constructor() {
    // デバイスのタイムゾーンを自動取得
    // Intl.DateTimeFormat().resolvedOptions().timeZone を使用してより確実にタイムゾーンを取得
    this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static getInstance(): TimezoneHelper {
    if (!TimezoneHelper.instance) {
      TimezoneHelper.instance = new TimezoneHelper();
    }
    return TimezoneHelper.instance;
  }

  // 現在のローカル時刻を取得
  getCurrentLocalTime(): string {
    return new Date().toLocaleTimeString('default', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.userTimezone,
    });
  }

  // UTC文字列をローカル時刻に変換
  convertUTCToLocal(utcDateString: string): string {
    try {
      // SQLiteのタイムスタンプ形式を処理
      // 形式: "2024-01-01 12:00:00" または "2024-01-01T12:00:00"
      
      // 無効な値のチェック
      if (!utcDateString || utcDateString === 'null' || utcDateString === 'undefined') {
        return '--:--';
      }

      // "T"が含まれていない場合は追加
      let dateString = utcDateString;
      if (!dateString.includes('T')) {
        dateString = dateString.replace(' ', 'T');
      }
      
      // "Z"が末尾にない場合は追加（UTC指定）
      if (!dateString.endsWith('Z')) {
        dateString += 'Z';
      }

      const utcDate = new Date(dateString);
      
      // 有効な日付かチェック
      if (isNaN(utcDate.getTime())) {
        console.warn('Invalid date string:', utcDateString);
        return '--:--';
      }
      
      return utcDate.toLocaleTimeString('default', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: this.userTimezone,
      });
    } catch (error) {
      console.error('Error converting UTC to local:', error, 'Input:', utcDateString);
      return '--:--';
    }
  }

  // 現在の日付をYYYY-MM-DD形式で取得（ローカルタイムゾーン基準）
  getCurrentLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // デバッグ用：現在のタイムゾーンを取得
  getTimezone(): string {
    return this.userTimezone;
  }

  // デバッグ用：タイムゾーン情報を表示
  getTimezoneInfo(): { timezone: string; offset: string; localTime: string } {
    const now = new Date();
    return {
      timezone: this.userTimezone,
      offset: now.toTimeString().split(' ')[1], // GMT+0900 などの形式
      localTime: this.getCurrentLocalTime(),
    };
  }
}

export default TimezoneHelper.getInstance();