import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Heart, Edit3, Trash2, Share2 } from 'lucide-react-native';
import { Card } from '../../../components/common/Card';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { FoodLogItem, MealTab } from '../types/nutrition.types';

interface MealLogCardProps {
  foodLog: FoodLogItem[];
  mealTabs: MealTab[];
  onAddFood: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onEditFood: (food: FoodLogItem) => void;
  onDeleteFood: (foodId: string) => void;
  onToggleFavorite: (foodId: string) => void;
  onShare: () => void;
}

export const MealLogCard: React.FC<MealLogCardProps> = ({
  foodLog,
  mealTabs,
  onAddFood,
  onEditFood,
  onDeleteFood,
  onToggleFavorite,
  onShare,
}) => {
  const getMealFoods = (meal: string) => {
    return foodLog.filter(item => item.meal === meal);
  };

  const getMealTotals = (meal: string) => {
    const foods = getMealFoods(meal);
    return foods.reduce((totals, food) => ({
      calories: totals.calories + food.calories,
      protein: totals.protein + food.protein,
      fat: totals.fat + food.fat,
      carbs: totals.carbs + food.carbs
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  return (
    <View style={styles.mealLogSection}>
      <View style={styles.mealLogHeader}>
        <Text style={styles.mealLogTitle}>今日の食事記録</Text>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Share2 size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {mealTabs.map((meal) => {
        const mealTotals = getMealTotals(meal.id);
        const mealFoods = getMealFoods(meal.id);

        return (
          <Card key={meal.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealHeaderLeft}>
                <View style={styles.mealIconContainer}>
                  <Text style={styles.mealIcon}>{meal.icon}</Text>
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.label}</Text>
                  {mealTotals.calories > 0 ? (
                    <Text style={styles.mealTotals}>
                      {mealTotals.calories} kcal • P{mealTotals.protein}g F{mealTotals.fat}g C{mealTotals.carbs}g
                    </Text>
                  ) : (
                    <Text style={styles.mealEmpty}>記録なし</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.addMealButton}
                onPress={() => onAddFood(meal.id as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
              >
                <Plus size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>

            {mealFoods.length > 0 && (
              <View style={styles.mealContent}>
                {mealFoods.map((food) => (
                  <View key={food.id} style={styles.foodItem}>
                    <View style={styles.foodItemContent}>
                      <View style={styles.foodItemHeader}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodTime}>{food.time}</Text>
                      </View>
                      <Text style={styles.foodDetails}>
                        {food.amount}{food.unit} • {food.calories}kcal • P{food.protein}g
                      </Text>
                    </View>

                    <View style={styles.foodActions}>
                      <TouchableOpacity
                        style={styles.foodActionButton}
                        onPress={() => onToggleFavorite(food.id)}
                      >
                        <Heart
                          size={16}
                          color={food.isFavorite ? colors.status.error : colors.text.secondary}
                          fill={food.isFavorite ? colors.status.error : 'transparent'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.foodActionButton}
                        onPress={() => onEditFood(food)}
                      >
                        <Edit3 size={16} color={colors.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.foodActionButton}
                        onPress={() => onDeleteFood(food.id)}
                      >
                        <Trash2 size={16} color={colors.status.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  mealLogSection: {
    marginTop: spacing.lg,
  },
  mealLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  mealLogTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
  },
  mealCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    ...shadows.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  mealHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  mealIcon: {
    fontSize: 18,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.xxxs,
  },
  mealTotals: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  mealEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    fontFamily: typography.fontFamily.regular,
  },
  addMealButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxxs,
  },
  foodName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flex: 1,
  },
  foodTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    marginLeft: spacing.xs,
  },
  foodDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  foodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  foodActionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});