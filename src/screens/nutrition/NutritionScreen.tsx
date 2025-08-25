import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Crown, Plus, Share2, Search, Clock, Star, Apple, Edit3, Trash2, Heart } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Card } from '../../components/common/Card';
import { Progress, CircularProgress, NutritionCircularProgress } from '../../components/common/Progress';
import { FoodList, FoodListItem } from '../../components/common/FoodListItem';
import { BottomSheet } from '../../components/common/BottomSheet';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { AddFoodModal } from '../../components/nutrition/AddFoodModal';

const { width: screenWidth } = Dimensions.get('window');

interface NutritionData {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  fat: { current: number; target: number };
  carbs: { current: number; target: number };
}

interface FoodLogItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  isFavorite?: boolean;
}

export const NutritionScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [editingFood, setEditingFood] = useState<FoodLogItem | null>(null);
  const [todaysFoodLog, setTodaysFoodLog] = useState<FoodLogItem[]>([]);

  // モックデータ
  const [nutritionData] = useState<NutritionData>({
    calories: { current: 3147, target: 2200 },
    protein: { current: 112, target: 140 },
    fat: { current: 76, target: 85 },
    carbs: { current: 180, target: 200 }
  });

  // 初期データを設定
  useState(() => {
    setTodaysFoodLog([
      {
        id: '1',
        name: '鶏胸肉（皮なし）',
        amount: 150,
        unit: 'g',
        calories: 165,
        protein: 33,
        fat: 2,
        carbs: 0,
        meal: 'lunch',
        time: '12:30',
      },
      {
        id: '2',
        name: '白米（炊飯済み）',
        amount: 200,
        unit: 'g',
        calories: 312,
        protein: 5,
        fat: 1,
        carbs: 74,
        meal: 'lunch',
        time: '12:30',
      },
      {
        id: '3',
        name: 'ブロッコリー',
        amount: 100,
        unit: 'g',
        calories: 33,
        protein: 4,
        fat: 0,
        carbs: 5,
        meal: 'lunch',
        time: '12:30',
      },
      {
        id: '4',
        name: 'ホエイプロテイン',
        amount: 30,
        unit: 'g',
        calories: 117,
        protein: 24,
        fat: 2,
        carbs: 2,
        meal: 'snack',
        time: '15:00',
      },
      {
        id: '5',
        name: 'バナナ',
        amount: 120,
        unit: 'g',
        calories: 103,
        protein: 1,
        fat: 0,
        carbs: 27,
        meal: 'snack',
        time: '10:00',
      }
    ]);
  });

  const [quickAddFoods] = useState([
    { id: '1', name: 'ホエイプロテイン', calories: 117, protein: 24, icon: '🥤' },
    { id: '2', name: '鶏胸肉', calories: 108, protein: 22, icon: '🐔' },
    { id: '3', name: '卵', calories: 151, protein: 12, icon: '🥚' },
    { id: '4', name: 'プロテインバー', calories: 240, protein: 20, icon: '🍫' },
  ]);

  const mealTabs = [
    { id: 'breakfast', label: '朝食', icon: '🌅' },
    { id: 'lunch', label: '昼食', icon: '🌞' },
    { id: 'dinner', label: '夕食', icon: '🌙' },
    { id: 'snack', label: '間食', icon: '🍎' }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getProgressColor = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return colors.status.success;
    if (percentage >= 70) return colors.primary.main;
    if (percentage >= 50) return colors.status.warning;
    return colors.status.error;
  };

  const getMealFoods = (meal: string) => {
    return todaysFoodLog.filter(item => item.meal === meal);
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

  // 食材追加ハンドラー
  const handleAddFood = (food: { id: string; name: string; calories: number; protein: number; fat: number; carbs: number; }) => {
    const newFoodItem: FoodLogItem = {
      ...food,
      id: Date.now().toString(),
      amount: 100,
      unit: 'g',
      meal: selectedMeal,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    };

    setTodaysFoodLog(prev => [...prev, newFoodItem]);
  };

  // 食材更新ハンドラー
  const handleUpdateFood = (updatedFood: FoodLogItem) => {
    setTodaysFoodLog(prev => prev.map(food =>
      food.id === updatedFood.id ? updatedFood : food
    ));
    setEditingFood(null);
  };

  // 食材編集ハンドラー
  const handleEditFood = (food: FoodLogItem) => {
    setEditingFood(food);
    setShowAddFood(true);
  };

  // 食材削除ハンドラー
  const handleDeleteFood = (foodId: string) => {
    setTodaysFoodLog(prev => prev.filter(food => food.id !== foodId));
  };

  // お気に入りトグルハンドラー
  const handleToggleFavorite = (foodId: string) => {
    setTodaysFoodLog(prev => prev.map(food =>
      food.id === foodId ? { ...food, isFavorite: !food.isFavorite } : food
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
           <Apple size={24} color={colors.primary.main} />
           <Text style={styles.headerTitle}>食事</Text>
           </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButton}>
            <Crown size={16} color={colors.primary.main} />
            <Text style={styles.proButtonText}>PRO</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 栄養進捗カード */}
        <Card style={styles.nutritionCard}>
          <View style={styles.nutritionCardGradient}>
            <Text style={styles.nutritionTitle}>今日の栄養摂取</Text>
            <View style={styles.caloriesMainSection}>
              <NutritionCircularProgress
                current={nutritionData.calories.current}
                target={nutritionData.calories.target}
                nutrientType="calories"
                size={120}
                strokeWidth={8}
                color={colors.text.inverse}
              />
              <View style={styles.caloriesInfo}>
                <Progress
                  value={nutritionData.calories.current}
                  max={nutritionData.calories.target}
                  color={colors.text.inverse}
                  backgroundColor={colors.text.inverse + '30'}
                  height={8}
                  style={styles.caloriesProgress}
                />
                <Text style={styles.remainingText}>
                  残り {nutritionData.calories.target - nutritionData.calories.current} kcal
                </Text>
              </View>
            </View>
          </View>

        {/* マクロ栄養素 */}
        <View style={styles.macroSection}>
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <NutritionCircularProgress
                current={nutritionData.protein.current}
                target={nutritionData.protein.target}
                nutrientType="protein"
                size={80}
                strokeWidth={6}
              />
              <Text style={styles.macroLabel}>タンパク質</Text>
            </View>

            <View style={styles.macroItem}>
              <NutritionCircularProgress
                current={nutritionData.fat.current}
                target={nutritionData.fat.target}
                nutrientType="fat"
                size={80}
                strokeWidth={6}
              />
              <Text style={styles.macroLabel}>脂質</Text>
            </View>

            <View style={styles.macroItem}>
              <NutritionCircularProgress
                current={nutritionData.carbs.current}
                target={nutritionData.carbs.target}
                nutrientType="carbs"
                size={80}
                strokeWidth={6}
              />
              <Text style={styles.macroLabel}>炭水化物</Text>
            </View>
          </View>
        </View>
        </Card>

        {/* 食事ログ */}
        <View style={styles.mealLogSection}>
          <View style={styles.mealLogHeader}>
            <Text style={styles.mealLogTitle}>今日の食事記録</Text>
            <TouchableOpacity style={styles.shareButton}>
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
                    onPress={() => {
                      setSelectedMeal(meal.id as any);
                      setShowAddFood(true);
                    }}
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
                            onPress={() => handleToggleFavorite(food.id)}
                          >
                            <Heart
                              size={16}
                              color={food.isFavorite ? colors.status.error : colors.text.secondary}
                              fill={food.isFavorite ? colors.status.error : 'transparent'}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.foodActionButton}
                            onPress={() => handleEditFood(food)}
                          >
                            <Edit3 size={16} color={colors.text.secondary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.foodActionButton}
                            onPress={() => handleDeleteFood(food.id)}
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
      </ScrollView>

      {/* フローティングアクションボタン */}
      {/* <FloatingActionButton
        onPress={() => setShowAddFood(true)}
        icon={<Plus size={24} color={colors.text.inverse} />}
        style={styles.fab}
      /> */}

      {/* 食品追加モーダル */}
      <AddFoodModal
        isVisible={showAddFood}
        onClose={() => {
          setShowAddFood(false);
          setEditingFood(null);
        }}
        onAddFood={handleAddFood}
        selectedMeal={selectedMeal}
        editingFood={editingFood}
        onUpdateFood={handleUpdateFood}
        favoriteFoods={todaysFoodLog.filter(food => food.isFavorite)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
     flexDirection: 'row',
     alignItems: 'center',
    gap: spacing.sm,
   },
  headerDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  proButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  nutritionCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  nutritionCardGradient: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.md,
  },
  caloriesMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.lg,
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  caloriesText: {
    fontSize: typography.fontSize['3xl'],
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  caloriesUnit: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse + '80',
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  caloriesProgress: {
    marginBottom: spacing.sm,
  },
  remainingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse + '80',
    fontFamily: typography.fontFamily.regular,
  },
  macroSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  macroLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  macroTarget: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  mealLogSection: {
    marginBottom: spacing.xl,
  },
  mealLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mealLogTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: spacing.xs,
  },
  mealCard: {
    marginBottom: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIcon: {
    fontSize: typography.fontSize.lg,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  mealTotals: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  mealEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  mealContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  addMealButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: radius.full,
  },
  foodItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    marginVertical: spacing.xxs,
    marginHorizontal: spacing.sm,
    borderRadius: radius.md,
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
  foodIcon: {
    fontSize: typography.fontSize.base,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  foodDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  foodTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  foodActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  foodActionButton: {
    padding: spacing.xs,
  },
  noFoodsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
  },
  addFoodContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  quickAddSection: {
    marginBottom: spacing.lg,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickAddItem: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    minWidth: (screenWidth - spacing.md * 4) / 2,
  },
  quickAddIcon: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.xs,
  },
  quickAddName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
    marginBottom: spacing.xxxs,
  },
  quickAddInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  recentList: {
    gap: spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  recentIcon: {
    fontSize: typography.fontSize.base,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  recentDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  favoritesSection: {
    marginBottom: spacing.lg,
  },
  favoritesList: {
    gap: spacing.sm,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  favoriteIcon: {
    fontSize: typography.fontSize.base,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  favoriteDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  addFoodActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});