import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TrendingDown, TrendingUp, Minus, Calendar } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { GoalData, OnboardingStepProps } from '../../types/onboarding.types';
import { DropdownSelector } from '../../components/common/DropdownSelector';
import { OnboardingLayout } from '../../components/common/OnboardingLayout';
import { OnboardingSection } from '../../components/common/OnboardingSection';
import { CalendarModal } from '../../components/common/CalendarModal';

interface GoalOption {
  key: 'cut' | 'bulk' | 'maintain';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const goalOptions: GoalOption[] = [
  {
    key: 'cut',
    title: '減量',
    description: '脂肪を落とす',
    icon: TrendingDown,
    color: colors.status.error,
  },
  {
    key: 'bulk',
    title: '増量',
    description: '筋肉を増やす',
    icon: TrendingUp,
    color: colors.primary.main,
  },
  {
    key: 'maintain',
    title: '維持',
    description: '現状をキープ',
    icon: Minus,
    color: colors.status.success,
  },
];

export function GoalSettingScreen({ onNext, currentData }: OnboardingStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<'cut' | 'bulk' | 'maintain' | null>(
    currentData?.goal?.goal || null
  );

  const [targetWeight, setTargetWeight] = useState<number | undefined>(
    currentData?.goal?.targetWeight || undefined
  );
  const [targetDate, setTargetDate] = useState<string | undefined>(
    currentData?.goal?.targetDate || undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const weightOptions = Array.from({ length: 171 }, (_, i) => ({
    value: i + 30,
    label: `${i + 30} kg`
  }));

  const handleNext = () => {
    if (!selectedGoal) return;

    // 維持以外の場合はバリデーション
    if (selectedGoal !== 'maintain') {
      // 目標体重のチェック
      if (!targetWeight) {
        Alert.alert('入力エラー', '目標体重を設定してください');
        return;
      }

      // 現在の体重と同じ場合のチェック
      if (currentData?.profile?.weight && targetWeight === currentData.profile.weight) {
        Alert.alert('入力エラー', '目標体重は現在の体重と異なる値を設定してください');
        return;
      }

      // 目標達成日のチェック
      if (!targetDate) {
        Alert.alert('入力エラー', '目標達成日を設定してください');
        return;
      }

      // 目標日が今日以前でないかチェック
      const targetDateObj = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (targetDateObj <= today) {
        Alert.alert('入力エラー', '目標達成日は明日以降の日付を選択してください');
        return;
      }
    }

    const goalData: GoalData = {
      goal: selectedGoal,
      targetWeight: selectedGoal !== 'maintain' ? targetWeight : undefined,
      targetDate: selectedGoal !== 'maintain' ? targetDate : undefined,
    };

    onNext({ goal: goalData });
  };

  const isNextEnabled = () => {
    if (!selectedGoal) return false;

    if (selectedGoal === 'maintain') {
      return true;
    }

    // 増量・減量の場合は目標体重と日付が設定されていること
    return targetWeight !== undefined &&
           targetWeight !== currentData?.profile?.weight &&
           targetDate !== undefined;
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={4}
      title="目標を設定しましょう"
      subtitle="あなたの目標に合わせて最適なトレーニングプランを提案します"
      onNext={handleNext}
      nextButtonText="次へ"
      isNextEnabled={isNextEnabled()}
    >
      <OnboardingSection title="目標を選択してください">
        <View style={styles.goalList}>
          {goalOptions.map((option) => {
            const isSelected = selectedGoal === option.key;
            const Icon = option.icon;

            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.goalItem,
                  isSelected && { ...styles.goalItemSelected, borderColor: option.color }
                ]}
                onPress={() => setSelectedGoal(option.key)}
              >
                <View style={[styles.goalIconContainer, { backgroundColor: option.color + '20' }]}>
                  <Icon size={24} color={option.color} />
                </View>
                <View style={styles.goalContent}>
                  <Text style={[
                    styles.goalTitle,
                    isSelected && { color: option.color }
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={styles.goalDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </OnboardingSection>

      {/* 目標体重と目標達成日 - 維持以外の場合のみ表示 */}
      {selectedGoal && selectedGoal !== 'maintain' && (
        <OnboardingSection title="体重変化の目標">
          {/* 目標体重 */}
          <View style={[styles.fullWidthGroup, { zIndex: 30 }]}>
            <DropdownSelector
              label="目標体重 (kg)"
              value={targetWeight}
              options={weightOptions}
              onSelect={setTargetWeight}
              placeholder="選択してください"
              defaultScrollToValue={65}
            />
          </View>

          {/* 目標達成日 */}
          <View style={styles.fullWidthGroup}>
            <Text style={styles.goalLabel}>目標達成日</Text>
            <TouchableOpacity
              style={[
                styles.dateInput,
                !targetDate && styles.dateInputEmpty
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={16} color={colors.text.secondary} />
              <Text style={[
                styles.dateText,
                !targetDate && styles.dateTextPlaceholder
              ]}>
                {targetDate ? new Date(targetDate).toLocaleDateString('ja-JP') : '選択してください'}
              </Text>
            </TouchableOpacity>
          </View>
        </OnboardingSection>
      )}

      <CalendarModal
        isVisible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={targetDate}
        onDateSelect={setTargetDate}
        title="目標日を選択"
        minDate={new Date().toISOString().split('T')[0]}
        showYearSelector={false}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  goalList: {
    gap: spacing.md,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalItemSelected: {
    backgroundColor: colors.background.primary,
    borderWidth: 2,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  fullWidthGroup: {
    width: '100%',
    marginBottom: spacing.md,
  },
  goalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  dateInputEmpty: {
    borderColor: colors.border.medium,
    borderWidth: 1.5,
  },
  dateTextPlaceholder: {
    color: colors.text.tertiary,
  },
});