import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';

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

interface WorkoutSetItemProps {
  set: WorkoutSet;
  onUpdate: (id: string, updates: Partial<WorkoutSet>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  style?: ViewStyle;
  isEditing?: boolean;
  previousSet?: WorkoutSet;
  showOneRepMax?: boolean;
  weightUnit?: 'kg' | 'lbs';
}

export const WorkoutSetItem: React.FC<WorkoutSetItemProps> = ({
  set,
  onUpdate,
  onDelete,
  onComplete,
  style,
  isEditing = false,
  previousSet,
  showOneRepMax = true,
  weightUnit = 'kg',
}) => {
  const [localWeight, setLocalWeight] = useState(set.weight.toString());
  const [localReps, setLocalReps] = useState(set.reps.toString());
  const [isExpanded, setIsExpanded] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Calculate 1RM using Epley formula
  const calculateOneRepMax = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const handleWeightChange = (value: string) => {
    setLocalWeight(value);
    const numericValue = parseFloat(value) || 0;
    onUpdate(set.id, { weight: numericValue });
  };

  const handleRepsChange = (value: string) => {
    setLocalReps(value);
    const numericValue = parseInt(value) || 0;
    onUpdate(set.id, { reps: numericValue });
  };

  const handleComplete = () => {
    // Animate completion
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onComplete(set.id);
  };

  const oneRepMax = calculateOneRepMax(set.weight, set.reps);
  const isImprovement = previousSet && 
    (set.weight > previousSet.weight || 
     (set.weight === previousSet.weight && set.reps > previousSet.reps));

  const containerStyles = [
    styles.container,
    set.completed && styles.completedContainer,
    isExpanded && styles.expandedContainer,
    style,
  ];

  return (
    <Animated.View style={[containerStyles, { transform: [{ scale: scaleAnim }] }]}>
      {/* Main Set Row */}
      <View style={styles.mainRow}>
        {/* Set Number */}
        <View style={styles.setNumberContainer}>
          <Badge
            variant={set.completed ? 'success' : 'default'}
            size="small"
          >
            {set.setNumber}
          </Badge>
        </View>

        {/* Previous Set Indicator */}
        {previousSet && (
          <View style={styles.previousSetContainer}>
            <Text style={styles.previousSetText}>
              前回: {previousSet.weight}{weightUnit} × {previousSet.reps}
            </Text>
            {isImprovement && (
              <Badge variant="success" size="small">
                ⬆️
              </Badge>
            )}
          </View>
        )}

        {/* Weight Input */}
        <View style={styles.inputContainer}>
          <Input
            value={localWeight}
            onChangeText={handleWeightChange}
            placeholder="0"
            keyboardType="numeric"
            variant="outlined"
            size="small"
            style={styles.input}
            editable={!set.completed && isEditing}
          />
          <Text style={styles.unitLabel}>{weightUnit}</Text>
        </View>

        {/* Reps Input */}
        <View style={styles.inputContainer}>
          <Input
            value={localReps}
            onChangeText={handleRepsChange}
            placeholder="0"
            keyboardType="numeric"
            variant="outlined"
            size="small"
            style={styles.input}
            editable={!set.completed && isEditing}
          />
          <Text style={styles.unitLabel}>回</Text>
        </View>

        {/* 1RM Display */}
        {showOneRepMax && set.weight > 0 && set.reps > 0 && (
          <View style={styles.oneRepMaxContainer}>
            <Text style={styles.oneRepMaxLabel}>1RM</Text>
            <Text style={styles.oneRepMaxValue}>
              {oneRepMax}{weightUnit}
            </Text>
          </View>
        )}

        {/* Complete Button */}
        {!set.completed && isEditing && (
          <Button
            title="完了"
            onPress={handleComplete}
            variant="primary"
            size="small"
            style={styles.completeButton}
          />
        )}

        {/* Expand Button */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Rest Time */}
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>休憩時間:</Text>
            <Input
              value={set.restTime?.toString() || ''}
              onChangeText={(value) => onUpdate(set.id, { restTime: parseInt(value) || 0 })}
              placeholder="0"
              keyboardType="numeric"
              variant="outlined"
              size="small"
              style={styles.restTimeInput}
            />
            <Text style={styles.unitLabel}>秒</Text>
          </View>

          {/* Notes */}
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>メモ:</Text>
            <Input
              value={set.notes || ''}
              onChangeText={(value) => onUpdate(set.id, { notes: value })}
              placeholder="メモを入力..."
              variant="outlined"
              size="small"
              style={styles.notesInput}
              multiline
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button
              title="削除"
              onPress={() => onDelete(set.id)}
              variant="outline"
              size="small"
              style={styles.deleteButton}
            />
          </View>
        </View>
      )}

      {/* Completed Overlay */}
      {set.completed && (
        <View style={styles.completedOverlay}>
          <Text style={styles.completedText}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
};

// Workout Set List Component
interface WorkoutSetListProps {
  sets: WorkoutSet[];
  onUpdateSet: (id: string, updates: Partial<WorkoutSet>) => void;
  onDeleteSet: (id: string) => void;
  onCompleteSet: (id: string) => void;
  onAddSet: () => void;
  exerciseName: string;
  style?: ViewStyle;
  isEditing?: boolean;
}

export const WorkoutSetList: React.FC<WorkoutSetListProps> = ({
  sets,
  onUpdateSet,
  onDeleteSet,
  onCompleteSet,
  onAddSet,
  exerciseName,
  style,
  isEditing = true,
}) => {
  const completedSets = sets.filter(set => set.completed).length;
  const totalSets = sets.length;

  return (
    <View style={[styles.listContainer, style]}>
      {/* Header */}
      <View style={styles.listHeader}>
        <Text style={styles.exerciseTitle}>{exerciseName}</Text>
        <Badge variant="info" size="small">
          {completedSets}/{totalSets} 完了
        </Badge>
      </View>

      {/* Set Items */}
      <View style={styles.setsContainer}>
        {sets.map((set, index) => (
          <WorkoutSetItem
            key={set.id}
            set={set}
            onUpdate={onUpdateSet}
            onDelete={onDeleteSet}
            onComplete={onCompleteSet}
            previousSet={index > 0 ? sets[index - 1] : undefined}
            isEditing={isEditing}
            style={styles.setItem}
          />
        ))}
      </View>

      {/* Add Set Button */}
      {isEditing && (
        <Button
          title="+ セットを追加"
          onPress={onAddSet}
          variant="outline"
          style={styles.addSetButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
  },
  completedContainer: {
    backgroundColor: colors.status.success + '10',
    borderColor: colors.status.success,
  },
  expandedContainer: {
    ...shadows.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setNumberContainer: {
    minWidth: 32,
  },
  previousSetContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previousSetText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  inputContainer: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  input: {
    width: 60,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  oneRepMaxContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  oneRepMaxLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  oneRepMaxValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semibold,
  },
  completeButton: {
    paddingHorizontal: spacing.sm,
  },
  expandButton: {
    padding: spacing.xs,
  },
  expandIcon: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  expandedContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expandedLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    minWidth: 80,
  },
  restTimeInput: {
    width: 80,
    textAlign: 'center',
  },
  notesInput: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: colors.status.error,
  },
  completedOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
  },
  
  // List Styles
  listContainer: {
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  exerciseTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semibold,
  },
  setsContainer: {
    gap: spacing.xs,
  },
  setItem: {
    marginVertical: 0,
  },
  addSetButton: {
    marginTop: spacing.sm,
  },
});