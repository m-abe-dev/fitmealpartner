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
  FlatList,
} from 'react-native';
import { User, Calendar, Ruler, Weight, ChevronDown } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { ProfileData, OnboardingStepProps } from '../../types/onboarding.types';

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
  const [isHeightPickerOpen, setIsHeightPickerOpen] = useState(false);
  const [isWeightPickerOpen, setIsWeightPickerOpen] = useState(false);

  // 生年月日用の選択肢を生成
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [selectedYear, setSelectedYear] = useState(birthDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(birthDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(birthDate.getDate());

  // 身長の選択肢を生成（140cm〜220cm）
  const heightOptions = Array.from({ length: 81 }, (_, i) => i + 140);

  // 体重の選択肢を生成（35kg〜150kg、整数のみ）
  const weightOptions = Array.from({ length: 116 }, (_, i) => i + 35);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const updateBirthDate = () => {
    const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    setBirthDate(newDate);
    setShowDatePicker(false);
  };

  const handleNext = () => {
    const profileData: ProfileData = {
      gender,
      birthDate,
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
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <User size={20} color={colors.primary.main} />
              <Text style={styles.label}>性別</Text>
            </View>
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
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Calendar size={20} color={colors.primary.main} />
              <Text style={styles.label}>生年月日</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {birthDate.toLocaleDateString('ja-JP')} ({calculateAge(birthDate)}歳)
              </Text>
              <ChevronDown size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Height */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ruler size={20} color={colors.primary.main} />
              <Text style={styles.label}>身長</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsHeightPickerOpen(true)}
            >
              <Text style={styles.dropdownButtonText}>{height} cm</Text>
              <ChevronDown size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Weight size={20} color={colors.primary.main} />
              <Text style={styles.label}>体重</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsWeightPickerOpen(true)}
            >
              <Text style={styles.dropdownButtonText}>{weight} kg</Text>
              <ChevronDown size={20} color={colors.text.secondary} />
            </TouchableOpacity>
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

      {/* Simple List Picker for Date */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.listPickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>生年月日</Text>
              <TouchableOpacity onPress={updateBirthDate}>
                <Text style={styles.pickerDoneText}>完了</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerRow}>
              {/* Year */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.columnTitle}>年</Text>
                <FlatList
                  data={years}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        selectedYear === item && styles.listItemSelected
                      ]}
                      onPress={() => setSelectedYear(item)}
                    >
                      <Text style={[
                        styles.listItemText,
                        selectedYear === item && styles.listItemTextSelected
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.flatList}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={(_, index) => ({
                    length: 44,
                    offset: 44 * index,
                    index,
                  })}
                  initialScrollIndex={years.indexOf(selectedYear)}
                />
              </View>

              {/* Month */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.columnTitle}>月</Text>
                <FlatList
                  data={months}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        selectedMonth === item && styles.listItemSelected
                      ]}
                      onPress={() => setSelectedMonth(item)}
                    >
                      <Text style={[
                        styles.listItemText,
                        selectedMonth === item && styles.listItemTextSelected
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.flatList}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={(_, index) => ({
                    length: 44,
                    offset: 44 * index,
                    index,
                  })}
                  initialScrollIndex={selectedMonth - 1}
                />
              </View>

              {/* Day */}
              <View style={styles.datePickerColumn}>
                <Text style={styles.columnTitle}>日</Text>
                <FlatList
                  data={days}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        selectedDay === item && styles.listItemSelected
                      ]}
                      onPress={() => setSelectedDay(item)}
                    >
                      <Text style={[
                        styles.listItemText,
                        selectedDay === item && styles.listItemTextSelected
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.flatList}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={(_, index) => ({
                    length: 44,
                    offset: 44 * index,
                    index,
                  })}
                  initialScrollIndex={selectedDay - 1}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Height Picker Modal */}
      <Modal
        visible={isHeightPickerOpen}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.listPickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setIsHeightPickerOpen(false)}>
                <Text style={styles.pickerCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>身長</Text>
              <TouchableOpacity onPress={() => setIsHeightPickerOpen(false)}>
                <Text style={styles.pickerDoneText}>完了</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={heightOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    height === item && styles.listItemSelected
                  ]}
                  onPress={() => setHeight(item)}
                >
                  <Text style={[
                    styles.listItemText,
                    height === item && styles.listItemTextSelected
                  ]}>
                    {item} cm
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.singleFlatList}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: 44,
                offset: 44 * index,
                index,
              })}
              initialScrollIndex={heightOptions.indexOf(height)}
            />
          </View>
        </View>
      </Modal>

      {/* Weight Picker Modal */}
      <Modal
        visible={isWeightPickerOpen}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.listPickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setIsWeightPickerOpen(false)}>
                <Text style={styles.pickerCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>体重</Text>
              <TouchableOpacity onPress={() => setIsWeightPickerOpen(false)}>
                <Text style={styles.pickerDoneText}>完了</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={weightOptions}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    weight === item && styles.listItemSelected
                  ]}
                  onPress={() => setWeight(item)}
                >
                  <Text style={[
                    styles.listItemText,
                    weight === item && styles.listItemTextSelected
                  ]}>
                    {item} kg
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.singleFlatList}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: 44,
                offset: 44 * index,
                index,
              })}
              initialScrollIndex={weightOptions.indexOf(weight)}
            />
          </View>
        </View>
      </Modal>
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
  inputGroup: {
    gap: spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    ...shadows.sm,
  },
  dropdownButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  listPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#F8F9FA',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  pickerCancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  pickerDoneText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  datePickerRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 300,
  },
  datePickerColumn: {
    flex: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E5E5',
  },
  columnTitle: {
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  flatList: {
    height: 250,
  },
  singleFlatList: {
    height: 300,
    backgroundColor: '#FFFFFF',
  },
  listItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  listItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  listItemText: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fontFamily.regular,
  },
  listItemTextSelected: {
    fontSize: 18,
    color: '#007AFF',
    fontFamily: typography.fontFamily.bold,
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