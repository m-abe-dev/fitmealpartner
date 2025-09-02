import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingDown, TrendingUp, Minus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { GoalData, OnboardingStepProps } from '../../types/onboarding.types';
import { DropdownSelector } from '../../components/common/DropdownSelector';
import { SimpleCalendar } from '../../components/common/SimpleCalendar';

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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>2 / 4</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>目標を設定しましょう</Text>
          <Text style={styles.subtitle}>
            あなたの目標に合わせて最適なトレーニングプランを提案します
          </Text>
        </View>

        {/* Goal Selection - コンパクトに */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>目標を選択してください</Text>
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
        </View>

        {/* 目標体重と目標達成日 - 維持以外の場合のみ表示 */}
        {selectedGoal && selectedGoal !== 'maintain' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>体重変化の目標</Text>
            
            {/* 目標体重 */}
            <View style={styles.fullWidthGroup}>
              <DropdownSelector
                label="目標体重 (kg)"
                value={targetWeight}
                options={weightOptions}
                onSelect={setTargetWeight}
                placeholder="選択してください"
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
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !isNextEnabled() && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!isNextEnabled()}
        >
          <Text style={[
            styles.nextButtonText,
            !isNextEnabled() && styles.nextButtonTextDisabled
          ]}>
            次へ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.calendarHeaderButton}
                >
                  <Text style={styles.calendarCancel}>キャンセル</Text>
                </TouchableOpacity>
                <View style={styles.calendarTitleContainer}>
                  <Text style={styles.calendarTitle}>目標日を選択</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.calendarHeaderButton}
                >
                  <Text style={styles.calendarDone}>完了</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.calendarContent}>
                <SimpleCalendar
                  selectedDate={targetDate}
                  onDateSelect={(date: string) => {
                    setTargetDate(date);
                    setShowDatePicker(false);
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  progressText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontFamily: typography.fontFamily.medium,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
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
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  nextButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  nextButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.background.primary,
  },
  nextButtonTextDisabled: {
    color: colors.gray[500],
  },
  // Calendar modal styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    margin: spacing.md,
    maxWidth: 400,
    width: '95%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  calendarHeaderButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCancel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  calendarTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  calendarDone: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  calendarContent: {
    padding: spacing.lg,
  },
  dateInputEmpty: {
    borderColor: colors.border.medium,
    borderWidth: 1.5,
  },
  dateTextPlaceholder: {
    color: colors.text.tertiary,
  },
});