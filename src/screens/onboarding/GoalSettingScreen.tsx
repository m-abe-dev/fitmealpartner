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

export function GoalSettingScreen({ onNext, onBack, currentData }: OnboardingStepProps) {
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

  // 現在の体重を取得
  const currentWeight = currentData?.profile?.weight || 65;

  // 目標に応じた体重選択肢を生成
  const getWeightOptions = () => {
    if (!selectedGoal || selectedGoal === 'maintain') {
      return [];
    }

    const options = [];
    
    if (selectedGoal === 'cut') {
      // 減量: 現在の体重から30kgまで（最小30kg）
      const minWeight = 30;
      const maxWeight = currentWeight - 1; // 現在の体重より1kg以上少ない
      
      if (maxWeight >= minWeight) {
        for (let i = minWeight; i <= maxWeight; i++) {
          options.push({
            value: i,
            label: `${i} kg`
          });
        }
      }
    } else if (selectedGoal === 'bulk') {
      // 増量: 現在の体重+1kgから200kgまで
      const minWeight = currentWeight + 1; // 現在の体重より1kg以上多い
      const maxWeight = 200;
      
      for (let i = minWeight; i <= maxWeight; i++) {
        options.push({
          value: i,
          label: `${i} kg`
        });
      }
    }

    return options;
  };

  const weightOptions = getWeightOptions();

  // 目標が変更されたときに目標体重をリセット
  const handleGoalSelect = (goal: 'cut' | 'bulk' | 'maintain') => {
    setSelectedGoal(goal);
    // 目標が変更されたら目標体重をリセット
    if (goal !== selectedGoal) {
      setTargetWeight(undefined);
    }
  };

  // デフォルトスクロール値を計算
  const getDefaultScrollValue = () => {
    if (selectedGoal === 'cut') {
      // 減量の場合: 現在の体重から5kg減を初期値に
      return Math.max(30, currentWeight - 5);
    } else if (selectedGoal === 'bulk') {
      // 増量の場合: 現在の体重から5kg増を初期値に
      return Math.min(200, currentWeight + 5);
    }
    return currentWeight;
  };

  const handleNext = () => {
    if (!selectedGoal) return;

    // 維持以外の場合はバリデーション
    if (selectedGoal !== 'maintain') {
      // 目標体重のチェック
      if (!targetWeight) {
        Alert.alert('入力エラー', '目標体重を設定してください');
        return;
      }

      // 減量/増量の妥当性チェック
      if (selectedGoal === 'cut' && targetWeight >= currentWeight) {
        Alert.alert('入力エラー', '減量の場合、目標体重は現在の体重より少なく設定してください');
        return;
      }
      
      if (selectedGoal === 'bulk' && targetWeight <= currentWeight) {
        Alert.alert('入力エラー', '増量の場合、目標体重は現在の体重より多く設定してください');
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
    return targetWeight !== undefined && targetDate !== undefined;
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={3}
      title="目標を設定しましょう"
      subtitle="あなたの目標に合わせて最適なトレーニングプランを提案します"
      onNext={handleNext}
      onBack={onBack}
      showBackButton={true}
      nextButtonText="次へ"
      isNextEnabled={isNextEnabled()}
    >
      <OnboardingSection>
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
                onPress={() => handleGoalSelect(option.key)}
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
          {/* 現在の体重表示 */}
          <View style={styles.currentWeightContainer}>
            <Text style={styles.currentWeightLabel}>現在の体重</Text>
            <Text style={styles.currentWeightValue}>{currentWeight} kg</Text>
          </View>

          {/* 目標体重 */}
          {weightOptions.length > 0 ? (
            <View style={[styles.fullWidthGroup, { zIndex: 30 }]}>
              <DropdownSelector
                label={`目標体重 (${selectedGoal === 'cut' ? '減量' : '増量'})`}
                value={targetWeight}
                options={weightOptions}
                onSelect={setTargetWeight}
                placeholder="選択してください"
                defaultScrollToValue={getDefaultScrollValue()}
              />
            </View>
          ) : (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                {selectedGoal === 'cut' 
                  ? '現在の体重が最小値（30kg）に近いため、これ以上の減量目標は設定できません'
                  : '現在の体重が最大値（200kg）に近いため、これ以上の増量目標は設定できません'}
              </Text>
            </View>
          )}

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
  currentWeightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  currentWeightLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  currentWeightValue: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  warningContainer: {
    backgroundColor: colors.status.warning + '10',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.status.warning + '30',
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.warning,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});