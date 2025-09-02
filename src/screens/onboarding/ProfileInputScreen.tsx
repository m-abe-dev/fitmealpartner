import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { ProfileData, OnboardingStepProps } from '../../types/onboarding.types';
import { DropdownSelector } from '../../components/common/DropdownSelector';
import { OnboardingLayout } from '../../components/common/OnboardingLayout';
import { OnboardingSection } from '../../components/common/OnboardingSection';
import { CalendarModal } from '../../components/common/CalendarModal';

export const ProfileInputScreen: React.FC<OnboardingStepProps> = ({
  onNext,
  currentData,
}) => {
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    currentData?.profile?.gender || 'male'
  );
  const [birthDate, setBirthDate] = useState<Date>(
    currentData?.profile?.birthDate || new Date(2000, 0, 1)
  );
  const [height, setHeight] = useState<number>(
    currentData?.profile?.height || 170
  );
  const [weight, setWeight] = useState<number>(
    currentData?.profile?.weight || 65
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateString, setSelectedDateString] = useState(
    currentData?.profile?.birthDate
      ? currentData.profile.birthDate.toISOString().split('T')[0]
      : '2000-01-01'
  );

  // 身長の選択肢を生成（140cm〜220cm）
  const heightOptions = Array.from({ length: 81 }, (_, i) => ({
    value: i + 140,
    label: `${i + 140}cm`
  }));

  // 体重の選択肢を生成（35kg〜150kg、整数のみ）
  const weightOptions = Array.from({ length: 116 }, (_, i) => ({
    value: i + 35,
    label: `${i + 35}kg`
  }));

  const calculateAge = (dateString: string): number => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDateString(dateString);
    setBirthDate(new Date(dateString));
    setShowDatePicker(false);
  };

  const handleNext = () => {
    const profileData: ProfileData = {
      gender,
      birthDate: new Date(selectedDateString),
      height,
      weight,
    };

    onNext({ profile: profileData });
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={4}
      title="基本情報を入力"
      subtitle="あなたに最適なトレーニングプランを作成するための基本情報を教えてください"
      onNext={handleNext}
      nextButtonText="次へ"
      isNextEnabled={true}
    >
      <OnboardingSection>
          {/* Gender Selection */}
          <View>
            <Text style={styles.label}>性別</Text>
            <View style={styles.segmentedContainer}>
              {[
                { key: 'male', label: '男性' },
                { key: 'female', label: '女性' },
                { key: 'other', label: 'その他' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentButton,
                    gender === option.key && styles.segmentButtonActive,
                  ]}
                  onPress={() => setGender(option.key as 'male' | 'female' | 'other')}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      gender === option.key && styles.segmentButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Birth Date */}
          <View>
            <Text style={styles.label}>生年月日</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {new Date(selectedDateString).toLocaleDateString('ja-JP')} ({calculateAge(selectedDateString)}歳)
              </Text>
              <Calendar size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Height */}
          <View style={{ marginBottom: spacing.md }}>
            <DropdownSelector
              label="身長 (cm)"
              value={height}
              options={heightOptions}
              onSelect={setHeight}
              placeholder="選択してください"
              defaultScrollToValue={170}
            />
          </View>

          {/* Weight */}
          <View style={{ marginBottom: spacing.md }}>
            <DropdownSelector
              label="体重 (kg)"
              value={weight}
              options={weightOptions}
              onSelect={setWeight}
              placeholder="選択してください"
              defaultScrollToValue={65}
            />
          </View>
      </OnboardingSection>

      <CalendarModal
        isVisible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDateString}
        onDateSelect={handleDateSelect}
        title="生年月日を選択"
        minDate="1924-01-01"
        maxDate={new Date().toISOString().split('T')[0]}
        showYearSelector={true}
      />
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.xxxs,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary.main,
  },
  segmentButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  segmentButtonTextActive: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  dropdownButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
});