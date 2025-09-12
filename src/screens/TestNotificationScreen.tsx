import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, Check, ArrowLeft } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import NotificationService from '../services/NotificationService';
import StreakService from '../services/StreakService';
import { AIFeedbackService } from '../services/AIFeedbackService';
import { NutritionData, AIUserProfile } from '../types/ai.types';
import { colors, typography, spacing, radius } from '../design-system';

interface TestNotificationScreenProps {
  onBack?: () => void;
}

export const TestNotificationScreen: React.FC<TestNotificationScreenProps> = ({ onBack }) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('未確認');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev]);
  };

  // 1. 権限の確認
  const checkPermission = async () => {
    const hasPermission = await NotificationService.checkPermissions();
    setPermissionStatus(hasPermission ? '許可済み' : '未許可');
    addTestResult(`権限状態: ${hasPermission ? '許可済み' : '未許可'}`);
  };

  // 2. 権限のリクエスト
  const requestPermission = async () => {
    const granted = await NotificationService.requestPermissions();
    setPermissionStatus(granted ? '許可済み' : '拒否');
    addTestResult(`権限リクエスト結果: ${granted ? '許可' : '拒否'}`);

    if (!granted) {
      Alert.alert('通知権限', '設定アプリから通知を許可してください');
    }
  };

  // 3. 即座に通知を送信
  const sendImmediateNotification = async () => {
    try {
      const id = await NotificationService.scheduleLocalNotification(
        '🔔 テスト通知',
        'これは即座に送信されるテスト通知です',
        { type: 'test', timestamp: Date.now() }
      );
      addTestResult(`即座通知送信完了 (ID: ${id})`);
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 4. 5秒後に通知を送信
  const sendDelayedNotification = async () => {
    try {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      };

      const id = await NotificationService.scheduleLocalNotification(
        '⏰ 遅延テスト通知',
        '5秒後に送信されました！',
        { type: 'delayed_test' },
        trigger
      );

      addTestResult(`5秒後通知スケジュール完了 (ID: ${id})`);
      Alert.alert('スケジュール完了', '5秒後に通知が届きます');
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 5. タンパク質リマインダーのテスト
  const testProteinReminder = async () => {
    try {
      // 60秒後にテスト通知を送信
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60,
        repeats: false,
      };

      const id = await NotificationService.scheduleLocalNotification(
        '🥩 タンパク質リマインダー（テスト）',
        'あと30gのタンパク質が必要です！',
        { type: 'protein_test' },
        trigger
      );

      addTestResult(`タンパク質リマインダーテスト: 60秒後に通知`);
      Alert.alert('テスト設定', '60秒後に通知が届きます');
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 6. スケジュール済み通知の確認
  const checkScheduledNotifications = async () => {
    try {
      const notifications = await NotificationService.getAllScheduledNotifications();
      addTestResult(`スケジュール済み通知: ${notifications.length}件`);

      notifications.forEach((notif, index) => {
        addTestResult(`  ${index + 1}. ${notif.content.title}`);
      });
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 7. すべての通知をキャンセル
  const cancelAllNotifications = async () => {
    try {
      await NotificationService.cancelAllNotifications();
      addTestResult('すべての通知をキャンセルしました');
      Alert.alert('完了', 'すべての通知をキャンセルしました');
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 8. 即座タンパク質リマインダーテスト
  const testImmediateProteinReminder = async () => {
    try {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        repeats: false,
      };

      const id = await NotificationService.scheduleLocalNotification(
        '🥩 タンパク質リマインダー（10秒後）',
        'あと30gのタンパク質が必要です！',
        {
          type: 'protein_reminder',
          proteinGap: 30,
          screen: 'Nutrition',
          mealType: 'dinner',
        },
        trigger
      );

      addTestResult(`即座タンパク質テスト: 10秒後に通知 (ID: ${id})`);
      Alert.alert('テスト設定', '10秒後にタンパク質リマインダーが届きます。タップで食事画面に遷移します。');
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 9. 1分後タンパク質リマインダーテスト
  const testOneMinuteLater = async () => {
    try {
      const now = new Date();
      const testTime = new Date(now.getTime() + 60000); // 1分後

      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: testTime.getHours(),
        minute: testTime.getMinutes(),
      };

      const id = await NotificationService.scheduleLocalNotification(
        '🥩 タンパク質リマインダー（1分後）',
        'あと30gのタンパク質が必要です！',
        {
          type: 'protein_reminder',
          proteinGap: 30,
          screen: 'Nutrition',
          mealType: 'dinner',
        },
        trigger
      );

      const timeString = `${testTime.getHours()}:${String(testTime.getMinutes()).padStart(2, '0')}`;
      addTestResult(`1分後テスト: ${timeString}に通知 (ID: ${id})`);
      Alert.alert(
        'テスト設定完了',
        `${timeString}に通知が届きます（約1分後）`
      );
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 10. タンパク質リマインダーの実際スケジュールテスト
  const testActualProteinReminder = async () => {
    try {
      await NotificationService.scheduleProteinReminder(35);
      addTestResult('実際のタンパク質リマインダーをスケジュールしました');
      Alert.alert('スケジュール完了', '19:54にタンパク質リマインダーがスケジュールされました');
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };

  // 11. 詳細なデバッグ情報を収集
  const collectDebugInfo = async () => {
    try {
      const now = new Date();
      addTestResult(`=== デバッグ情報 ===`);
      addTestResult(`現在時刻: ${now.toLocaleString('ja-JP')}`);

      const permissions = await NotificationService.checkPermissions();
      addTestResult(`通知権限: ${permissions ? '許可済み' : '未許可'}`);

      const scheduled = await NotificationService.getAllScheduledNotifications();
      addTestResult(`スケジュール済み通知数: ${scheduled.length}件`);

      scheduled.forEach((notif, index) => {
        addTestResult(`  ${index + 1}. ${notif.content.title}`);
        if (notif.trigger && 'type' in notif.trigger) {
          addTestResult(`     トリガー: ${notif.trigger.type}`);
          if (notif.trigger.type === 'daily') {
            const dailyTrigger = notif.trigger as any;
            addTestResult(`     時刻: ${dailyTrigger.hour}:${String(dailyTrigger.minute).padStart(2, '0')}`);
          }
        }
      });

      addTestResult(`=================`);
    } catch (error) {
      addTestResult(`デバッグ情報収集エラー: ${error}`);
    }
  };

  // 12. 画面遷移テスト用通知を送信
  const sendNavigationTestNotification = async (screen: string, delay: number = 3) => {
    try {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delay,
        repeats: false,
      };

      const screenData: Record<string, any> = {
        'Nutrition': {
          type: 'test',
          screen: 'Nutrition',
          mealType: 'dinner',
          proteinGap: 25,
          title: '🍽 食事画面へ',
          body: 'タップして食事画面を開く'
        },
        'Workout': {
          type: 'test',
          screen: 'Workout',
          title: '💪 筋トレ画面へ',
          body: 'タップして筋トレ画面を開く'
        },
        'Dashboard': {
          type: 'test',
          screen: 'Dashboard',
          title: '📊 ダッシュボードへ',
          body: 'タップしてダッシュボードを開く'
        },
        'Profile': {
          type: 'test',
          screen: 'Profile',
          title: '👤 プロフィールへ',
          body: 'タップしてプロフィールを開く'
        },
      };

      const data = screenData[screen];

      const id = await NotificationService.scheduleLocalNotification(
        data.title,
        data.body,
        {
          type: data.type,
          screen: data.screen,
          mealType: data.mealType,
          proteinGap: data.proteinGap,
        },
        trigger
      );

      addTestResult(`画面遷移テスト通知: ${delay}秒後に${screen}へ`);
      Alert.alert('テスト設定', `${delay}秒後に通知が届きます。タップすると${screen}画面に遷移します`);
    } catch (error) {
      addTestResult(`エラー: ${error}`);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.text.primary} />
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>通知機能テスト</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>現在の権限状態</Text>
          <Text style={styles.statusValue}>{permissionStatus}</Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 権限設定</Text>
          <Button
            title="権限を確認"
            variant="outline"
            onPress={checkPermission}
            style={styles.button}
          />
          <Button
            title="権限をリクエスト"
            onPress={requestPermission}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. タンパク質リマインダーテスト</Text>
          <Text style={styles.sectionDescription}>
            タンパク質不足通知の動作をテストします
          </Text>
          <Button
            title="☀️ 10秒後にタンパク質通知"
            onPress={testImmediateProteinReminder}
            style={styles.button}
          />
          <Button
            title="🕰️ 1分後にタンパク質通知"
            variant="outline"
            onPress={testOneMinuteLater}
            style={styles.button}
          />
          <Button
            title="📅 現在のタンパク質通知をスケジュール"
            variant="outline"
            onPress={testActualProteinReminder}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 基本通知テスト</Text>
          <Button
            title="即座に通知を送信"
            variant="ghost"
            onPress={sendImmediateNotification}
            style={styles.button}
          />
          <Button
            title="5秒後に通知を送信"
            variant="ghost"
            onPress={sendDelayedNotification}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 画面遷移テスト</Text>
          <Text style={styles.sectionDescription}>
            通知をタップすると対応する画面に遷移します
          </Text>

          <Button
            title="→ 食事画面へ (3秒後)"
            variant="outline"
            onPress={() => sendNavigationTestNotification('Nutrition', 3)}
            style={styles.button}
          />

          <Button
            title="→ 筋トレ画面へ (3秒後)"
            variant="outline"
            onPress={() => sendNavigationTestNotification('Workout', 3)}
            style={styles.button}
          />

          <Button
            title="→ ダッシュボードへ (3秒後)"
            variant="outline"
            onPress={() => sendNavigationTestNotification('Dashboard', 3)}
            style={styles.button}
          />

          <Button
            title="→ プロフィールへ (3秒後)"
            variant="outline"
            onPress={() => sendNavigationTestNotification('Profile', 3)}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 管理・デバッグ</Text>
          <Button
            title="🔍 詳細デバッグ情報を収集"
            onPress={collectDebugInfo}
            style={styles.button}
          />
          <Button
            title="スケジュール済み通知を確認"
            variant="outline"
            onPress={checkScheduledNotifications}
            style={styles.button}
          />
          <Button
            title="すべての通知をキャンセル"
            variant="ghost"
            onPress={cancelAllNotifications}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. ストリーク管理</Text>
          <Button
            title="🔄 ストリークをリセット・再計算"
            onPress={async () => {
              try {
                await StreakService.resetStreak();
                const newStreak = await StreakService.recalculateStreak();
                addTestResult(`ストリークリセット完了: ${newStreak}日`);
                Alert.alert('ストリークリセット', `ストリークを再計算しました: ${newStreak}日`);
              } catch (error) {
                addTestResult(`ストリークリセットエラー: ${error}`);
              }
            }}
            style={styles.button}
          />
          <Button
            title="📊 現在のストリーク確認"
            variant="outline"
            onPress={async () => {
              try {
                const currentStreak = await StreakService.getStreakDays();
                const lastDate = await StreakService.getLastRecordDate();
                addTestResult(`現在のストリーク: ${currentStreak}日`);
                addTestResult(`最終記録日: ${lastDate || 'なし'}`);
              } catch (error) {
                addTestResult(`ストリーク確認エラー: ${error}`);
              }
            }}
            style={styles.button}
          />
        </View>

        <Card style={styles.logCard}>
          <Text style={styles.logTitle}>テストログ</Text>
          <ScrollView style={styles.logContent}>
            {testResults.length === 0 ? (
              <Text style={styles.logEmpty}>テストを実行するとここにログが表示されます</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.logItem}>{result}</Text>
              ))
            )}
          </ScrollView>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statusValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  button: {
    marginBottom: spacing.sm,
  },
  logCard: {
    marginTop: spacing.lg,
  },
  logTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  logContent: {
    maxHeight: 200,
  },
  logEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  logItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
});