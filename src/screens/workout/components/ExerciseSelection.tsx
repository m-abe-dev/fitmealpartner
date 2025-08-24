import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, MoreVertical } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { ExerciseTemplate } from '../types/workout.types';
import { exerciseTemplates, categories } from '../data/mockData';

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
  const getExercisesByCategory = (category: string) => {
    return exerciseTemplates.filter((ex) => ex.category === category);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={20} color={colors.primary.main} />
        </TouchableOpacity>
        <Text style={styles.title}>種目を選択</Text>
        <TouchableOpacity>
          <Plus size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Category Selection */}
      <View style={styles.categorySection}>
        <Text style={styles.categorySectionTitle}>部位を選択</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
          {categories.map((category) => (
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
        <View style={styles.exerciseList}>
          {getExercisesByCategory(selectedCategory).map((exercise, index) => (
            <View
              key={exercise.id}
              style={[
                styles.exerciseItem,
                index !== getExercisesByCategory(selectedCategory).length - 1 && styles.exerciseItemBorder
              ]}
            >
              <TouchableOpacity
                onPress={() => onExerciseSelect(exercise)}
                style={styles.exerciseItemButton}
              >
                <Text style={styles.exerciseItemName}>{exercise.name}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exerciseMoreButton}>
                <MoreVertical size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          ))}
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
    backgroundColor: 'white',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
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
});