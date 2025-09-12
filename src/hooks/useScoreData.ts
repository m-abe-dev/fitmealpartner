import { useState, useEffect, useMemo } from 'react';
import { useNutritionData, NutritionTargets } from './useNutritionData';
import { useProfileData } from './useProfileData';
import { Exercise } from '../screens/workout/types/workout.types';
import ScoreAggregationService from '../services/ScoreAggregationService';

// WorkoutスコアをTodayResultsと同じロジックで計算するヘルパー
const calculateWorkoutScore = (exercises: Exercise[]): number => {
  console.log('📊 useScoreData - Calculating score for exercises:', {
    count: exercises.length,
    exercises: exercises.map(e => ({
      id: e.id,
      name: e.name,
      sets: e.sets.length,
      type: e.type,
      setDetails: e.sets.map(s => ({
        weight: s.weight,
        reps: s.reps,
        rm: (s as any).rm,
        time: s.time,
        distance: s.distance
      }))
    }))
  });

  const hasStrength = exercises.some(ex => ex.type !== 'cardio');
  const hasCardio = exercises.some(ex => ex.type === 'cardio');

  if (!hasStrength && !hasCardio) {
    console.log('📊 useScoreData - No exercises found, returning 0');
    return 0;
  }

  // ヘルパー関数
  const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
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

    console.log('📊 useScoreData - Strength calculation:', {
      strengthExercises: strength.length,
      totalSets,
      exercises: strength.map(e => ({ name: e.name, sets: e.sets.length }))
    });

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

    const totalScore = Math.round(setsScore + volumeScore + varietyScore);
    console.log('📊 useScoreData - Strength scores:', {
      setsScore: Math.round(setsScore),
      volumeScore: Math.round(volumeScore),
      varietyScore: Math.round(varietyScore),
      totalScore,
      avgRm,
      eqVolume,
      targetVolume
    });

    return totalScore;
  };

  const cardioScoreFromExercises = () => {
    const cardio = exercises.filter(ex => ex.type === 'cardio');
    if (cardio.length === 0) return 0;

    console.log('📊 useScoreData - Cardio calculation:', {
      cardioExercises: cardio.length,
      exercises: cardio.map(e => ({ name: e.name, sets: e.sets.length }))
    });

    type Agg = { time: number; weighted: number };
    const agg = cardio.reduce<Agg>((acc, ex) => {
      ex.sets.forEach(s => {
        const minutes = s.time ?? 0;          // 分
        const km = s.distance ?? 0;           // km
        if (minutes <= 0) return;
        // 強度係数: pace基準（安全な範囲でクリップ）
        const pace = km > 0 ? minutes / km : null; // min/km
        // 6:00/km => 1.0, 4:00/km => 1.5, 12:00/km => 0.5
        const intensity = pace ? clamp(6 / pace, 0.5, 2) : 1.0;
        acc.time += minutes;
        acc.weighted += minutes * intensity;
      });
      return acc;
    }, { time: 0, weighted: 0 });

    if (agg.time <= 0) return 0;

    const avgIntensity = agg.weighted / agg.time;
    const eqLoad = agg.time * avgIntensity; // 「強度付き時間」

    const DAILY_TARGET_MIN = 30; // デイリー目安
    const s1 = 70 * clamp(eqLoad / DAILY_TARGET_MIN, 0, 1);
    const s2 = 30 * clamp(avgIntensity / 1.2, 0, 1); // 1.2相当で満点寄せ

    const totalScore = Math.round(s1 + s2);

    console.log('📊 useScoreData - Cardio scores:', {
      totalTime: agg.time,
      avgIntensity: Math.round(avgIntensity * 100) / 100,
      eqLoad: Math.round(eqLoad * 100) / 100,
      s1: Math.round(s1),
      s2: Math.round(s2),
      totalScore
    });

    return totalScore;
  };

  let finalScore: number;

  if (!hasStrength) {
    finalScore = cardioScoreFromExercises();
  } else if (!hasCardio) {
    finalScore = strengthScoreFromExercises();
  } else {
    const sStrength = strengthScoreFromExercises();
    const sCardio = cardioScoreFromExercises();
    const best = Math.max(sStrength, sCardio);
    const weaker = Math.min(sStrength, sCardio);
    const bonus = 0.25 * Math.max(0, weaker - 50);
    finalScore = Math.min(100, Math.round(best + bonus));

    console.log('📊 useScoreData - Combined score calculation:', {
      sStrength,
      sCardio,
      best,
      weaker,
      bonus: Math.round(bonus * 100) / 100,
      finalScore
    });
  }

  console.log('📊 useScoreData - Final score:', finalScore);
  return finalScore;
};;

