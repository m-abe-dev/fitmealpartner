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

// --- 栄養スコア関数 ---
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type Goal = 'cut' | 'bulk' | 'maintain';

// 目標に「どれだけ近いか」を 0–100 点化する汎用スコア
const closenessScore = (
  current: number,
  target: number,
  opts?: { dead?: number; zeroAt?: number; pow?: number; under?: number; over?: number }
) => {
  const dead   = opts?.dead   ?? 0.05; // ±5%
  const zeroAt = opts?.zeroAt ?? 0.60; // 60%ズレで0点
  const pow    = opts?.pow    ?? 1.1;
  const underW = opts?.under  ?? 1.0;
  const overW  = opts?.over   ?? 1.0;

  const dev = Math.abs(current - target) / Math.max(1, target);
  const norm = clamp01((dev - dead) / Math.max(1e-9, zeroAt - dead));
  const weight = current < target ? underW : overW;
  const penalty = clamp01(Math.pow(norm, pow) * weight);
  return Math.round(100 * (1 - penalty));
};

// カロリースコア（目的別の過不足重み）
const scoreCalories = (current: number, target: number, goal: Goal) => {
  const table = {
    maintain: { under: 1.0, over: 1.0 },
    cut:      { under: 0.8, over: 1.25 },
    bulk:     { under: 1.25, over: 0.9  },
  }[goal];
  return closenessScore(current, target, { ...table, dead: 0.05, zeroAt: 0.60, pow: 1.1 });
};

// 各マクロのスコア
type Macro = 'protein' | 'fat' | 'carbs';
const scoreMacro = (macro: Macro, current: number, target: number, goal: Goal) => {
  const weightsByGoal: Record<Goal, Record<Macro, { under: number; over: number }>> = {
    maintain: {
      protein: { under: 1.4,  over: 0.8 },
      fat:     { under: 1.0,  over: 1.1 },
      carbs:   { under: 0.9,  over: 1.0 },
    },
    cut: {
      protein: { under: 1.6,  over: 0.7 },
      fat:     { under: 1.0,  over: 1.25 },
      carbs:   { under: 0.9,  over: 1.2  },
    },
    bulk: {
      protein: { under: 1.7,  over: 0.8 },
      fat:     { under: 1.1,  over: 1.0 },
      carbs:   { under: 1.2,  over: 0.9  },
    },
  };

  const w = weightsByGoal[goal][macro];
  return closenessScore(current, target, { ...w, dead: 0.05, zeroAt: 0.60, pow: 1.05 });
};

// マクロ合成 & 総合スコア
const weighted = (vals: number[], ws: number[]) =>
  Math.round(vals.reduce((a, v, i) => a + v * ws[i], 0));

const computeNutritionScores = (data: {
  calories: { current: number; target: number };
  protein:  { current: number; target: number };
  fat:      { current: number; target: number };
  carbs:    { current: number; target: number };
}, goal: Goal = 'maintain') => {
  const calS = scoreCalories(data.calories.current, data.calories.target, goal);
  const pS   = scoreMacro('protein', data.protein.current, data.protein.target, goal);
  const fS   = scoreMacro('fat',     data.fat.current,     data.fat.target,     goal);
  const cS   = scoreMacro('carbs',   data.carbs.current,   data.carbs.target,   goal);

  const macroS = weighted([pS, cS, fS], [0.5, 0.3, 0.2]);
  const totalS = weighted([calS, macroS], [0.45, 0.55]);

  return { calories: calS, protein: pS, fat: fS, carbs: cS, macro: macroS, total: totalS };
};

// スコア色づけ関数
const getScoreColor = (score: number) => {
  if (score >= 80) return { bg: colors.status.success + '20', text: colors.status.success };
  if (score >= 60) return { bg: colors.status.warning + '20', text: colors.status.warning };
  return { bg: colors.status.error + '20', text: colors.status.error };
};

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
    calories: { current: 1647, target: 2200 },
    protein: { current: 112, target: 140 },
    fat: { current: 76, target: 85 },
    carbs: { current: 180, target: 200 }
  });

  // スコア計算
  const GOAL: Goal = 'maintain'; // TODO: ユーザー設定から取得
  const scores = React.useMemo(
    () => computeNutritionScores(nutritionData, GOAL),
    [nutritionData, GOAL]
  );

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
           <Text style={styles.headerTitle}>今日の食事</Text>
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
            <View style={styles.nutritionHeader}>
              <Text style={styles.nutritionTitle}>今日の栄養</Text>
              <View style={[styles.totalScoreBadge, { backgroundColor: getScoreColor(scores.total).bg }]}>
                <Text style={[styles.totalScoreText, { color: getScoreColor(scores.total).text }]}>
                  スコア {scores.total}
                </Text>
              </View>
            </View>
            <View style={styles.caloriesMainSection}>
              <View style={styles.caloriesCircleContainer}>
                <NutritionCircularProgress
                  current={nutritionData.calories.current}
                  target={nutritionData.calories.target}
                  nutrientType="calories"
                  size={120}
                  strokeWidth={8}
                  color={colors.text.inverse}
                />
                <View style={styles.caloriesScoreBadge}>
                  <Text style={styles.caloriesScoreText}>スコア {scores.calories}</Text>
                </View>
              </View>
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
              <View style={[styles.macroScoreBadge, { backgroundColor: getScoreColor(scores.protein).bg }]}>
                <Text style={[styles.macroScoreText, { color: getScoreColor(scores.protein).text }]}>
                  {scores.protein}
                </Text>
              </View>
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
              <View style={[styles.macroScoreBadge, { backgroundColor: getScoreColor(scores.fat).bg }]}>
                <Text style={[styles.macroScoreText, { color: getScoreColor(scores.fat).text }]}>
                  {scores.fat}
                </Text>
              </View>
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
              <View style={[styles.macroScoreBadge, { backgroundColor: getScoreColor(scores.carbs).bg }]}>
                <Text style={[styles.macroScoreText, { color: getScoreColor(scores.carbs).text }]}>
                  {scores.carbs}
                </Text>
              </View>
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
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    fontWeight: 'bold',
  },
  totalScoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.text.inverse + '30',
  },
  totalScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  caloriesMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.lg,
  },
  caloriesCircleContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  caloriesScoreBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.text.inverse + 'E6',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    shadowColor: colors.gray[600],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  caloriesScoreText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
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
  macroScoreBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.xxxs,
  },
  macroScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
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
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  mealIconContainer: {
    width: 36,
    height: 36,
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
    lineHeight: typography.fontSize.sm * 1.3,
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
    padding: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: radius.full,
  },
  foodItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.secondary,
    marginVertical: spacing.xxxs,
    marginHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
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
    marginTop: 2,
    lineHeight: typography.fontSize.sm * 1.2,
  },
  foodTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  foodActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xxs,
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