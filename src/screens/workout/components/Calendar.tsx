import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { WorkoutDay } from '../types/workout.types';
import DatabaseService from '../../../services/database/DatabaseService';

const { width: screenWidth } = Dimensions.get('window');

interface CalendarProps {
  onDayClick: (day: number, month: number, year: number) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onDayClick }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);

  const today = currentDate.getDate();
  const todayMonth = currentDate.getMonth();
  const todayYear = currentDate.getFullYear();

  useEffect(() => {
    // 月が変わった時は一旦クリア
    setWorkoutDays([]);
    loadWorkoutDays();
    debugSessions();
  }, [selectedMonth, selectedYear]);

  // デバッグ用：全セッションの状態を確認
  const debugSessions = async () => {
    try {
      const allSessions = await DatabaseService.getAllAsync(
        `SELECT ws.session_id, 
                ws.date, 
                COUNT(wset.set_id) as set_count
         FROM workout_session ws
         LEFT JOIN workout_set wset ON ws.session_id = wset.session_id
         WHERE date(ws.date) >= date('2025-09-01')
         GROUP BY ws.session_id
         ORDER BY ws.date DESC`
      );
    } catch (error) {
      console.error('Failed to debug sessions:', error);
    }
  };

  const loadWorkoutDays = async () => {
    try {
      await DatabaseService.initialize();

      // 月の日付を正しくフォーマット（2桁の0埋め）
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const startDate = `${selectedYear}-${monthStr}-01`;
      
      // 月末日を正確に計算
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDate = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;


      // データベースの日付形式を確認するデバッグコード
      const debugDates = await DatabaseService.getAllAsync<any>(
        `SELECT session_id, date, datetime(date) as formatted_date 
         FROM workout_session 
         ORDER BY date DESC 
         LIMIT 10`
      );

      // LEFT JOINに変更し、セットが存在するセッションのみをフィルタ
      const sessions = await DatabaseService.getAllAsync<any>(
        `SELECT DISTINCT date(ws.date) as date, 
                COUNT(wset.set_id) as set_count
         FROM workout_session ws
         LEFT JOIN workout_set wset ON ws.session_id = wset.session_id
         WHERE date(ws.date) >= date(?) AND date(ws.date) <= date(?)
         GROUP BY date(ws.date)
         HAVING COUNT(wset.set_id) > 0
         ORDER BY ws.date`,
        [startDate, endDate]
      );


      if (sessions && sessions.length > 0) {
        const days = sessions.map(session => {
          const dateParts = session.date.split('-');
          const day = parseInt(dateParts[2], 10);
          return day;
        });
        setWorkoutDays(days);
      } else {
        setWorkoutDays([]);
      }
    } catch (error) {
      console.error('Failed to load workout days:', error);
      setWorkoutDays([]);
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

 const monthNames = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

  // Create calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const hasWorkout = (day: number): boolean => {
    const result = workoutDays.includes(day);
    return result;
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
    width: '14.28%',
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