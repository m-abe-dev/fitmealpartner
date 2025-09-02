import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CheckCircle2, Target, Calendar } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { OnboardingStepProps } from '../../types/onboarding.types';
import { OnboardingLayout } from '../../components/common/OnboardingLayout';
import { OnboardingSection } from '../../components/common/OnboardingSection';

export function CompletionScreen({ onNext, onBack, currentData }: OnboardingStepProps) {
  const calculateNutritionTargets = () => {
    if (!currentData?.profile || !currentData?.goal || !currentData?.workoutHabits) {
      return null;
    }

    const { gender, birthDate, height, weight } = currentData.profile;
    const { goal } = currentData.goal;
    const { activityLevel } = currentData.workoutHabits;

    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9,
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    let targetCalories;
    let proteinPerKg = 2.0;

    switch (goal) {
      case 'cut':
        targetCalories = Math.round(tdee * 0.8);
        proteinPerKg = 2.2;
        break;
      case 'bulk':
        targetCalories = Math.round(tdee * 1.15);
        proteinPerKg = 1.8;
        break;
      case 'maintain':
      default:
        targetCalories = Math.round(tdee);
        proteinPerKg = 2.0;
        break;
    }

    const targetProtein = Math.round(weight * proteinPerKg);
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

    return {
      calories: targetCalories,
      protein: targetProtein,
      fat: targetFat,
      carbs: targetCarbs,
    };
  };

  const nutritionTargets = calculateNutritionTargets();

  const getGoalDisplayText = () => {
    if (!currentData?.goal) return '';

    const { goal, targetWeight, targetDate } = currentData.goal;

    const goalTexts = {
      cut: '減量',
      bulk: '増量',
      maintain: '維持'
    };

    let text = goalTexts[goal];

    if (goal !== 'maintain' && targetWeight) {
      text += ` (目標: ${targetWeight}kg`;
      if (targetDate) {
        const date = new Date(targetDate);
        text += ` / ${date.toLocaleDateString('ja-JP')}まで`;
      }
      text += ')';
    }

    return text;
  };

  const handleStartJourney = () => {
    onNext({ completedAt: new Date() });
  };

  if (!nutritionTargets) {
    return (
      <OnboardingLayout
        currentStep={4}
        totalSteps={4}
        title="エラー"
        subtitle="設定に問題があります"
        isScrollView={false}
      >
        <OnboardingSection>
          <Text style={styles.errorText}>
            設定データが不完全です。前の画面に戻って入力を確認してください。
          </Text>
        </OnboardingSection>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={4}
      title="準備完了！"
      subtitle="あなたの目標達成に向けて今日から始めましょう"
      onBack={onBack}
      showBackButton={true}
      hideProgress={true}
    >
      <OnboardingSection>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <CheckCircle2 size={64} color={colors.status.success} />
        </View>

        {/* Goal Summary */}
        <View style={styles.goalSummaryContainer}>
          <View style={styles.goalHeader}>
            <Target size={20} color={colors.primary.main} />
            <Text style={styles.goalTitle}>あなたの目標</Text>
          </View>
          <Text style={styles.goalText}>{getGoalDisplayText()}</Text>
        </View>

        {/* Nutrition Targets */}
        <View style={styles.nutritionContainer}>
          <Text style={styles.nutritionTitle}>1日の栄養目標</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionTargets.calories}</Text>
              <Text style={styles.nutritionLabel}>kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionTargets.protein}</Text>
              <Text style={styles.nutritionLabel}>タンパク質(g)</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionTargets.carbs}</Text>
              <Text style={styles.nutritionLabel}>炭水化物(g)</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionTargets.fat}</Text>
              <Text style={styles.nutritionLabel}>脂質(g)</Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartJourney}
          >
            <Text style={styles.primaryButtonText}>
              今日から始める
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Message */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            目標は後からいつでも変更できます。まずは今日から記録を始めて、理想の体を目指しましょう！
          </Text>
        </View>
      </OnboardingSection>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  successIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  goalSummaryContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  goalText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
    textAlign: 'center',
  },
  nutritionContainer: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  nutritionValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.background.primary,
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  infoContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.status.error,
    textAlign: 'center',
  },
});