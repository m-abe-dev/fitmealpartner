import { useState, useMemo } from 'react';
import {
  NutritionData,
  NutritionScores,
  computeNutritionScores,
  Goal,
} from '../utils/nutritionScoring';

export interface UseNutritionDataReturn {
  nutritionData: NutritionData;
  scores: NutritionScores;
  goal: Goal;
  setGoal: (goal: Goal) => void;
  updateNutritionData: (data: Partial<NutritionData>) => void;
}

export const useNutritionData = (): UseNutritionDataReturn => {
  // TODO: これらの値は将来的にはユーザー設定やAPIから取得する
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    calories: { current: 212, target: 2200 },
    protein: { current: 112, target: 140 },
    fat: { current: 86, target: 85 },
    carbs: { current: 180, target: 200 },
  });

  const [goal, setGoal] = useState<Goal>('maintain');

  const scores = useMemo(
    () => computeNutritionScores(nutritionData, goal),
    [nutritionData, goal]
  );

  const updateNutritionData = (data: Partial<NutritionData>) => {
    setNutritionData(prev => ({ ...prev, ...data }));
  };

  return {
    nutritionData,
    scores,
    goal,
    setGoal,
    updateNutritionData,
  };
};
