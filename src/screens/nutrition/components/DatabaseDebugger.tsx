import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatabaseService from '../../../services/database/DatabaseService';
import { colors, typography, spacing, radius } from '../../../design-system';

export const DatabaseDebugger = () => {
  const [dbInfo, setDbInfo] = useState<any>({});

  const checkDatabase = async () => {
    try {
      // ローカルタイムゾーンで今日の日付を取得
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const foodLogs = await DatabaseService.getAllAsync(
        'SELECT * FROM food_log WHERE date = ?',
        [todayString]
      );

      const allLogs = await DatabaseService.getAllAsync(
        'SELECT * FROM food_log'
      );

      // 日付別ログ数を確認
      const logsByDate = await DatabaseService.getAllAsync(
        'SELECT date, COUNT(*) as count FROM food_log GROUP BY date ORDER BY date DESC'
      );

      const foodDb = await DatabaseService.getAllAsync(
        'SELECT * FROM food_db'
      );

      const favorites = await DatabaseService.getAllAsync(
        'SELECT * FROM food_favorites'
      );

      setDbInfo({
        todayLogs: foodLogs.length,
        totalLogs: allLogs.length,
        foodMaster: foodDb.length,
        favorites: favorites.length,
        lastLog: foodLogs[0] || null,
        timestamp: new Date().toLocaleTimeString(),
        searchDate: todayString
      });

    } catch (error) {
      console.error('DB確認エラー:', error);
    }
  };

  const clearTodayData = async () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await DatabaseService.runAsync(
      'DELETE FROM food_log WHERE date = ?',
      [todayString]
    );
    await checkDatabase();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗄️ DB Debug</Text>

      <TouchableOpacity style={styles.button} onPress={checkDatabase}>
        <Text style={styles.buttonText}>データベース確認</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearTodayData}>
        <Text style={styles.buttonText}>今日のデータを削除</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => console.log('現在のdbInfo:', dbInfo)}>
        <Text style={styles.buttonText}>ログ出力</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>検索日付: {dbInfo.searchDate}</Text>
        <Text style={styles.infoText}>今日: {dbInfo.todayLogs || 0}件</Text>
        <Text style={styles.infoText}>全体: {dbInfo.totalLogs || 0}件</Text>
        <Text style={styles.infoText}>お気に入り: {dbInfo.favorites || 0}件</Text>
        <Text style={styles.infoText}>更新: {dbInfo.timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.gray[100],
    margin: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  button: {
    padding: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: radius.sm,
    marginVertical: spacing.xs,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  info: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: radius.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginVertical: spacing.xs,
  },
});