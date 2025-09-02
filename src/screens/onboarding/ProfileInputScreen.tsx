import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { User, Calendar } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { ProfileData, OnboardingStepProps } from '../../types/onboarding.types';
import { DropdownSelector } from '../../components/common/DropdownSelector';
import { SimpleCalendar } from '../../components/common/SimpleCalendar';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>ようこそ、{'\n'}あなたの専属AIトレーナーへ</Text>
          <Text style={styles.subtitle}>基本プロフィールを教えてください</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '25%' }]} />
            </View>
            <Text style={styles.progressText}>1/4</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Gender Selection */}
          <View >
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
          <View >
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
          <View >
            <DropdownSelector
              label="身長"
              value={height}
              options={heightOptions}
              onSelect={setHeight}
              placeholder="選択してください"
              defaultScrollToValue={170}
            />
          </View>

          {/* Weight */}
          <View >
            <DropdownSelector
              label="体重"
              value={weight}
              options={weightOptions}
              onSelect={setWeight}
              placeholder="選択してください"
              defaultScrollToValue={65}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              次へ
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Birth Date Picker Modal */}
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
                  <Text style={styles.calendarTitle}>生年月日を選択</Text>
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
                  selectedDate={selectedDateString}
                  onDateSelect={handleDateSelect}
                  minDate="1924-01-01"
                  maxDate={new Date().toISOString().split('T')[0]}
                  showYearSelector={true}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    lineHeight: typography.fontSize['2xl'] * 1.2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  form: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  nextButton: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  nextButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
});