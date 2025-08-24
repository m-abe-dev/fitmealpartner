import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { WorkoutDay } from '../types/workout.types';
import { workoutHistory, monthNames } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

interface CalendarProps {
  onDayClick: (day: number) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onDayClick }) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = currentDate.getDate();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

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
      onDayClick(day);
    }
  };

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Text style={styles.monthText}>{monthNames[currentMonth]}</Text>
        <Text style={styles.yearText}>{currentYear}</Text>
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

          const isToday = day === today;
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