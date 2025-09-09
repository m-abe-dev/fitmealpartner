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
          <Text style={styles.sectionTitle}>2. 通知テスト</Text>
          <Button
            title="即座に通知を送信"
            onPress={sendImmediateNotification}
            style={styles.button}
          />
          <Button
            title="5秒後に通知を送信"
            variant="outline"
            onPress={sendDelayedNotification}
            style={styles.button}
          />
          <Button
            title="タンパク質リマインダー（1分後）"
            variant="outline"
            onPress={testProteinReminder}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 管理</Text>
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
});