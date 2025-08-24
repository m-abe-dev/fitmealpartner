import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { WorkoutDay } from '../types/workout.types';
import { workoutHistory, monthNames } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

interface CalendarProps {
  onDayClick: (day: number, month: number, year: number) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onDayClick }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const today = currentDate.getDate();
  const todayMonth = currentDate.getMonth();
  const todayYear = currentDate.getFullYear();

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  // Create calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const hasWorkout = (day: number): boolean => {
    return workoutHistory.some(workout => workout.date === day);
  };

  const handleDayClick = (day: number) => {
    if (hasWorkout(day)) {
      onDayClick(day, selectedMonth, selectedYear);
    }
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthText}>{monthNames[selectedMonth]}</Text>
          <Text style={styles.yearText}>{selectedYear}</Text>
        </View>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Week days header */}
      <View style={styles.weekDaysContainer}>
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <Text key={index} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const isToday = day === today && selectedMonth === todayMonth && selectedYear === todayYear;
          const hasWorkoutDay = hasWorkout(day);

          return (
            <TouchableOpacity
              key={`day-${index}`}
              onPress={() => handleDayClick(day)}
              disabled={!hasWorkoutDay}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                hasWorkoutDay && !isToday && styles.workoutDayCell,
              ]}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.todayText,
                hasWorkoutDay && !isToday && styles.workoutDayText,
              ]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  yearText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    paddingVertical: spacing.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: screenWidth / 7 - spacing.md * 2 / 7,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xxxs,
  },
  todayCell: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.full,
  },
  workoutDayCell: {
    backgroundColor: '#D1FAE5',
    borderColor: colors.status.success,
    borderWidth: 2,
    borderRadius: radius.full,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  todayText: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  workoutDayText: {
    color: colors.status.success,
    fontFamily: typography.fontFamily.medium,
  },
});