import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TestNotificationScreen } from '../TestNotificationScreen';
import { User } from 'lucide-react-native';
import { colors, typography, spacing } from '../../design-system';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ProfileEditModal } from './components/ProfileEditModal';
import { ProfileHeader } from './components/ProfileHeader';
import { BodyStatsCards } from './components/BodyStatsCards';
import { GoalAnalysis } from './components/GoalAnalysis';
import { NutritionTargets } from './components/NutritionTargets';
import { SettingsSection, DeviceConnection, Achievement } from './components/SettingsSection';
import { useProfileData } from '../../hooks/useProfileData';

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    analysis,
    nutritionTargets,
    refreshing,
    notificationsEnabled,
    showProfileEditModal,
    isLoading,
    setNotificationsEnabled,
    setShowProfileEditModal,
    onRefresh,
    handleProfileSave,
  } = useProfileData();

  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [showNotificationTest, setShowNotificationTest] = useState(false);

  const [deviceConnections] = useState<DeviceConnection[]>([
    { name: 'Apple Watch', type: 'fitness', connected: true, icon: '⌚' },
    { name: 'iPhone ヘルスケア', type: 'health', connected: true, icon: '📱' },
    // { name: 'スマート体重計', type: 'smart_scale', connected: false, icon: '⚖️' },
    // { name: 'MyFitnessPal', type: 'fitness', connected: false, icon: '📊' }
  ]);

  const [achievements] = useState<Achievement[]>([
    { id: 1, title: '7日連続記録', description: '食事を7日間連続で記録しました', icon: '🔥', unlocked: true },
    { id: 2, title: '目標体重達成', description: '目標体重に到達しました', icon: '🎯', unlocked: false },
    { id: 3, title: 'プロテイン王', description: 'タンパク質目標を30日連続達成', icon: '💪', unlocked: true },
    { id: 4, title: 'ワークアウト達人', description: '月20回のワークアウトを達成', icon: '🏆', unlocked: false }
  ]);

  // ローディング中の表示（すべてのフック呼び出し後に配置）
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="プロフィール"
        icon={<User size={24} color={colors.primary.main} />}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]} 
            progressBackgroundColor={colors.background.primary}
          />
        }
      >
        <ProfileHeader
          userProfile={userProfile}
          onEditPress={() => setShowProfileEditModal(true)}
        />

        <BodyStatsCards userProfile={userProfile} />

        <GoalAnalysis userProfile={userProfile} analysis={analysis} />

        <NutritionTargets userProfile={userProfile} nutritionTargets={nutritionTargets} />

        <SettingsSection
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          deviceConnections={deviceConnections}
          achievements={achievements}
          darkModeEnabled={darkModeEnabled}
          setDarkModeEnabled={setDarkModeEnabled}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>FitMealPartner v1.0.0</Text>
          <Text style={styles.footerText}>2025 FitMealPartner</Text>
        </View>
      </ScrollView>

      {/* プロフィール編集モーダル */}
      <ProfileEditModal
        isVisible={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        profileData={{
          age: userProfile.age,
          height: userProfile.height,
          weight: userProfile.weight,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
          targetWeight: userProfile.targetWeight,
          targetDate: userProfile.targetDate,
          goal: userProfile.goal,
        }}
        onSave={handleProfileSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  testButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  testButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
});