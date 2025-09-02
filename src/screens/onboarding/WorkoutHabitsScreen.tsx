import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../../design-system';
import { WorkoutHabitsData, OnboardingStepProps } from '../../types/onboarding.types';
import { DropdownSelector } from '../../components/common/DropdownSelector';
import { OnboardingLayout } from '../../components/common/OnboardingLayout';
import { OnboardingSection } from '../../components/common/OnboardingSection';

export function WorkoutHabitsScreen({ onNext, onBack, currentData }: OnboardingStepProps) {
  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
  >(currentData?.workoutHabits?.activityLevel || 'moderate');

  const [environment, setEnvironment] = useState<'home' | 'gym' | 'studio'>(
    currentData?.workoutHabits?.environment || 'gym'
  );

  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>(
    currentData?.workoutHabits?.experience || 'beginner'
  );

  const activityOptions = [
    { value: 'sedentary', label: '座りがち（運動なし）' },
    { value: 'light', label: '軽い活動（週1-3回）' },
    { value: 'moderate', label: '中程度（週3-5回）' },
    { value: 'active', label: '活発（週6-7回）' },
    { value: 'very-active', label: '非常に活発（1日2回）' },
  ];

  const environmentOptions = [
    { value: 'home', label: '自宅' },
    { value: 'gym', label: 'ジム' },
    { value: 'studio', label: 'スタジオ' },
  ];

  const experienceOptions = [
    { value: 'beginner', label: '初心者（1年未満）' },
    { value: 'intermediate', label: '中級者（1-3年）' },
    { value: 'advanced', label: '上級者（3年以上）' },
  ];

  const handleNext = () => {
    const workoutHabitsData: WorkoutHabitsData = {
      activityLevel,
      environment,
      experience,
    };

    onNext({ workoutHabits: workoutHabitsData });
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={3}
      title="トレーニング習慣"
      subtitle="普段のトレーニング習慣を教えてください"
      onNext={handleNext}
      onBack={onBack}
      showBackButton={true}
      nextButtonText="次へ"
      isNextEnabled={true}
      isScrollView={true}
    >
      <OnboardingSection>
        {/* 活動レベル */}
        <View style={[styles.inputGroup, { zIndex: 30 }]}>
          <DropdownSelector
            label="活動レベル"
            value={activityLevel}
            options={activityOptions}
            onSelect={setActivityLevel}
            placeholder="選択してください"
            defaultScrollToValue="moderate"
          />
        </View>

        {/* トレーニング環境 */}
        <View style={[styles.inputGroup, { zIndex: 20 }]}>
          <DropdownSelector
            label="トレーニング環境"
            value={environment}
            options={environmentOptions}
            onSelect={setEnvironment}
            placeholder="選択してください"
            defaultScrollToValue="gym"
          />
        </View>

        {/* 経験レベル */}
        <View style={[styles.inputGroup, { zIndex: 10 }]}>
          <DropdownSelector
            label="経験レベル"
            value={experience}
            options={experienceOptions}
            onSelect={setExperience}
            placeholder="選択してください"
            defaultScrollToValue="beginner"
          />
        </View>

        {/* 説明テキスト */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>これらの情報は何に使われますか？</Text>
          <Text style={styles.infoText}>
            • 活動レベル：適切なトレーニング頻度の提案
          </Text>
          <Text style={styles.infoText}>
            • トレーニング環境：利用可能な器具に応じた種目選択
          </Text>
          <Text style={styles.infoText}>
            • 経験レベル：難易度と進行ペースの調整
          </Text>
        </View>
      </OnboardingSection>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: spacing.lg,
  },
  infoContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
});