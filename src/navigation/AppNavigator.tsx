import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { BarChart3, Dumbbell, UtensilsCrossed, Settings, RefreshCw, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing } from '../design-system';
import { OnboardingStorageService } from '../services/OnboardingStorageService';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { NutritionScreen } from '../screens/nutrition/NutritionScreen';
import { WorkoutScreen } from '../screens/workout/WorkoutScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { TestNotificationScreen } from '../screens/TestNotificationScreen';
import { OnboardingNavigator } from './OnboardingNavigator';

const Tab = createBottomTabNavigator();

// ========================================
// 開発用設定（本番環境では必ずfalseにする）
// ========================================

// オンボーディングを見たい → FORCE_SHOW_ONBOARDING: true
// オンボーディングをスキップ → SKIP_ONBOARDING: true
const DEV_CONFIG = {
  FORCE_SHOW_ONBOARDING: false,  // true: 常にオンボーディングを表示
  SKIP_ONBOARDING: false,        // true: 常にオンボーディングをスキップ
  SHOW_DEV_MENU: true,           // true: 開発メニューを表示
};

export default function AppNavigator() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showTestNotification, setShowTestNotification] = useState(false);

  // アプリ起動時にオンボーディング完了状態をチェック
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // 開発用フラグのチェック
        if (__DEV__ && DEV_CONFIG.SKIP_ONBOARDING) {
          setOnboardingComplete(true);
          setIsLoading(false);
          return;
        }

        if (__DEV__ && DEV_CONFIG.FORCE_SHOW_ONBOARDING) {
          await OnboardingStorageService.clearOnboardingData();
          setOnboardingComplete(false);
          setIsLoading(false);
          return;
        }

        // 通常のチェック
        const isComplete = await OnboardingStorageService.isOnboardingComplete();
        setOnboardingComplete(isComplete);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed with data:', data);
    Alert.alert(
      '登録完了！',
      'プロフィール設定が完了しました。',
      [
        {
          text: 'OK',
          onPress: () => setOnboardingComplete(true),
        },
      ]
    );
  };

  // 開発用: オンボーディングデータをリセット
  const resetOnboarding = async () => {
    await OnboardingStorageService.clearOnboardingData();
    setOnboardingComplete(false);
    Alert.alert('リセット完了', 'オンボーディングデータをクリアしました');
  };

  // 開発用: オンボーディングをスキップ
  const skipOnboarding = () => {
    setOnboardingComplete(true);
    Alert.alert('スキップ', 'オンボーディングをスキップしました');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // オンボーディングが未完了の場合
  if (!onboardingComplete) {
    return (
      <View style={{ flex: 1 }}>
        <OnboardingNavigator onComplete={handleOnboardingComplete} />

        {/* 開発メニュー */}
        {__DEV__ && DEV_CONFIG.SHOW_DEV_MENU && (
          <View style={styles.devMenuContainer}>
            <TouchableOpacity
              style={styles.devButton}
              onPress={skipOnboarding}
            >
              <Text style={styles.devButtonText}>Skip →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // 通知テスト画面を表示
  if (showTestNotification) {
    return <TestNotificationScreen onBack={() => setShowTestNotification(false)} />;
  }

  // オンボーディング完了後のタブナビゲーター
  return (
    <>
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          paddingBottom: spacing.xl,
          paddingTop: spacing.xs,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontFamily: typography.fontFamily.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let Icon;

          switch (route.name) {
            case 'Dashboard':
              Icon = BarChart3;
              break;
            case 'Workout':
              Icon = Dumbbell;
              break;
            case 'Nutrition':
              Icon = UtensilsCrossed;
              break;
            case 'Profile':
              Icon = Settings;
              break;
            default:
              Icon = BarChart3;
          }

          return (
            <View style={[
              styles.iconContainer,
              focused && styles.activeIconContainer
            ]}>
              <Icon size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'ダッシュボード' }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ tabBarLabel: '筋トレ' }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ tabBarLabel: '食事' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'プロフィール' }}
      />
      </Tab.Navigator>

      {/* 開発メニューボタン - ヘッダー左上に配置（開発環境のみ） */}
      {__DEV__ && DEV_CONFIG.SHOW_DEV_MENU && (
        <TouchableOpacity
          style={styles.devHeaderButton}
          onPress={() => setShowDevMenu(!showDevMenu)}
        >
          <Text style={styles.devHeaderButtonText}>DEV</Text>
        </TouchableOpacity>
      )}

      {/* 開発メニューモーダル（開発環境のみ） */}
      {__DEV__ && DEV_CONFIG.SHOW_DEV_MENU && showDevMenu && (
        <View style={styles.devModalOverlay}>
          <TouchableOpacity 
            style={styles.devModalBackground} 
            onPress={() => setShowDevMenu(false)}
            activeOpacity={1}
          />
          <View style={styles.devModalContent}>
            <Text style={styles.devModalTitle}>開発メニュー</Text>

            <TouchableOpacity
              style={styles.devModalButton}
              onPress={async () => {
                await resetOnboarding();
                setShowDevMenu(false);
              }}
            >
              <Trash2 size={16} color={colors.text.inverse} />
              <Text style={styles.devModalButtonText}>オンボーディングをリセット</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devModalButton, { backgroundColor: '#FFA500' }]}
              onPress={() => {
                setShowDevMenu(false);
                setShowTestNotification(true);
              }}
            >
              <Text style={styles.devModalButtonText}>通知テスト画面</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devModalButton, styles.devModalCloseButton]}
              onPress={() => setShowDevMenu(false)}
            >
              <Text style={styles.devModalButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    // アクティブ時の背景
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },

  // 開発メニュー
  devMenuContainer: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    zIndex: 9999,
  },
  devButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  devHeaderButton: {
    position: 'absolute',
    top: 50, // SafeAreaを考慮
    left: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 9999,
  },
  devHeaderButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  devModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  devModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  devModalContent: {
    position: 'absolute',
    top: 90, // DEVボタンの下に配置
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 10,
    padding: 15,
    minWidth: 200,
  },
  devModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  devModalButton: {
    backgroundColor: colors.primary.main,
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  devModalButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  devModalCloseButton: {
    backgroundColor: colors.gray[600],
  },
});