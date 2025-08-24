import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { ExerciseTemplate } from '../types/workout.types';
import { exerciseTemplates, categories } from '../data/mockData';
import { AddExerciseModal } from './AddExerciseModal';

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
  const [hiddenExercises, setHiddenExercises] = useState<string[]>([]); // 非表示にするデフォルト種目のID
  const [editedExercises, setEditedExercises] = useState<{[key: string]: ExerciseTemplate}>({}); // 編集されたデフォルト種目
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const getAllCategories = () => {
    return [...categories, ...customCategories];
  };

  const getExercisesByCategory = (category: string) => {
    // デフォルト種目を取得し、編集されたものは編集版を使用
    const templateExercises = exerciseTemplates
      .filter((ex) => ex.category === category && !hiddenExercises.includes(ex.id))
      .map((ex) => editedExercises[ex.id] || ex); // 編集されたものがあればそれを使用
    
    const customExercisesForCategory = customExercises.filter((ex) => ex.category === category);
    return [...templateExercises, ...customExercisesForCategory];
  };

  const handleAddExercise = (category: string, exerciseName: string) => {
    // Add custom category if it doesn't exist
    if (!getAllCategories().includes(category)) {
      setCustomCategories(prev => [...prev, category]);
    }

    // Create new exercise
    const newExercise: ExerciseTemplate = {
      id: `custom-${Date.now()}`,
      name: exerciseName,
      category: category,
    };

    setCustomExercises(prev => [...prev, newExercise]);
    
    // Switch to the new category if it was just created
    if (!categories.includes(category)) {
      onCategoryChange(category);
    }

    Alert.alert('成功', `${exerciseName}を${category}に追加しました`);
  };

  const handleEditExercise = (exercise: ExerciseTemplate) => {
    setEditingExerciseId(exercise.id);
    setEditingExerciseName(exercise.name);
    setShowDropdown(null);
  };

  const handleSaveEdit = () => {
    if (!editingExerciseName.trim()) {
      Alert.alert('エラー', '種目名を入力してください');
      return;
    }

    if (editingExerciseId?.startsWith('custom-')) {
      // カスタム種目の編集
      setCustomExercises(prev =>
        prev.map(ex =>
          ex.id === editingExerciseId
            ? { ...ex, name: editingExerciseName.trim() }
            : ex
        )
      );
    } else {
      // デフォルト種目の編集 - editedExercisesに保存して元の位置に表示
      const originalExercise = exerciseTemplates.find(ex => ex.id === editingExerciseId);
      if (originalExercise && editingExerciseId) {
        const editedExercise: ExerciseTemplate = {
          id: editingExerciseId, // 元のIDを維持
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
          onPress: () => {
            if (exerciseId.startsWith('custom-')) {
              // カスタム種目の削除
              setCustomExercises(prev => prev.filter(ex => ex.id !== exerciseId));
            } else {
              // デフォルト種目の場合、非表示リストに追加
              setHiddenExercises(prev => [...prev, exerciseId]);
            }
            setShowDropdown(null);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={20} color={colors.primary.main} />
        </TouchableOpacity>
        <Text style={styles.title}>種目を選択</Text>
        <TouchableOpacity onPress={() => setIsAddModalOpen(true)}>
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