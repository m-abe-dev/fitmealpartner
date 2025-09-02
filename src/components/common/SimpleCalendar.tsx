import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';

interface SimpleCalendarProps {
  selectedDate?: string;
  onDateSelect: (dateString: string) => void;
  minDate: string;
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate
}) => {
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

  const isPrevDisabled = displayYear < currentYear || (displayYear === currentYear && displayMonth <= currentMonth);

  return (
    <View style={styles.calendar}>
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