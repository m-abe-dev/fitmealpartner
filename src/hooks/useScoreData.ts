import { useState, useEffect, useMemo } from 'react';
import { useNutritionData, NutritionTargets } from './useNutritionData';
import { Exercise } from '../screens/workout/types/workout.types';

// WorkoutスコアをTodayResultsと同じロジックで計算するヘルパー
const calculateWorkoutScore = (exercises: Exercise[]): number => {
  const hasStrength = exercises.some(ex => ex.type !== 'cardio');
  const hasCardio = exercises.some(ex => ex.type === 'cardio');

  if (!hasStrength && !hasCardio) return 0;

  // ヘルパー関数
  const softSaturate = (x: number, k: number) =>
    1 - Math.exp(-x / Math.max(k, 1));

  const estimateSetWeightKg = (reps: number, rm?: number, avgRm?: number) => {
    const baseRm = rm && rm > 0 ? rm : avgRm && avgRm > 0 ? avgRm : 1;
    const r = Math.max(1, reps || 1);
    return baseRm / (1 + r / 30);
  };

  const computeAvgRm = () => {
    const strength = exercises.filter(ex => ex.type !== 'cardio');
    const values: number[] = [];
    strength.forEach(ex => {
      ex.sets.forEach(s => {
        const rm = (s as any).rm as number | undefined;
        if (typeof rm === 'number' && rm > 0) values.push(rm);
      });
    });
    if (!values.length) return undefined;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const strengthScoreFromExercises = () => {
    const strength = exercises.filter(ex => ex.type !== 'cardio');
    const totalSets = strength.reduce((t, ex) => t + ex.sets.length, 0);
    if (totalSets === 0) return 0;

    // Sets Score (40点満点)
    const setsScore = 40 * softSaturate(totalSets, 12);

    // Volume Score (50点満点)
    const avgRm = computeAvgRm();
    let eqVolume = 0;
    strength.forEach(ex => {
      ex.sets.forEach(s => {
        const reps = s.reps ?? 0;
        if (reps <= 0) return;
        const rm = (s as any).rm as number | undefined;
        const estW = estimateSetWeightKg(reps, rm, avgRm);
        eqVolume += estW * reps;
      });
    });

    const HARD_TARGET = 10;
    const targetVolume =
      avgRm && avgRm > 0 ? HARD_TARGET * 8 * 0.7 * avgRm : 80;
    const volumeScore =
      50 * softSaturate(eqVolume / Math.max(targetVolume, 1), 1.2);

    // Variety Score (10点満点)
    const nExercises = strength.length;
    let varietyScore = 0;
    if (nExercises <= 0) {
      varietyScore = 0;
    } else if (nExercises < 4) {
      varietyScore = 10 * (nExercises / 4);
    } else if (nExercises <= 6) {
      varietyScore = 10;
    } else if (nExercises <= 10) {
      varietyScore = Math.max(8, 10 - (nExercises - 6) * 0.5);
    } else {
      varietyScore = 8;
    }

    return Math.round(setsScore + volumeScore + varietyScore);
  };

  const cardioScoreFromExercises = () => {
    const cardio = exercises.filter(ex => ex.type === 'cardio');
    const totalTime = cardio.reduce(
      (t, ex) => t + ex.sets.reduce((st, s) => st + (s.time || 0), 0),
      0
    );
    if (totalTime === 0) return 0;

    const timeScore = 70 * softSaturate(totalTime, 30);
    const varietyScore = 30 * Math.min(1, cardio.length / 3);
    return Math.round(timeScore + varietyScore);
  };

  if (!hasStrength) return cardioScoreFromExercises();
  if (!hasCardio) return strengthScoreFromExercises();

  const sStrength = strengthScoreFromExercises();
  const sCardio = cardioScoreFromExercises();
  const best = Math.max(sStrength, sCardio);
  const weaker = Math.min(sStrength, sCardio);
  const bonus = 0.25 * Math.max(0, weaker - 50);

  return Math.min(100, Math.round(best + bonus));
};

export interface ScoreData {
  period: string;
  total_score: number;
  nutrition_score: number;
  training_score: number;
  details: {
    nutrition: string;
    training: string;
  };
}

export const useScoreData = (
  exercises: Exercise[] = [],
  foodLog: any[] = [],
  nutritionTargets?: NutritionTargets
) => {
  const { scores: nutritionScores } = useNutritionData(
    foodLog,
    nutritionTargets
  );

  // 初期データで初期化
  const [scoreData, setScoreData] = useState<ScoreData[]>([
    {
      period: '今日',
      total_score: 0,
      nutrition_score: 0,
      training_score: 0,
      details: {
        nutrition: '栄養スコア',
        training: '筋トレスコア',
      },
    },
    {
      period: '今週',
      total_score: 0,
      nutrition_score: 0,
      training_score: 0,
      details: {
        nutrition: '週平均栄養スコア',
        training: '週平均筋トレスコア',
      },
    },
    {
      period: '今月',
      total_score: 0,
      nutrition_score: 0,
      training_score: 0,
      details: {
        nutrition: '月平均栄養スコア',
        training: '月平均筋トレスコア',
      },
    },
  ]);

  // exercisesの長さをメモ化して、実際に変更された場合のみ再計算
  const exercisesLength = exercises.length;
  const exercisesHash = useMemo(
    () => exercises.map(e => 
      `${e.id}-${e.sets.length}-${e.sets.map(s => 
        `${s.weight}-${s.reps}-${s.time || 0}-${s.distance || 0}`
      ).join(',')}`
    ).join(','),
    [exercises]
  );

  // nutrition scoresの変化を検知するためのハッシュ
  const nutritionScoresHash = useMemo(
    () => JSON.stringify(nutritionScores),
    [nutritionScores]
  );

  useEffect(() => {
    const trainingScore = calculateWorkoutScore(exercises);
    const nutritionScore = nutritionScores.total;

    // 総合スコアを計算（栄養50%、筋トレ50%）
    const totalScore = Math.round((nutritionScore + trainingScore) / 2);

    const newScoreData: ScoreData[] = [
      {
        period: '今日',
        total_score: totalScore,
        nutrition_score: nutritionScore,
        training_score: trainingScore,
        details: {
          nutrition: '栄養スコア',
          training: '筋トレスコア',
        },
      },
      {
        period: '今週',
        total_score: Math.max(60, totalScore - 5), // 仮データ
        nutrition_score: Math.max(50, nutritionScore - 8),
        training_score: Math.max(50, trainingScore - 7),
        details: {
          nutrition: '週平均栄養スコア',
          training: '週平均筋トレスコア',
        },
      },
      {
        period: '今月',
        total_score: Math.max(55, totalScore - 10), // 仮データ
        nutrition_score: Math.max(45, nutritionScore - 12),
        training_score: Math.max(45, trainingScore - 15),
        details: {
          nutrition: '月平均栄養スコア',
          training: '月平均筋トレスコア',
        },
      },
    ];

    setScoreData(newScoreData);
  }, [nutritionScoresHash, exercisesLength, exercisesHash]);

  return { scoreData };
};
