import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';

interface SimpleCalendarProps {
  selectedDate?: string;
  onDateSelect: (dateString: string) => void;
  minDate?: string;
  maxDate?: string;
  showYearSelector?: boolean;
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  showYearSelector = false,
}) => {
  const today = new Date();
  const initialDate = selectedDate ? new Date(selectedDate) : today;
  
  const [displayMonth, setDisplayMonth] = useState(initialDate.getMonth());
  const [displayYear, setDisplayYear] = useState(initialDate.getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const minDateObj = minDate ? new Date(minDate) : new Date(1900, 0, 1);
  const maxDateObj = maxDate ? new Date(maxDate) : new Date(2100, 11, 31);

  // 年の選択肢を生成
  const startYear = minDateObj.getFullYear();
  const endYear = maxDateObj.getFullYear();
  const yearOptions = Array.from(
    { length: endYear - startYear + 1 }, 
    (_, i) => startYear + i
  ).reverse();

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
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

  const isPrevDisabled = () => {
    const currentDisplay = new Date(displayYear, displayMonth, 1);
    const minDisplay = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
    return currentDisplay <= minDisplay;
  };

  const isNextDisabled = () => {
    const currentDisplay = new Date(displayYear, displayMonth, 1);
    const maxDisplay = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), 1);
    return currentDisplay >= maxDisplay;
  };

  const handleYearSelect = (year: number) => {
    setDisplayYear(year);
    setShowYearPicker(false);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarNavigation}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          disabled={isPrevDisabled()}
          style={[styles.calendarNavButton, isPrevDisabled() && styles.calendarNavButtonDisabled]}
        >
          <ChevronLeft size={20} color={isPrevDisabled() ? colors.text.tertiary : colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.calendarMonthYearContainer}
          onPress={showYearSelector ? () => setShowYearPicker(true) : undefined}
          disabled={!showYearSelector}
        >
          <Text style={styles.calendarMonthText}>{monthNames[displayMonth]}</Text>
          <Text style={[
            styles.calendarYearText,
            showYearSelector && styles.calendarYearClickable
          ]}>
            {displayYear}年
          </Text>
          {showYearSelector && (
            <ChevronDown size={16} color={colors.primary.main} style={styles.yearDropdownIcon} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={goToNextMonth} 
          disabled={isNextDisabled()}
          style={[styles.calendarNavButton, isNextDisabled() && styles.calendarNavButtonDisabled]}
        >
          <ChevronRight size={20} color={isNextDisabled() ? colors.text.tertiary : colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarWeekDays}>
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarDaysContainer}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
          }

          const dateString = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const currentDateObj = new Date(displayYear, displayMonth, day);
          const isSelected = selectedDate === dateString;
          const isDisabled = currentDateObj < minDateObj || currentDateObj > maxDateObj;
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

      {/* Year Picker Modal */}
      {showYearPicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showYearPicker}
          onRequestClose={() => setShowYearPicker(false)}
        >
          <TouchableOpacity 
            style={styles.yearPickerOverlay}
            activeOpacity={1}
            onPress={() => setShowYearPicker(false)}
          >
            <View style={styles.yearPickerContainer}>
              <View style={styles.yearPickerHeader}>
                <Text style={styles.yearPickerTitle}>年を選択</Text>
              </View>
              <ScrollView 
                style={styles.yearPickerScroll}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.yearPickerContent}
              >
                {yearOptions.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearPickerItem,
                      displayYear === year && styles.yearPickerItemSelected
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text style={[
                      styles.yearPickerItemText,
                      displayYear === year && styles.yearPickerItemTextSelected
                    ]}>
                      {year}年
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  calendarYearClickable: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
  yearDropdownIcon: {
    marginLeft: 4,
  },
  // Year Picker styles
  yearPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  yearPickerHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  yearPickerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  yearPickerScroll: {
    maxHeight: 300,
  },
  yearPickerContent: {
    paddingVertical: spacing.sm,
  },
  yearPickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  yearPickerItemSelected: {
    backgroundColor: colors.primary.light,
  },
  yearPickerItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlign: 'center',
  },
  yearPickerItemTextSelected: {
    color: colors.primary.main,
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
    width: '14.28%',
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