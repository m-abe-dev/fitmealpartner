import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 通知ハンドラーの設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: any;
  private responseListener: any;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知権限のリクエスト
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Push notifications work only on physical devices');
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // 権限が付与されたことを保存
    await AsyncStorage.setItem('notificationPermission', 'granted');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  // 通知権限の状態を確認
  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // ExpoPushTokenの取得
  async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // EASプロジェクトIDを設定
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // ローカル通知のスケジュール
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        badge: 1,
      },
      trigger: trigger || null, // nullの場合は即座に通知
    });

    return notificationId;
  }

  // 毎日20時のタンパク質不足通知をスケジュール
  async scheduleProteinReminder(proteinGap: number): Promise<void> {
    // 既存の同じタイプの通知をキャンセル
    await this.cancelProteinReminder();

    if (proteinGap <= 0) {
      console.log('Protein target met, no reminder needed');
      return;
    }

    // DailyTriggerInputの正しい形式
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    };

    await this.scheduleLocalNotification(
      '🥩 タンパク質摂取リマインダー',
      `あと${Math.round(
        proteinGap
      )}gのタンパク質が必要です！プロテインや高タンパク食品を摂りましょう。`,
      {
        type: 'protein_reminder',
        proteinGap,
        screen: 'Nutrition',
      },
      trigger
    );

    console.log('Protein reminder scheduled for 8 PM');
  }

  // タンパク質リマインダーのキャンセル
  async cancelProteinReminder(): Promise<void> {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'protein_reminder') {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  }

  // ワークアウトリマインダーのスケジュール
  async scheduleWorkoutReminder(time: {
    hour: number;
    minute: number;
  }): Promise<void> {
    await this.cancelWorkoutReminder();

    // DailyTriggerInputの正しい形式
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    };

    await this.scheduleLocalNotification(
      '💪 ワークアウトの時間です！',
      '今日のトレーニングを始めましょう。継続が大切です！',
      {
        type: 'workout_reminder',
        screen: 'Workout',
      },
      trigger
    );
  }

  // ワークアウトリマインダーのキャンセル
  async cancelWorkoutReminder(): Promise<void> {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'workout_reminder') {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  }

  // すべての通知をキャンセル
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 通知リスナーの設定
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (
      response: Notifications.NotificationResponse
    ) => void
  ): void {
    // 通知受信時のリスナー
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // 通知タップ時のリスナー
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      });
  }

  // リスナーのクリーンアップ
  removeNotificationListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // バッジカウントのクリア
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // 通知設定の取得
  async getNotificationSettings(): Promise<{
    enabled: boolean;
    proteinReminder: boolean;
    workoutReminder: boolean;
    reminderTime: string;
  }> {
    const enabled = await this.checkPermissions();
    const settings = await AsyncStorage.getItem('notificationSettings');
    const parsed = settings ? JSON.parse(settings) : {};

    return {
      enabled,
      proteinReminder: parsed.proteinReminder ?? true,
      workoutReminder: parsed.workoutReminder ?? true,
      reminderTime: parsed.reminderTime ?? '20:00',
    };
  }

  // 通知設定の保存
  async saveNotificationSettings(settings: {
    proteinReminder?: boolean;
    workoutReminder?: boolean;
    reminderTime?: string;
  }): Promise<void> {
    const current = await this.getNotificationSettings();
    const updated = { ...current, ...settings };

    await AsyncStorage.setItem(
      'notificationSettings',
      JSON.stringify({
        proteinReminder: updated.proteinReminder,
        workoutReminder: updated.workoutReminder,
        reminderTime: updated.reminderTime,
      })
    );

    // 設定に基づいて通知をスケジュール/キャンセル
    if (!updated.proteinReminder) {
      await this.cancelProteinReminder();
    }
    if (!updated.workoutReminder) {
      await this.cancelWorkoutReminder();
    }
  }

  // テスト通知（即座に送信）
  async sendTestNotification(): Promise<void> {
    await this.scheduleLocalNotification(
      'テスト通知',
      'これはテスト通知です。正常に動作しています！',
      { type: 'test' },
      null
      // nullで即座に送信
    );
  }

  // 数秒後に送信するテスト通知
  async sendDelayedTestNotification(seconds: number = 5): Promise<void> {
    const trigger: Notifications.TimeIntervalTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: seconds,
      repeats: false,
    };

    await this.scheduleLocalNotification(
      'テスト通知',
      `${seconds}秒後のテスト通知です`,
      { type: 'test' },
      trigger
    );
  }

  // スケジュールされた通知の一覧を取得
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // スケジュールされた通知の一覧を取得（テスト用）
  async getAllScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default NotificationService.getInstance();
