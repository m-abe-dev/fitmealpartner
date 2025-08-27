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

export interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
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

// デフォルトの目標値（動的な目標値が提供されない場合のフォールバック）
const DEFAULT_NUTRITION_TARGETS = {
  calories: 2200,
  protein: 140,
  fat: 85,
  carbs: 200,
};

export const useNutritionData = (
  foodLog: FoodLogItem[] = [], 
  targets?: NutritionTargets
): UseNutritionDataReturn => {
  const [goal, setGoal] = useState<Goal>('maintain');
  
  console.log('useNutritionData: フック呼び出し', {
    foodLogLength: foodLog.length,
    targets,
    timestamp: Date.now()
  });

  // 実際の食事データから現在の摂取量を計算
  const currentNutrition = useMemo(() => calculateTotalNutrition(foodLog), [foodLog]);

  // 使用する目標値を決定（動的な目標値が提供されていればそれを使用、なければデフォルト値）
  const nutritionTargets = targets || DEFAULT_NUTRITION_TARGETS;
  
  console.log('useNutritionData: 目標値更新', {
    provided: targets,
    using: nutritionTargets,
    isFromProfile: !!targets
  });

  // nutritionTargetsの変化を確実に検知するためのハッシュ
  const nutritionTargetsHash = useMemo(() => 
    JSON.stringify(nutritionTargets), 
    [nutritionTargets]
  );

  // 栄養データを構築
  const nutritionData = useMemo<NutritionData>(() => {
    console.log('useNutritionData: nutritionData再構築', {
      targets: nutritionTargets,
      hash: nutritionTargetsHash
    });
    
    return {
      calories: { current: currentNutrition.calories, target: nutritionTargets.calories },
      protein: { current: currentNutrition.protein, target: nutritionTargets.protein },
      fat: { current: currentNutrition.fat, target: nutritionTargets.fat },
      carbs: { current: currentNutrition.carbs, target: nutritionTargets.carbs },
    };
  }, [
    currentNutrition.calories, 
    currentNutrition.protein, 
    currentNutrition.fat, 
    currentNutrition.carbs,
    nutritionTargetsHash
  ]);

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