// スコア重み付け計算関数
const calculateScoreWeights = (activityLevel: string): { nutrition: number, training: number } => {
  switch (activityLevel) {
    case 'sedentary':
      return { nutrition: 0.65, training: 0.35 };
    case 'light':
      return { nutrition: 0.60, training: 0.40 };
    case 'moderate':
      return { nutrition: 0.55, training: 0.45 };
    case 'active':
      return { nutrition: 0.50, training: 0.50 };
    case 'very-active':
      return { nutrition: 0.45, training: 0.55 };
    default:
      return { nutrition: 0.55, training: 0.45 };
  }
};

// 目標による重み調整
const adjustWeightsByGoal = (
  weights: { nutrition: number, training: number },
  goal: 'cut' | 'bulk' | 'maintain'
): { nutrition: number, training: number } => {
  if (goal === 'cut') {
    return {
      nutrition: Math.min(0.70, weights.nutrition + 0.05),
      training: Math.max(0.30, weights.training - 0.05)
    };
  } else if (goal === 'bulk') {
    return weights;
  }
  return weights;
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
  const { userProfile } = useProfileData();

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

  // 週間・月間スコアの状態
  const [weeklyScores, setWeeklyScores] = useState({ nutrition: 0, training: 0 });
  const [monthlyScores, setMonthlyScores] = useState({ nutrition: 0, training: 0 });

  // exercisesの変化を詳細に検知するハッシュ
  const exercisesHash = useMemo(
    () => exercises.map(e => 
      `${e.id}-${e.sets.length}-${e.sets.map(s => 
        `${s.weight}-${s.reps}-${s.time || 0}-${s.distance || 0}`
      ).join(',')}`
    ).join(','),
    [exercises]
  );

  // 過去データの読み込み（初回のみ）
  useEffect(() => {
    const loadHistoricalScores = async () => {
      try {
        const weekly = await ScoreAggregationService.getWeeklyScores();
        const monthly = await ScoreAggregationService.getMonthlyScores();
        setWeeklyScores(weekly);
        setMonthlyScores(monthly);
      } catch (error) {
        console.error('Failed to load historical scores:', error);
      }
    };
    
    loadHistoricalScores();
  }, []); // 初回のみ実行

  // 今日のワークアウトが更新されたときに週間・月間スコアも再計算
  useEffect(() => {
    const reloadHistoricalScores = async () => {
      try {
        const weekly = await ScoreAggregationService.getWeeklyScores();
        const monthly = await ScoreAggregationService.getMonthlyScores();
        setWeeklyScores(weekly);
        setMonthlyScores(monthly);
      } catch (error) {
        console.error('Failed to reload historical scores:', error);
      }
    };
    
    // exercisesが変更されたときに履歴スコアも再計算
    if (exercises.length > 0) {
      reloadHistoricalScores();
    }
  }, [exercisesHash]); // exercisesが変更されたときに実行

  // nutrition scoresの変化を検知するためのハッシュ
  const nutritionScoresHash = useMemo(
    () => JSON.stringify(nutritionScores),
    [nutritionScores]
  );

  // 今日のスコア更新（リアルタイム）
  useEffect(() => {
    // 今日のスコア（リアルタイム計算）
    const todayTrainingScore = calculateWorkoutScore(exercises);
    const todayNutritionScore = nutritionScores.total;
    
    // 動的重み付け計算
    const baseWeights = calculateScoreWeights(userProfile.activityLevel);
    const finalWeights = adjustWeightsByGoal(baseWeights, userProfile.goal);
    
    const todayTotalScore = Math.round(
      todayNutritionScore * finalWeights.nutrition + 
      todayTrainingScore * finalWeights.training
    );

    // 週間・月間スコア（履歴データから計算）- 動的重み付け＋小数点第一位まで保持
    const weeklyTotalScore = Math.round((
      weeklyScores.nutrition * finalWeights.nutrition + 
      weeklyScores.training * finalWeights.training
    ) * 10) / 10;
    const monthlyTotalScore = Math.round((
      monthlyScores.nutrition * finalWeights.nutrition + 
      monthlyScores.training * finalWeights.training
    ) * 10) / 10;

    const newScoreData: ScoreData[] = [
      {
        period: '今日',
        total_score: todayTotalScore,
        nutrition_score: todayNutritionScore,
        training_score: todayTrainingScore,
        details: {
          nutrition: '栄養スコア',
          training: '筋トレスコア',
        },
      },
      {
        period: '今週',
        total_score: weeklyTotalScore,
        nutrition_score: weeklyScores.nutrition,
        training_score: weeklyScores.training,
        details: {
          nutrition: '週平均栄養スコア',
          training: '週平均筋トレスコア',
        },
      },
      {
        period: '今月',
        total_score: monthlyTotalScore,
        nutrition_score: monthlyScores.nutrition,
        training_score: monthlyScores.training,
        details: {
          nutrition: '月平均栄養スコア',
          training: '月平均筋トレスコア',
        },
      },
    ];

    setScoreData(newScoreData);
  }, [nutritionScoresHash, exercisesHash, weeklyScores, monthlyScores, userProfile.activityLevel, userProfile.goal]);

  return { scoreData };
};
