import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { WorkoutDay } from '../types/workout.types';
import DatabaseService from '../../../services/database/DatabaseService';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutPreviewModalProps {
  isVisible: boolean;
  selectedDay: number | null;
  selectedMonth: number;
  selectedYear: number;
  onClose: () => void;
}

export const WorkoutPreviewModal: React.FC<WorkoutPreviewModalProps> = ({
  isVisible,
  selectedDay,
  selectedMonth,
  selectedYear,
  onClose
}) => {
  const [workoutData, setWorkoutData] = useState<WorkoutDay | null>(null);

  useEffect(() => {
    if (isVisible && selectedDay) {
      loadWorkoutData();
    }
  }, [isVisible, selectedDay, selectedMonth, selectedYear]);

  const loadWorkoutData = async () => {
    if (!selectedDay) return;

    try {
      await DatabaseService.initialize();

      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

      // セッション情報を取得
      const session = await DatabaseService.getFirstAsync<any>(
        'SELECT * FROM workout_session WHERE date = ?',
        [dateString]
      );

      if (!session) {
        setWorkoutData(null);
        return;
      }

      // ワークアウトデータを取得
      const workoutSets = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, em.name_ja as exercise_name, em.muscle_group
         FROM workout_set ws
         LEFT JOIN exercise_master em ON ws.exercise_id = em.exercise_id
         WHERE ws.session_id = ?
         ORDER BY ws.exercise_id, ws.set_number`,
        [session.session_id]
      );

      // データを整形
      const exerciseMap = new Map();
      let totalSets = 0;
      let totalVolume = 0;

      workoutSets.forEach(set => {
        const exerciseId = set.exercise_id;
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            name: set.exercise_name || `Exercise ${exerciseId}`,
            sets: [],
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0
          });
        }

        const exercise = exerciseMap.get(exerciseId);
        exercise.sets.push({
          setNumber: set.set_number,
          weight: set.weight_kg || 0,
          reps: set.reps || 0,
          time: set.time_minutes,
          distance: set.distance_km
        });

        exercise.totalSets++;
        exercise.totalReps += set.reps || 0;
        exercise.maxWeight = Math.max(exercise.maxWeight, set.weight_kg || 0);

        totalSets++;
        totalVolume += (set.weight_kg || 0) * (set.reps || 0);
      });

      const exercises = Array.from(exerciseMap.values());
      const score = Math.round(totalVolume / 100);

      setWorkoutData({
        date: selectedDay,
        exercises,
        totalSets,
        score
      });
    } catch (error) {
      console.error('Failed to load workout data:', error);
      setWorkoutData(null);
    }
  };

  if (!workoutData) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {selectedMonth + 1}月{selectedDay}日のワークアウト
              </Text>
              <Text style={styles.modalSubtitle}>
                スコア: {workoutData?.score} • {workoutData?.totalSets}セット
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={true}
            bounces={true}
            contentContainerStyle={styles.scrollContent}
          >
            {workoutData?.exercises.map((exercise, index) => (
              <View key={index} style={styles.modalExercise}>
                <View style={styles.modalExerciseHeader}>
                  <Text style={styles.modalExerciseName}>{exercise.name}</Text>
                  <Text style={styles.modalExerciseStats}>
                    {exercise.totalSets}セット • Max: {exercise.maxWeight}kg
                  </Text>
                </View>

                <View style={styles.modalSets}>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.modalSet}>
                      <View style={styles.modalSetNumber}>
                        <Text style={styles.modalSetNumberText}>{setIndex + 1}</Text>
                      </View>
                      <Text style={styles.modalSetText}>
                        {set.time ?
                          `${set.time}分${set.distance ? ` • ${set.distance}km` : ''}` :
                          `${set.weight > 0 ? `${set.weight}kg` : '体重'} × ${set.reps}回`
                        }
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: radius.xl,
    width: screenWidth * 0.9,
    maxWidth: 400,
    height: '80%',
    overflow: 'hidden',
    ...shadows.xl,
  },
  modalHeader: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    color: 'white',
    fontFamily: typography.fontFamily.bold,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xxxs,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalExercise: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalExerciseName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  modalExerciseStats: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  modalSets: {
    gap: spacing.sm,
  },
  modalSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  modalSetNumber: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSetNumberText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  modalSetText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
});