import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, History, Plus, X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { ExerciseTemplate, WorkoutSet, SetInputs } from '../types/workout.types';
import DatabaseService from '../../../services/database/DatabaseService';

interface ExerciseDetailViewProps {
  exercise: ExerciseTemplate | null;
  onBack: () => void;
  onRecordWorkout: (exerciseName: string, sets: WorkoutSet[]) => Promise<void>;
}

interface LastRecord {
  set: number;
  weight: number;
  reps: number;
  date: string;
}

interface HistoryRecord {
  date: string;
  sets: {
    set: number;
    weight: number;
    reps: number;
    rm?: number;
  }[];
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
  ]);

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lastRecord, setLastRecord] = useState<LastRecord[]>([]);
  const [lastRecordDate, setLastRecordDate] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  // 前回記録を取得
  const loadLastRecord = async () => {
    if (!exercise?.id) return;

    try {
      await DatabaseService.initialize();

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // 前回のワークアウト記録を取得（今日以外の最新）
      const lastRecordData = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, session.date
         FROM workout_set ws
         LEFT JOIN workout_session session ON ws.session_id = session.session_id
         WHERE ws.exercise_id = ? AND session.date != ?
         ORDER BY session.date DESC, ws.set_number ASC
         LIMIT 10`,
        [parseInt(exercise.id), todayString]
      );

      if (lastRecordData.length > 0) {
        const records: LastRecord[] = lastRecordData.map((row, index) => ({
          set: index + 1,
          weight: row.weight_kg || 0,
          reps: row.reps || 0,
          date: row.date || '',
        }));

        setLastRecord(records);
        setLastRecordDate(lastRecordData[0].date);
      } else {
        setLastRecord([]);
        setLastRecordDate(null);
      }
    } catch (error) {
      setLastRecord([]);
      setLastRecordDate(null);
    }
  };

  // 履歴記録を取得
  const loadExerciseHistory = async () => {
    if (!exercise?.id) return;

    try {
      await DatabaseService.initialize();

      // 過去のワークアウト記録を取得（日付ごとにグループ化）
      const historyData = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, session.date
         FROM workout_set ws
         LEFT JOIN workout_session session ON ws.session_id = session.session_id
         WHERE ws.exercise_id = ?
         ORDER BY session.date DESC, ws.set_number ASC
         LIMIT 100`,
        [parseInt(exercise.id)]
      );

      // 日付ごとにグループ化
      const groupedByDate: { [date: string]: any[] } = {};
      historyData.forEach(record => {
        if (!groupedByDate[record.date]) {
          groupedByDate[record.date] = [];
        }
        groupedByDate[record.date].push(record);
      });

      // HistoryRecord形式に変換
      const history: HistoryRecord[] = Object.keys(groupedByDate).map(date => ({
        date,
        sets: groupedByDate[date].map((record, index) => ({
          set: index + 1,
          weight: record.weight_kg || 0,
          reps: record.reps || 0,
          rm: record.weight_kg && record.reps
            ? Math.round(record.weight_kg * (1 + record.reps / 30) * 100) / 100
            : 0
        }))
      }));

      setHistoryRecords(history);
    } catch (error) {
      setHistoryRecords([]);
    }
  };

  useEffect(() => {
    loadLastRecord();
  }, [exercise?.id]);

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
    if (lastRecord.length === 0) {
      Alert.alert('エラー', '前回の記録がありません');
      return;
    }

    const newSets = currentSets.map((set, index) => {
      const recordData = lastRecord[index];
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
    Alert.alert('成功', `${lastRecord.length}セットの履歴をコピーしました`);
  };

  const handleRecord = async () => {
    let validSets;

    if (isCardio) {
      validSets = currentSets.filter(set =>
        set.time && set.distance &&
        !isNaN(Number(set.time)) && !isNaN(Number(set.distance))
      );

      if (validSets.length === 0) {
        Alert.alert('エラー', '少なくとも1セットの時間と距離を入力してください');
        return;
      }
    } else {
      validSets = currentSets.filter(set =>
        set.weight && set.reps &&
        !isNaN(Number(set.weight)) && !isNaN(Number(set.reps))
      );

      if (validSets.length === 0) {
        Alert.alert('エラー', '少なくとも1セットの重量と回数を入力してください');
        return;
      }
    }

    const exerciseSets: WorkoutSet[] = validSets.map((set, index) => {
      if (isCardio) {
        return {
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          weight: 0, // Cardioの場合は重量は0
          reps: 0, // Cardioの場合は回数は0
          time: Number(set.time),
          distance: Number(set.distance),
        };
      } else {
        return {
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          weight: Number(set.weight),
          reps: Number(set.reps),
          rm: Number(set.weight) > 0 && Number(set.reps) > 0
            ? Math.round(Number(set.weight) * (1 + Number(set.reps) / 30) * 100) / 100
            : 0
        };
      }
    });

    try {
      await onRecordWorkout(exercise?.name || "Unknown Exercise", exerciseSets);
      Alert.alert('成功', `${exercise?.name}を記録しました`);
      onBack();
    } catch (error) {
      Alert.alert('エラー', 'ワークアウトの記録に失敗しました');
    }
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
            <Text style={styles.lastRecordTitle}>
              {lastRecordDate ? `Last Record : ${lastRecordDate}` : 'Last Record'}
            </Text>
            {lastRecord.length > 0 && (
              <View style={styles.lastRecordActions}>
                <TouchableOpacity
                  onPress={() => {
                    loadExerciseHistory();
                    setIsHistoryModalOpen(true);
                  }}
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
            )}
          </View>

          {lastRecord.length === 0 ? (
            <View style={styles.emptyRecordState}>
              <Text style={styles.emptyRecordText}>
                ここに前回の記録が表示されます。
              </Text>
            </View>
          ) : (
            lastRecord.map((record) => (
              <View key={record.set} style={styles.lastRecordRow}>
                <Text style={styles.setNumber}>{record.set}</Text>
                <Text style={styles.recordText}>{record.weight} kg × {record.reps} reps</Text>
              </View>
            ))
          )}
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

      {/* History Modal */}
      <Modal
        visible={isHistoryModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{exercise?.name} - 履歴</Text>
            <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* History Content */}
          <View style={styles.modalContent}>
            {historyRecords.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistoryText}>
                  履歴がありません
                </Text>
              </View>
            ) : (
              <FlatList
                data={historyRecords}
                keyExtractor={(item) => item.date}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.historyCard}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    {item.sets.map((set, index) => (
                      <View key={index} style={styles.historySetRow}>
                        <Text style={styles.historySetNumber}>{set.set}</Text>
                        <Text style={styles.historySetData}>
                          {set.weight} kg × {set.reps} reps
                        </Text>
                        {set.rm && set.rm > 0 && (
                          <Text style={styles.historyRm}>
                            (1RM: {set.rm} kg)
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.historySeparator} />}
                contentContainerStyle={styles.historyList}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  emptyRecordState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  emptyRecordText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    color: 'white',
    fontFamily: typography.fontFamily.bold,
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
  },
  emptyHistoryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyHistoryText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  historyList: {
    padding: spacing.md,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  historyDate: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.sm,
  },
  historySetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  historySetNumber: {
    width: 24,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  historySetData: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    flex: 1,
  },
  historyRm: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  historySeparator: {
    height: spacing.sm,
  },
});