import { useState, useMemo } from 'react';
import {
  NutritionData,
  NutritionScores,
  computeNutritionScores,
  Goal,
} from '../utils/nutritionScoring';
import { FoodLogItem } from '../screens/nutrition/types/nutrition.types';

export interface UseNutritionDataReturn {
  nutritionData: NutritionData;
  scores: NutritionScores;
  goal: Goal;
  setGoal: (goal: Goal) => void;
  updateNutritionData: (data: Partial<NutritionData>) => void;
}

// 食事ログからPFCとカロリーの合計を計算する関数
const calculateTotalNutrition = (foodLog: FoodLogItem[]) => {
  return foodLog.reduce(
    (totals, food) => ({
      calories: totals.calories + (food.calories || 0),
      protein: totals.protein + (food.protein || 0),
      fat: totals.fat + (food.fat || 0),
      carbs: totals.carbs + (food.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
};

// 目標値（将来的にはユーザー設定から取得）
const NUTRITION_TARGETS = {
  calories: 2200,
  protein: 140,
  fat: 85,
  carbs: 200,
};

export const useNutritionData = (foodLog: FoodLogItem[] = []): UseNutritionDataReturn => {
  const [goal, setGoal] = useState<Goal>('maintain');

  // 実際の食事データから現在の摂取量を計算
  const currentNutrition = useMemo(() => calculateTotalNutrition(foodLog), [foodLog]);

  // 栄養データを構築
  const nutritionData = useMemo<NutritionData>(() => ({
    calories: { current: currentNutrition.calories, target: NUTRITION_TARGETS.calories },
    protein: { current: currentNutrition.protein, target: NUTRITION_TARGETS.protein },
    fat: { current: currentNutrition.fat, target: NUTRITION_TARGETS.fat },
    carbs: { current: currentNutrition.carbs, target: NUTRITION_TARGETS.carbs },
  }), [currentNutrition.calories, currentNutrition.protein, currentNutrition.fat, currentNutrition.carbs]);

  const scores = useMemo(
    () => computeNutritionScores(nutritionData, goal),
    [nutritionData, goal]
  );

  const updateNutritionData = (data: Partial<NutritionData>) => {
    // この関数は現在は使用されないが、互換性のために保持
    // 将来的には目標値の更新などに使用できる
  };

  return {
    nutritionData,
    scores,
    goal,
    setGoal,
    updateNutritionData,
  };
};
