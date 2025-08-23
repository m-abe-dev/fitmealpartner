import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Crown,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Clock,
  Target,
  TrendingUp,
  Edit3,
  Copy
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { WorkoutSetItem } from '../../components/common/WorkoutSetItem';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutDay {
  date: string;
  hasWorkout: boolean;
  isToday: boolean;
  workoutSummary?: {
    duration: number;
    exercises: number;
    volume: number;
  };
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  isExpanded: boolean;
  lastWorkout?: {
    date: string;
    bestSet: { weight: number; reps: number };
  };
}

interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  restTime?: number;
  notes?: string;
  oneRepMax?: number;
}

export const WorkoutScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'ベンチプレス',
      muscleGroup: '大胸筋',
      isExpanded: true,
      lastWorkout: {
        date: '2024-01-15',
        bestSet: { weight: 80, reps: 8 }
      },
      sets: [
        { id: '1-1', setNumber: 1, weight: 60, reps: 10, completed: true },
        { id: '1-2', setNumber: 2, weight: 70, reps: 8, completed: true },
        { id: '1-3', setNumber: 3, weight: 75, reps: 6, completed: false },
      ]
    },
    {
      id: '2',
      name: 'ダンベルプレス',
      muscleGroup: '大胸筋',
      isExpanded: false,
      lastWorkout: {
        date: '2024-01-15',
        bestSet: { weight: 30, reps: 12 }
      },
      sets: [
        { id: '2-1', setNumber: 1, weight: 25, reps: 12, completed: true },
        { id: '2-2', setNumber: 2, weight: 30, reps: 10, completed: false },
        { id: '2-3', setNumber: 3, weight: 0, reps: 0, completed: false },
      ]
    }
  ]);

  // カレンダー用のモックデータ
  const generateCalendarDays = (): WorkoutDay[] => {
    const days: WorkoutDay[] = [];
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const today = new Date();

    for (let date = 1; date <= endOfMonth.getDate(); date++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
      const dateString = dayDate.toISOString().split('T')[0];
      const isToday = dayDate.toDateString() === today.toDateString();
      const hasWorkout = [5, 7, 10, 12, 15, 17, 20, 22].includes(date); // モックデータ

      days.push({
        date: dateString,
        hasWorkout,
        isToday,
        workoutSummary: hasWorkout ? {
          duration: 65,
          exercises: 6,
          volume: 1250
        } : undefined
      });
    }

    return days;
  };

  const [calendarDays] = useState<WorkoutDay[]>(generateCalendarDays());

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleExerciseExpansion = (exerciseId: string) => {
    setExercises(prev => prev.map(exercise =>
      exercise.id === exerciseId
        ? { ...exercise, isExpanded: !exercise.isExpanded }
        : exercise
    ));
  };

  const updateSet = (exerciseId: string) => (setId: string, updates: Partial<WorkoutSet>) => {
    setExercises(prev => prev.map(exercise =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map(set =>
              set.id === setId ? { ...set, ...updates } : set
            )
          }
        : exercise
    ));
  };

  const deleteSet = (exerciseId: string) => (setId: string) => {
    setExercises(prev => prev.map(exercise =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== setId)
          }
        : exercise
    ));
  };

  const completeSet = (exerciseId: string) => (setId: string) => {
    setExercises(prev => prev.map(exercise =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map(set =>
              set.id === setId ? { ...set, completed: true } : set
            )
          }
        : exercise
    ));
  };

  const addSet = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newSetNumber = exercise.sets.length + 1;
    const newSet: WorkoutSet = {
      id: `${exerciseId}-${newSetNumber}`,
      setNumber: newSetNumber,
      weight: 0,
      reps: 0,
      completed: false
    };

    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: [...ex.sets, newSet] }
        : ex
    ));
  };

  const copyLastWorkout = (exerciseId: string) => {
    // 前回のワークアウトデータをコピーする処理
    console.log('Copying last workout for exercise:', exerciseId);
  };

  const startWorkout = () => {
    setWorkoutInProgress(true);
  };

  const endWorkout = () => {
    setWorkoutInProgress(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Dumbbell size={24} color={colors.primary.main} />
          <Text style={styles.headerTitle}>筋トレ</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButton}>
            <Crown size={16} color={colors.primary.main} />
            <Text style={styles.proButtonText}>PRO</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* カレンダーセクション */}
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </Text>
            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <View key={day} style={styles.calendarDayHeader}>
                <Text style={styles.calendarDayHeaderText}>{day}</Text>
              </View>
            ))}

            {calendarDays.map((day, index) => {
              const dayDate = new Date(day.date);
              const dayOfWeek = dayDate.getDay();

              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.calendarDay,
                    day.hasWorkout && styles.calendarDayWithWorkout,
                    day.isToday && styles.calendarDayToday,
                    selectedDate.toDateString() === dayDate.toDateString() && styles.calendarDaySelected
                  ]}
                  onPress={() => setSelectedDate(dayDate)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    day.hasWorkout && styles.calendarDayTextWithWorkout,
                    day.isToday && styles.calendarDayTextToday
                  ]}>
                    {dayDate.getDate()}
                  </Text>
                  {day.hasWorkout && (
                    <View style={styles.workoutIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 今日の統計 */}
        {workoutInProgress && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <View style={styles.statIcon}>
                <Clock size={20} color={colors.primary.main} />
              </View>
              <Text style={styles.statValue}>45分</Text>
              <Text style={styles.statLabel}>経過時間</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIcon}>
                <Dumbbell size={20} color={colors.status.success} />
              </View>
              <Text style={styles.statValue}>1,250kg</Text>
              <Text style={styles.statLabel}>総ボリューム</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={20} color={colors.status.warning} />
              </View>
              <Text style={styles.statValue}>8/12</Text>
              <Text style={styles.statLabel}>完了セット</Text>
            </Card>
          </View>
        )}

        {/* ワークアウト開始/終了ボタン */}
        {!workoutInProgress ? (
          <Card style={styles.startWorkoutCard}>
            <Text style={styles.startWorkoutTitle}>今日のワークアウト</Text>
            <Text style={styles.startWorkoutSubtitle}>プッシュデイ（胸・肩・三頭）</Text>
            <Button
              title="ワークアウトを開始"
              variant="primary"
              onPress={startWorkout}
              style={styles.startWorkoutButton}
            />
          </Card>
        ) : (
          <Card style={styles.endWorkoutCard}>
            <Text style={styles.endWorkoutTitle}>ワークアウト進行中</Text>
            <View style={styles.endWorkoutActions}>
              <Button
                title="一時停止"
                variant="outline"
                onPress={() => {}}
                style={{ flex: 1 }}
              />
              <Button
                title="終了"
                variant="primary"
                onPress={endWorkout}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* エクササイズリスト */}
        {workoutInProgress && (
          <View style={styles.exercisesSection}>
            <Text style={styles.exercisesSectionTitle}>エクササイズ</Text>

            {exercises.map((exercise) => (
              <Card key={exercise.id} style={styles.exerciseCard}>
                <TouchableOpacity
                  style={styles.exerciseHeader}
                  onPress={() => toggleExerciseExpansion(exercise.id)}
                >
                  <View style={styles.exerciseHeaderLeft}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Badge variant="default" size="small">
                      {exercise.muscleGroup}
                    </Badge>
                  </View>
                  <View style={styles.exerciseHeaderRight}>
                    {exercise.lastWorkout && (
                      <Text style={styles.lastWorkoutText}>
                        前回: {exercise.lastWorkout.bestSet.weight}kg × {exercise.lastWorkout.bestSet.reps}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyLastWorkout(exercise.id)}
                    >
                      <Copy size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {exercise.isExpanded && (
                  <View style={styles.setsSection}>
                    <View style={styles.setsHeader}>
                      <Text style={styles.setsHeaderText}>セット</Text>
                      <Text style={styles.setsHeaderText}>重量</Text>
                      <Text style={styles.setsHeaderText}>回数</Text>
                      <Text style={styles.setsHeaderText}>RPE</Text>
                      <Text style={styles.setsHeaderText}>✓</Text>
                    </View>

                    {exercise.sets.map((set) => (
                      <WorkoutSetItem
                        key={set.id}
                        set={set}
                        onUpdate={updateSet(exercise.id)}
                        onDelete={deleteSet(exercise.id)}
                        onComplete={completeSet(exercise.id)}
                        isEditing={true}
                        style={styles.setItem}
                      />
                    ))}

                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={() => addSet(exercise.id)}
                    >
                      <View style={styles.addSetIcon}>
                        <Plus size={20} color={colors.primary.main} />
                      </View>
                      <Text style={styles.addSetText}>セットを追加</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* 過去のワークアウト履歴 */}
        {!workoutInProgress && (
          <Card style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>最近のワークアウト</Text>
              <TouchableOpacity>
                <Text style={styles.historyViewAll}>すべて見る</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.historyList}>
              {[
                { date: '2024-01-20', type: 'プッシュ', duration: 65, volume: 1250, exercises: 6 },
                { date: '2024-01-18', type: 'プル', duration: 58, volume: 1180, exercises: 5 },
                { date: '2024-01-16', type: 'レッグ', duration: 72, volume: 1420, exercises: 7 },
              ].map((workout, index) => (
                <TouchableOpacity key={index} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyDate}>
                      {new Date(workout.date).toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.historyType}>{workout.type}</Text>
                  </View>
                  <View style={styles.historyItemRight}>
                    <Text style={styles.historyStats}>
                      {workout.duration}分 • {workout.exercises}種目 • {workout.volume}kg
                    </Text>
                    <View style={styles.historyTrend}>
                      <TrendingUp size={14} color={colors.status.success} />
                      <Text style={styles.historyTrendText}>+15kg</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* フローティングアクションボタン */}
      <FloatingActionButton
        onPress={workoutInProgress ? () => {} : startWorkout}
        icon={<Plus size={24} color={colors.text.inverse} />}
        style={styles.fab}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  proButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  calendarCard: {
    marginBottom: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  calendarNavButton: {
    padding: spacing.xs,
  },
  calendarTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: screenWidth / 7 - spacing.md * 2 / 7,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  calendarDayHeaderText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  calendarDay: {
    width: screenWidth / 7 - spacing.md * 2 / 7,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: radius.sm,
    marginVertical: spacing.xxxs,
  },
  calendarDayWithWorkout: {
    backgroundColor: colors.status.success + '20',
  },
  calendarDayToday: {
    backgroundColor: colors.primary[50],
  },
  calendarDaySelected: {
    backgroundColor: colors.primary.main,
  },
  calendarDayText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  calendarDayTextWithWorkout: {
    color: colors.status.success,
    fontFamily: typography.fontFamily.bold,
  },
  calendarDayTextToday: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.status.success,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statIcon: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xxxs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  startWorkoutCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  startWorkoutTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xs,
  },
  startWorkoutSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  startWorkoutButton: {
    minWidth: 200,
  },
  endWorkoutCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  endWorkoutTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  endWorkoutActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exercisesSection: {
    marginBottom: spacing.xl,
  },
  exercisesSectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.md,
  },
  exerciseCard: {
    marginBottom: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  exerciseHeaderLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  exerciseName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  exerciseHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  lastWorkoutText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  copyButton: {
    padding: spacing.xs,
  },
  setsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  setsHeaderText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.bold,
    flex: 1,
    textAlign: 'center',
  },
  setItem: {
    marginBottom: spacing.xs,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.sm,
  },
  addSetIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetText: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  historyViewAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  historyItemLeft: {
    gap: spacing.xxxs,
  },
  historyDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  historyType: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  historyItemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  historyStats: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  historyTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  historyTrendText: {
    fontSize: typography.fontSize.xs,
    color: colors.status.success,
    fontFamily: typography.fontFamily.bold,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
  },
});