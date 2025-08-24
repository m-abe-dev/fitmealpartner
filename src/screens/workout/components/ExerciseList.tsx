import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { Badge } from '../../../components/common/Badge';
import { Exercise } from '../types/workout.types';


interface ExerciseListProps {
  exercises: Exercise[];
  onToggleExpansion: (exerciseId: string) => void;
  onAddSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'time' | 'distance', value: string) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  onToggleExpansion,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
  onUpdateSet,
}) => {

  const handleAddSet = (exerciseId: string) => {
    onAddSet(exerciseId);
  };

  return (
    <View style={styles.exercisesSection}>
        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <TouchableOpacity
              style={styles.exerciseHeader}
              onPress={() => onToggleExpansion(exercise.id)}
            >
              <View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseSummary}>
                  {exercise.type === 'cardio' ? (
                    `${exercise.sets.length} セット • 合計時間: ${exercise.sets.reduce((total, set) => total + (set.time || 0), 0)}分 • 合計距離: ${exercise.sets.reduce((total, set) => total + (set.distance || 0), 0)}km`
                  ) : (
                    `${exercise.sets.length} セット • ${exercise.sets.reduce((total, set) => total + set.reps, 0)} 回 • Max: ${Math.max(...exercise.sets.map(s => s.weight), 0)}kg • 合計RM: ${exercise.sets.reduce((total, set) => total + (set.rm || 0), 0).toFixed(2)}kg`
                  )}
                </Text>
              </View>
              <View style={styles.exerciseActions}>
                <Badge variant="default" size="small" style={styles.setBadge}>
                  {exercise.sets.length}セット
                </Badge>
                {exercise.isExpanded ?
                  <ChevronUp size={20} color={colors.text.tertiary} /> :
                  <ChevronDown size={20} color={colors.text.tertiary} />
                }
              </View>
            </TouchableOpacity>

            {exercise.isExpanded && (
              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    
                    {exercise.type === 'cardio' ? (
                      <View style={styles.cardioInputContainer}>
                        <View style={styles.cardioInputRow}>
                          <TextInput
                            style={styles.timeInput}
                            value={set.time?.toString() || ''}
                            onChangeText={(value) => onUpdateSet(exercise.id, set.id, 'time', value)}
                            keyboardType="numeric"
                            placeholder="時間"
                            placeholderTextColor={colors.text.tertiary}
                          />
                          <Text style={styles.unitText}>分</Text>
                          <TextInput
                            style={styles.distanceInput}
                            value={set.distance?.toString() || ''}
                            onChangeText={(value) => onUpdateSet(exercise.id, set.id, 'distance', value)}
                            keyboardType="numeric"
                            placeholder="距離"
                            placeholderTextColor={colors.text.tertiary}
                          />
                          <Text style={styles.unitText}>km</Text>
                        </View>
                        <Text style={styles.paceText}>
                          ペース: {set.time && set.distance && set.distance > 0 ? (set.time / set.distance).toFixed(1) : 0}分/km
                        </Text>
                      </View>
                    ) : (
                      <>
                        <TextInput
                          style={styles.weightInput}
                          value={set.weight.toString()}
                          onChangeText={(value) => onUpdateSet(exercise.id, set.id, 'weight', value)}
                          keyboardType="numeric"
                          placeholder="重量"
                          placeholderTextColor={colors.text.tertiary}
                        />
                        <Text style={styles.unitText}>kg ×</Text>
                        <TextInput
                          style={styles.repsInput}
                          value={set.reps.toString()}
                          onChangeText={(value) => onUpdateSet(exercise.id, set.id, 'reps', value)}
                          keyboardType="numeric"
                          placeholder="回数"
                          placeholderTextColor={colors.text.tertiary}
                        />
                        <Text style={styles.unitText}>回</Text>
                        <Text style={styles.rmText}>
                          1RM: {(set.rm || 0).toFixed(2)}kg
                        </Text>
                      </>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => {
                        if (exercise.sets.length === 1) {
                          onDeleteExercise(exercise.id);
                        } else {
                          onDeleteSet(exercise.id, set.id);
                        }
                      }}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={16} color={colors.status.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => handleAddSet(exercise.id)}
                >
                  <Plus size={16} color={colors.primary.main} />
                  <Text style={styles.addSetText}>セットを追加</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  exercisesSection: {
    gap: spacing.sm,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.xs, // 各カード間の余白を調整
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  exerciseName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xxxs,
  },
  exerciseSummary: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#EFF6FF',
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
  },
  setNumber: {
    width: 24,
    height: 24,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  weightInput: {
    width: 60,
    padding: spacing.xs,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.sm,
    fontSize: typography.fontSize.sm,
    backgroundColor: 'white',
  },
  repsInput: {
    width: 60,
    padding: spacing.xs,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.sm,
    fontSize: typography.fontSize.sm,
    backgroundColor: 'white',
  },
  unitText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  rmText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  timeInput: {
    width: 60,
    padding: spacing.xs,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.sm,
    fontSize: typography.fontSize.sm,
    backgroundColor: 'white',
  },
  distanceInput: {
    width: 60,
    padding: spacing.xs,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.sm,
    fontSize: typography.fontSize.sm,
    backgroundColor: 'white',
  },
  cardioInputContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  cardioInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paceText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary[200],
    borderStyle: 'dashed',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
  },
  addSetText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
});