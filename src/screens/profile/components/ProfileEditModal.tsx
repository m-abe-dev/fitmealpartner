import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  User,
  X,
  RefreshCw,
  Minus,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

export interface ProfileData {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  weightChangeDirection?: 'decrease' | 'increase' | 'maintain';
  weightChangeAmount?: number;
  targetDate?: string;
}

interface ProfileEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (updatedProfile: ProfileData) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isVisible,
  onClose,
  profileData,
  onSave,
}) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle date selection
  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setProfile(prev => ({ ...prev, targetDate: dateString }));
    }
  };

  // Show calendar picker
  const showCalendarPicker = () => {
    setShowDatePicker(true);
  };

  // Handle calendar date selection
  const handleCalendarDateSelect = (dateString: string) => {
    const selectedDate = new Date(dateString);
    handleDateChange(selectedDate);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};

    if (profile.targetDate) {
      markedDates[profile.targetDate] = {
        selected: true,
        selectedColor: colors.primary.main,
        selectedTextColor: colors.text.inverse,
      };
    }

    return markedDates;
  };

  const [profile, setProfile] = useState<ProfileData>({
    ...profileData,
    weightChangeDirection: profileData.weightChangeDirection || 'decrease',
    weightChangeAmount: profileData.weightChangeAmount || 1,
    targetDate: profileData.targetDate || getTodayDate(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setProfile({
      ...profileData,
      weightChangeDirection: profileData.weightChangeDirection || 'decrease',
      weightChangeAmount: profileData.weightChangeAmount || 1,
      targetDate: profileData.targetDate || getTodayDate(),
    });
  }, [profileData]);

  const handleSave = () => {
    if (profile.age < 10 || profile.age > 100) {
      Alert.alert('エラー', '年齢は10〜100歳の間で入力してください');
      return;
    }

    if (profile.height < 140 || profile.height > 220) {
      Alert.alert('エラー', '身長は140〜220cmの間で入力してください');
      return;
    }

    if (profile.weight < 30 || profile.weight > 200) {
      Alert.alert('エラー', '体重は30〜200kgの間で入力してください');
      return;
    }

    onSave(profile);
    onClose();
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '';
    }
  };

  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'sedentary': return '座りがち（運動なし）';
      case 'light': return '軽い活動（週1-3回）';
      case 'moderate': return '中程度（週3-5回）';
      case 'active': return '活発（週6-7回）';
      case 'very-active': return '非常に活発（1日2回）';
      default: return '';
    }
  };

  const genderOptions = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' },
  ];

  const activityOptions = [
    { value: 'sedentary', label: '座りがち（運動なし）' },
    { value: 'light', label: '軽い活動（週1-3回）' },
    { value: 'moderate', label: '中程度（週3-5回）' },
    { value: 'active', label: '活発（週6-7回）' },
    { value: 'very-active', label: '非常に活発（1日2回）' },
  ];

  const weightChangeDirectionOptions = [
    { value: 'decrease', label: '減量' },
    { value: 'increase', label: '増量' },
    { value: 'maintain', label: '維持' },
  ];

  const weightChangeAmountOptions = Array.from({ length: 60 }, (_, i) => {
    const value = (i + 1) * 0.5;
    return { value, label: `${value}kg` };
  });

  // Simple Calendar Component
  const SimpleCalendar = ({ selectedDate, onDateSelect, minDate }: {
    selectedDate?: string;
    onDateSelect: (dateString: string) => void;
    minDate: string;
  }) => {
    const { width: screenWidth } = Dimensions.get('window');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const [displayMonth, setDisplayMonth] = useState(currentMonth);
    const [displayYear, setDisplayYear] = useState(currentYear);

    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    const minDateObj = new Date(minDate);

    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];

    // Create calendar days array
    const calendarDays = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const goToPreviousMonth = () => {
      if (displayMonth === 0) {
        setDisplayMonth(11);
        setDisplayYear(displayYear - 1);
      } else {
        setDisplayMonth(displayMonth - 1);
      }
    };

    const goToNextMonth = () => {
      if (displayMonth === 11) {
        setDisplayMonth(0);
        setDisplayYear(displayYear + 1);
      } else {
        setDisplayMonth(displayMonth + 1);
      }
    };

    const isPrevDisabled = displayYear < currentYear || (displayYear === currentYear && displayMonth <= currentMonth);

    return (
      <View style={styles.calendar}>
        {/* Calendar Header */}
        <View style={styles.calendarNavigation}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            disabled={isPrevDisabled}
            style={[styles.calendarNavButton, isPrevDisabled && styles.calendarNavButtonDisabled]}
          >
            <ChevronLeft size={20} color={isPrevDisabled ? colors.text.tertiary : colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.calendarMonthYearContainer}>
            <Text style={styles.calendarMonthText}>{monthNames[displayMonth]}</Text>
            <Text style={styles.calendarYearText}>{displayYear}</Text>
          </View>

          <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
            <ChevronRight size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Week days header */}
        <View style={styles.calendarWeekDays}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarDaysContainer}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
            }

            const dateString = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const currentDateObj = new Date(displayYear, displayMonth, day);
            const isSelected = selectedDate === dateString;
            const isDisabled = currentDateObj < minDateObj;
            const isToday = dateString === today.toISOString().split('T')[0];

            return (
              <TouchableOpacity
                key={`day-${index}`}
                onPress={() => !isDisabled && onDateSelect(dateString)}
                disabled={isDisabled}
                style={[
                  styles.calendarDayCell,
                  isToday && !isSelected && styles.calendarTodayCell,
                  isSelected && styles.calendarSelectedCell,
                  isDisabled && styles.calendarDisabledCell,
                ]}
              >
                <Text style={[
                  styles.calendarDayText,
                  isToday && !isSelected && styles.calendarTodayText,
                  isSelected && styles.calendarSelectedText,
                  isDisabled && styles.calendarDisabledText,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // DropdownSelector コンポーネント
  const DropdownSelector = ({
    label,
    value,
    options,
    onSelect,
    displayValue
  }: {
    label: string;
    value: any;
    options: Array<{ value: any; label: string }>;
    onSelect: (value: any) => void;
    displayValue?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <View style={styles.dropdownContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.dropdownValue}>
            {displayValue || options.find(opt => opt.value === value)?.label || 'Select...'}
          </Text>
          <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    value === option.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    value === option.value && styles.dropdownItemTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <User size={20} color={colors.primary.main} />
              <Text style={styles.headerTitle}>基本情報</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            {/* 年齢と身長 */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="年齢"
                  value={profile.age}
                  options={Array.from({ length: 91 }, (_, i) => ({
                    value: i + 10,
                    label: `${i + 10}`
                  }))}
                  onSelect={(age) => setProfile(prev => ({ ...prev, age }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="身長 (cm)"
                  value={profile.height}
                  options={Array.from({ length: 81 }, (_, i) => ({
                    value: i + 140,
                    label: `${i + 140}cm`
                  }))}
                  onSelect={(height) => setProfile(prev => ({ ...prev, height }))}
                />
              </View>
            </View>

            {/* 体重と性別 */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="体重 (kg)"
                  value={profile.weight}
                  options={Array.from({ length: 171 }, (_, i) => ({
                    value: i + 30,
                    label: `${i + 30}kg`
                  }))}
                  onSelect={(weight) => setProfile(prev => ({ ...prev, weight }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="性別"
                  value={profile.gender}
                  options={genderOptions}
                  onSelect={(gender) => setProfile(prev => ({ ...prev, gender }))}
                />
              </View>
            </View>

            {/* 活動レベル */}
            <View style={styles.fullWidthGroup}>
              <DropdownSelector
                label="活動レベル"
                value={profile.activityLevel}
                options={activityOptions}
                onSelect={(activityLevel) => setProfile(prev => ({ ...prev, activityLevel }))}
              />
            </View>

            {/* 体重変化の目標 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>体重変化の目標</Text>

              <View style={styles.goalRow}>
                {/* Direction Selection */}
                <View style={styles.goalInputGroup}>
                  <Text style={styles.goalLabel}>増減</Text>
                  <DropdownSelector
                    label=""
                    value={profile.weightChangeDirection || 'decrease'}
                    options={weightChangeDirectionOptions}
                    onSelect={(weightChangeDirection) => {
                      setProfile(prev => ({
                        ...prev,
                        weightChangeDirection,
                        // 維持を選択した場合は変化量を0kgに設定
                        weightChangeAmount: weightChangeDirection === 'maintain' ? 0 : prev.weightChangeAmount || 1
                      }));
                    }}
                  />
                </View>

                {/* Amount Input */}
                <View style={styles.goalInputGroup}>
                  <Text style={styles.goalLabel}>変化量</Text>
                  <DropdownSelector
                    label=""
                    value={profile.weightChangeDirection === 'maintain' ? 0 : (profile.weightChangeAmount || 1)}
                    options={profile.weightChangeDirection === 'maintain' ? [{ value: 0, label: '0kg' }] : weightChangeAmountOptions}
                    onSelect={(weightChangeAmount) => setProfile(prev => ({ ...prev, weightChangeAmount }))}
                  />
                </View>
              </View>

              {/* Target Date */}
              <View style={styles.fullWidthGroup}>
                <Text style={styles.goalLabel}>目標達成日</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={showCalendarPicker}
                >
                  <Calendar size={16} color={colors.text.secondary} />
                  <Text style={styles.dateText}>
                    {(profile.targetDate || getTodayDate()) ? new Date(profile.targetDate || getTodayDate()).toLocaleDateString('ja-JP') : '選択してください'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="更新"
            onPress={handleSave}
            style={styles.saveButton}
            icon={<RefreshCw size={16} color={colors.text.inverse} />}
          />
        </View>

        {/* Calendar Date Picker Modal */}
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
                    <Text style={styles.calendarCancel}></Text>
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
                    selectedDate={profile.targetDate}
                    onDateSelect={handleCalendarDateSelect}
                    minDate={getMinDate()}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  headerCard: {
    borderRadius: 0,
    marginBottom: 0,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  fullWidthGroup: {
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  dropdownContainer: {
    marginBottom: 0,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
  },
  dropdownValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    maxHeight: 200,
    zIndex: 1000,
    ...shadows.md,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light + '50',
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  dropdownItemTextSelected: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Goal section styles
  sectionContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  goalInputGroup: {
    flex: 1,
     marginBottom: spacing.xs,
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
  // Calendar Picker Styles
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarDone: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarContent: {
    padding: spacing.lg,
  },
  calendar: {
    backgroundColor: colors.background.primary,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calendarNavButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  calendarNavButtonDisabled: {
    opacity: 0.3,
  },
  calendarMonthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calendarMonthText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  calendarYearText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    paddingVertical: spacing.sm,
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: 47,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  calendarTodayCell: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.full,
  },
  calendarSelectedCell: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.full,
  },
  calendarDisabledCell: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  calendarTodayText: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  calendarSelectedText: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  calendarDisabledText: {
    color: colors.text.tertiary,
  },
});