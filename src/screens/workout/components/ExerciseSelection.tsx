import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { ExerciseTemplate } from '../types/workout.types';
import { exerciseTemplates, categories } from '../data/mockData';
import { AddExerciseModal } from './AddExerciseModal';
import DatabaseService from '../../../services/database/DatabaseService';

interface ExerciseSelectionProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onExerciseSelect: (exercise: ExerciseTemplate) => void;
  onBack: () => void;
}

export const ExerciseSelection: React.FC<ExerciseSelectionProps> = ({
  selectedCategory,
  onCategoryChange,
  onExerciseSelect,
  onBack
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customExercises, setCustomExercises] = useState<ExerciseTemplate[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [hiddenExercises, setHiddenExercises] = useState<string[]>([]);
  const [editedExercises, setEditedExercises] = useState<{[key: string]: ExerciseTemplate}>({});
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // 起動時にSQLiteからカスタム種目を読み込み
  useEffect(() => {
    loadCustomExercises();
  }, []);

  const loadCustomExercises = async () => {
    try {
      await DatabaseService.initialize();

      // カスタム種目を読み込み（IDが1000以上をカスタムとする）
      const customExercisesData = await DatabaseService.getAllAsync<any>(
        'SELECT * FROM exercise_master WHERE exercise_id >= 1000 ORDER BY name_ja',
        []
      );


      const loadedCustomExercises: ExerciseTemplate[] = customExercisesData.map(ex => ({
        id: ex.exercise_id.toString(),
        name: ex.name_ja,
        category: ex.muscle_group
      }));

      // カスタムカテゴリを抽出（既存カテゴリと重複しないもののみ）
      const allCustomCategories = [...new Set(loadedCustomExercises.map(ex => ex.category))];
      const loadedCustomCategories = allCustomCategories.filter(cat => !categories.includes(cat));


      setCustomExercises(loadedCustomExercises);
      setCustomCategories(loadedCustomCategories);
    } catch (error) {
      console.error('カスタム種目読み込みエラー:', error);
    }
  };

  const getAllCategories = () => {
    // 重複を防ぐために、既存カテゴリに含まれていないカスタムカテゴリのみ追加
    const uniqueCustomCategories = customCategories.filter(cat => !categories.includes(cat));
    return [...categories, ...uniqueCustomCategories];
  };

  const getExercisesByCategory = (category: string) => {
    // デフォルト種目を取得し、編集されたものは編集版を使用
    const templateExercises = exerciseTemplates
      .filter((ex) => ex.category === category && !hiddenExercises.includes(ex.id))
      .map((ex) => editedExercises[ex.id] || ex); // 編集されたものがあればそれを使用

    const customExercisesForCategory = customExercises.filter((ex) => ex.category === category);
    return [...templateExercises, ...customExercisesForCategory];
  };

  const handleAddExercise = async (category: string, exerciseName: string) => {
    try {

      await DatabaseService.initialize();

      // 新しいIDを生成（1000以上をカスタム種目とする）
      const maxIdResult = await DatabaseService.getFirstAsync<any>(
        'SELECT MAX(exercise_id) as max_id FROM exercise_master'
      );
      const newId = Math.max((maxIdResult?.max_id || 0) + 1, 1000);

      // exercise_masterテーブルに保存
      await DatabaseService.runAsync(
        'INSERT INTO exercise_master (exercise_id, name_ja, muscle_group, equipment, is_compound) VALUES (?, ?, ?, ?, ?)',
        [newId, exerciseName, category, 'custom', 0]
      );


      // カスタムカテゴリを追加（既存カテゴリに含まれず、まだカスタムカテゴリにも含まれていない場合のみ）
      if (!categories.includes(category) && !customCategories.includes(category)) {
        setCustomCategories(prev => [...prev, category]);
      }

      // 新しい種目を状態に追加
      const newExercise: ExerciseTemplate = {
        id: newId.toString(),
        name: exerciseName,
        category: category,
      };

      setCustomExercises(prev => [...prev, newExercise]);

      // 新しく作成されたカテゴリに切り替え
      if (!categories.includes(category)) {
        onCategoryChange(category);
      }

      Alert.alert('成功', `${exerciseName}を${category}に追加しました`);
    } catch (error) {
      Alert.alert('エラー', '種目の保存に失敗しました');
    }
  };

  const handleEditExercise = (exercise: ExerciseTemplate) => {
    setEditingExerciseId(exercise.id);
    setEditingExerciseName(exercise.name);
    setShowDropdown(null);
  };

  const handleSaveEdit = async () => {
    if (!editingExerciseName.trim()) {
      Alert.alert('エラー', '種目名を入力してください');
      return;
    }

    try {
      const exerciseId = parseInt(editingExerciseId || '');
      
      if (exerciseId >= 1000) {
        // カスタム種目の編集（SQLiteを更新）
        console.log('✏️ カスタム種目編集:', { exerciseId, newName: editingExerciseName.trim() });
        
        await DatabaseService.runAsync(
          'UPDATE exercise_master SET name_ja = ? WHERE exercise_id = ?',
          [editingExerciseName.trim(), exerciseId]
        );
        
        // ローカル状態も更新
        setCustomExercises(prev =>
          prev.map(ex =>
            ex.id === editingExerciseId
              ? { ...ex, name: editingExerciseName.trim() }
              : ex
          )
        );
        
        console.log('✅ カスタム種目編集完了');
      } else {
        // デフォルト種目の編集 - editedExercisesに保存（SQLiteは更新しない）
        const originalExercise = exerciseTemplates.find(ex => ex.id === editingExerciseId);
        if (originalExercise && editingExerciseId) {
          const editedExercise: ExerciseTemplate = {
            id: editingExerciseId,
            name: editingExerciseName.trim(),
            category: originalExercise.category,
          };
          setEditedExercises(prev => ({
            ...prev,
            [editingExerciseId]: editedExercise
          }));
        }
      }

      setEditingExerciseId(null);
      setEditingExerciseName('');
      Alert.alert('成功', '種目名を更新しました');
    } catch (error) {
      console.error('❌ 種目編集エラー:', error);
      Alert.alert('エラー', '種目の更新に失敗しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingExerciseId(null);
    setEditingExerciseName('');
  };

  const handleDeleteExercise = (exerciseId: string) => {
    // カスタム種目から検索
    let exercise = customExercises.find(ex => ex.id === exerciseId);
    // 編集されたデフォルト種目から検索
    if (!exercise) {
      exercise = editedExercises[exerciseId];
    }
    // デフォルト種目からも検索
    if (!exercise) {
      exercise = exerciseTemplates.find(ex => ex.id === exerciseId);
    }

    if (!exercise) return;

    Alert.alert(
      '確認',
      `${exercise.name}を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const numericId = parseInt(exerciseId);
              
              if (numericId >= 1000) {
                // カスタム種目の削除（SQLiteからも削除）
                console.log('🗑️ カスタム種目削除:', { exerciseId, name: exercise.name });
                
                // 関連するワークアウトセットも削除
                await DatabaseService.runAsync(
                  'DELETE FROM workout_set WHERE exercise_id = ?',
                  [numericId]
                );
                
                // exercise_masterからも削除
                await DatabaseService.runAsync(
                  'DELETE FROM exercise_master WHERE exercise_id = ?',
                  [numericId]
                );
                
                // ローカル状態からも削除
                setCustomExercises(prev => prev.filter(ex => ex.id !== exerciseId));
                
                console.log('✅ カスタム種目削除完了');
                Alert.alert('成功', `${exercise.name}を削除しました`);
              } else {
                // デフォルト種目の場合、非表示リストに追加
                setHiddenExercises(prev => [...prev, exerciseId]);
              }
              setShowDropdown(null);
            } catch (error) {
              console.error('❌ 種目削除エラー:', error);
              Alert.alert('エラー', '種目の削除に失敗しました');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.primary.main} />
        </TouchableOpacity>
        <Text style={styles.title}>種目を選択</Text>
        <TouchableOpacity 
          onPress={() => setIsAddModalOpen(true)}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >

      {/* Category Selection */}
      <View style={styles.categorySection}>
        <Text style={styles.categorySectionTitle}>部位を選択</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
          {getAllCategories().map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => onCategoryChange(category)}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive
              ]}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.categoryTabTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Exercise List */}
      <View style={styles.exerciseListSection}>
        <Text style={styles.exerciseListTitle}>種目を選択</Text>
        <ScrollView
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.exerciseListContent}
          onScrollBeginDrag={() => setShowDropdown(null)}
        >
          {getExercisesByCategory(selectedCategory).map((exercise, index) => (
            <View
              key={exercise.id}
              style={[
                styles.exerciseItem,
                index !== getExercisesByCategory(selectedCategory).length - 1 && styles.exerciseItemBorder
              ]}
            >
              {editingExerciseId === exercise.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingExerciseName}
                    onChangeText={setEditingExerciseName}
                    autoFocus
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      onPress={handleSaveEdit}
                      style={[styles.editButton, styles.saveButton]}
                    >
                      <Text style={styles.saveButtonText}>保存</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={[styles.editButton, styles.cancelButton]}
                    >
                      <Text style={styles.cancelButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => onExerciseSelect(exercise)}
                    style={styles.exerciseItemButton}
                  >
                    <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                  </TouchableOpacity>

                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.exerciseMoreButton}
                      onPress={() => setShowDropdown(showDropdown === exercise.id ? null : exercise.id)}
                    >
                      <MoreVertical size={20} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    {showDropdown === exercise.id && (
                      <View style={[
                        styles.dropdown,
                        // 最後から2番目以降のアイテムは上向きにメニューを表示
                        index >= getExercisesByCategory(selectedCategory).length - 2 && styles.dropdownUp
                      ]}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => handleEditExercise(exercise)}
                        >
                          <Edit size={16} color={colors.text.secondary} />
                          <Text style={styles.dropdownText}>編集</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.dropdownItem, styles.deleteItem]}
                          onPress={() => handleDeleteExercise(exercise.id)}
                        >
                          <Trash2 size={16} color={colors.status.error} />
                          <Text style={styles.deleteText}>削除</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isVisible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddExercise={handleAddExercise}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    flex: 1,
    textAlign: 'center',
  },
  categorySection: {
    backgroundColor: 'white',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categorySectionTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
  },
  categoryTabs: {
    flexDirection: 'row',
  },
  categoryTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.background.secondary,
  },
  categoryTabActive: {
    backgroundColor: colors.primary.main,
  },
  categoryTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  categoryTabTextActive: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  exerciseListSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  exerciseListTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    backgroundColor: 'white',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    paddingBottom: spacing.xl * 2, // ドロップダウンメニュー用に十分なスペースを確保
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  exerciseItemButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  exerciseItemName: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  exerciseMoreButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  editInput: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary.main,
    paddingVertical: spacing.xs,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
  },
  cancelButton: {
    backgroundColor: colors.text.secondary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    minWidth: 120,
    ...shadows.md,
    zIndex: 1000,
  },
  dropdownUp: {
    top: undefined,
    bottom: '100%',
    marginBottom: spacing.xs,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  deleteItem: {},
  dropdownText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  deleteText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.error,
  },
});