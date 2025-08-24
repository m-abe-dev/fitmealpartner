import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { WorkoutDay } from '../types/workout.types';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutPreviewModalProps {
  isVisible: boolean;
  selectedDay: number | null;
  selectedDayWorkout: WorkoutDay | null;
  currentMonth: number;
  onClose: () => void;
}

export const WorkoutPreviewModal: React.FC<WorkoutPreviewModalProps> = ({
  isVisible,
  selectedDay,
  selectedDayWorkout,
  currentMonth,
  onClose
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {currentMonth + 1}月{selectedDay}日のワークアウト
              </Text>
              <Text style={styles.modalSubtitle}>
                スコア: {selectedDayWorkout?.score} • {selectedDayWorkout?.totalSets}セット
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {selectedDayWorkout?.exercises.map((exercise, index) => (
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
                        <Text style={styles.modalSetNumberText}>{set.setNumber}</Text>
                      </View>
                      <Text style={styles.modalSetText}>
                        {set.weight > 0 ? `${set.weight}kg` : '体重'} × {set.reps}回
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: radius.xl,
    maxWidth: screenWidth * 0.9,
    width: '100%',
    maxHeight: '80%',
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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