import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, History, Plus } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { ExerciseTemplate, WorkoutSet, SetInputs } from '../types/workout.types';
import { mockLastRecord } from '../data/mockData';

interface ExerciseDetailViewProps {
  exercise: ExerciseTemplate | null;
  onBack: () => void;
  onRecordWorkout: (exerciseName: string, sets: WorkoutSet[]) => void;
}

export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({
  exercise,
  onBack,
  onRecordWorkout
}) => {
  const isCardio = exercise?.category === '有酸素';

  const [currentSets, setCurrentSets] = useState<SetInputs[]>([
    { id: 1, weight: "", reps: "", time: "", distance: "" },
    { id: 2, weight: "", reps: "", time: "", distance: "" },
    { id: 3, weight: "", reps: "", time: "", distance: "" },
    { id: 4, weight: "", reps: "", time: "", distance: "" },
  ]);

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const updateSet = (setId: number, field: keyof SetInputs, value: string) => {
    if (field === 'id') return;
    setCurrentSets((prev) =>
      prev.map((set) =>
        set.id === setId ? { ...set, [field]: value } : set,
      ),
    );
  };

  const toggleWeightUnit = () => {
    setWeightUnit(prev => prev === 'kg' ? 'lbs' : 'kg');
  };

  const copyAllFromLastRecord = () => {
    const newSets = currentSets.map((set, index) => {
      const recordData = mockLastRecord[index];
      if (recordData) {
        const displayWeight = weightUnit === 'kg'
          ? recordData.weight
          : Math.round(recordData.weight * 2.20462 * 10) / 10;

        return {
          ...set,
          weight: displayWeight.toString(),
          reps: recordData.reps.toString(),
        };
      }
      return set;
    });

    setCurrentSets(newSets);
    Alert.alert('成功', `${mockLastRecord.length}セットの履歴をコピーしました`);
  };

  const handleRecord = () => {
    const validSets = currentSets.filter(set =>
      set.weight && set.reps &&
      !isNaN(Number(set.weight)) && !isNaN(Number(set.reps))
    );

    if (validSets.length === 0) {
      Alert.alert('エラー', '少なくとも1セットの重量と回数を入力してください');
      return;
    }

    const exerciseSets: WorkoutSet[] = validSets.map((set, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      weight: Number(set.weight),
      reps: Number(set.reps),
      rm: Number(set.weight) > 0 && Number(set.reps) > 0
        ? Math.round(Number(set.weight) * (1 + Number(set.reps) / 30) * 100) / 100
        : 0
    }));

    onRecordWorkout(exercise?.name || "Unknown Exercise", exerciseSets);
    Alert.alert('成功', `${exercise?.name}を記録しました`);
    onBack();
  };

  const addSet = () => {
    const newSetId = currentSets.length + 1;
    setCurrentSets((prev) => [
      ...prev,
      { id: newSetId, weight: "", reps: "", time: "", distance: "" },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{exercise?.name}</Text>
        <TouchableOpacity style={styles.unitToggle} onPress={toggleWeightUnit}>
          <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitActive]}>kg</Text>
          <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitActive]}>lbs</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Last Record */}
        <View style={styles.lastRecordCard}>
          <View style={styles.lastRecordHeader}>
            <Text style={styles.lastRecordTitle}>Last Record : 2025/07/24</Text>
            <View style={styles.lastRecordActions}>
              <TouchableOpacity
                onPress={() => setIsHistoryModalOpen(true)}
                style={styles.actionButton}
              >
                <History size={12} color={colors.primary.main} />
                <Text style={styles.actionText}>履歴</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={copyAllFromLastRecord}
                style={[styles.actionButton, styles.actionButtonActive]}
              >
                <Copy size={12} color={colors.primary.main} />
                <Text style={styles.actionText}>全てコピー</Text>
              </TouchableOpacity>
            </View>
          </View>

          {mockLastRecord.map((record) => (
            <View key={record.set} style={styles.lastRecordRow}>
              <Text style={styles.setNumber}>{record.set}</Text>
              <Text style={styles.recordText}>{record.weight} kg × {record.reps} reps</Text>
            </View>
          ))}
        </View>

        {/* Current Sets */}
        <ScrollView style={styles.setsScrollView} showsVerticalScrollIndicator={false}>
          {currentSets.map((set) => (
            <View key={set.id} style={styles.setInputCard}>
              <View style={styles.setInputRow}>
                <View style={styles.setNumberContainer}>
                  <Text style={styles.setNumberLarge}>{set.id}</Text>
                </View>

                {!isCardio ? (
                  <>
                    <View style={styles.inputGroup}>
                      <TextInput
                        style={styles.weightInput}
                        value={set.weight}
                        onChangeText={(text) => updateSet(set.id, "weight", text)}
                        keyboardType="numeric"
                        placeholder="重さ"
                        placeholderTextColor={colors.text.tertiary}
                      />
                      <Text style={styles.unitLabel}>{weightUnit}</Text>
                    </View>

                    <Text style={styles.multiplySymbol}>×</Text>

                    <View style={styles.inputGroup}>
                      <TextInput
                        style={styles.repsInput}
                        value={set.reps}
                        onChangeText={(text) => updateSet(set.id, "reps", text)}
                        keyboardType="numeric"
                        placeholder="回数"
                        placeholderTextColor={colors.text.tertiary}
                      />
                      <Text style={styles.unitLabel}>回</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <TextInput
                        style={styles.timeInput}
                        value={set.time}
                        onChangeText={(text) => updateSet(set.id, "time", text)}
                        keyboardType="numeric"
                        placeholder="時間"
                        placeholderTextColor={colors.text.tertiary}
                      />
                      <Text style={styles.unitLabel}>分</Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <TextInput
                        style={styles.distanceInput}
                        value={set.distance}
                        onChangeText={(text) => updateSet(set.id, "distance", text)}
                        keyboardType="numeric"
                        placeholder="距離"
                        placeholderTextColor={colors.text.tertiary}
                      />
                      <Text style={styles.unitLabel}>km</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))}

          {/* Add Set Button */}
          <View style={styles.addSetContainer}>
            <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Fixed Record Button */}
        <View style={styles.fixedBottom}>
          <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
            <Text style={styles.recordButtonText}>記録する</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    color: 'white',
    fontFamily: typography.fontFamily.bold,
    flex: 1,
    textAlign: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: radius.full,
  },
  unitText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unitActive: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
  },
  lastRecordCard: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  lastRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastRecordTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  lastRecordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  actionButtonActive: {
    backgroundColor: colors.primary[50],
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
  },
  lastRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxs,
    paddingHorizontal: spacing.sm,
  },
  setNumber: {
    width: 24,
    height: 24,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  recordText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  setsScrollView: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  setInputCard: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  setInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setNumberContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberLarge: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  inputGroup: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  weightInput: {
    width: 56,
    padding: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[300],
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontSize: typography.fontSize.sm,
  },
  repsInput: {
    width: 56,
    padding: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[300],
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontSize: typography.fontSize.sm,
  },
  timeInput: {
    width: 56,
    padding: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[300],
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontSize: typography.fontSize.sm,
  },
  distanceInput: {
    width: 56,
    padding: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[300],
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontSize: typography.fontSize.sm,
  },
  unitLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  multiplySymbol: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  addSetContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addSetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedBottom: {
    paddingHorizontal: spacing.md,
  },
  recordButton: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: typography.fontSize.base,
    color: 'white',
    fontFamily: typography.fontFamily.medium,
  },
});