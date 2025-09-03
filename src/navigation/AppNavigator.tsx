import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BarChart3, Dumbbell, UtensilsCrossed, Settings, UserPlus } from 'lucide-react-native';
import { colors, typography, spacing } from '../design-system';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { NutritionScreen } from '../screens/nutrition/NutritionScreen';
import { WorkoutScreen } from '../screens/workout/WorkoutScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { OnboardingNavigator } from './OnboardingNavigator';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

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

  return (
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
            case 'Onboarding':
              Icon = UserPlus;
              break;
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
      {/* Onboarding Flow */}
      {!onboardingComplete && (
        <Tab.Screen
          name="Onboarding"
          options={{ tabBarLabel: 'セットアップ' }}
        >
          {() => <OnboardingNavigator onComplete={handleOnboardingComplete} />}
        </Tab.Screen>
      )}

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
});