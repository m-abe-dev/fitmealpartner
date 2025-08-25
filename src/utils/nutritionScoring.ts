// 栄養スコア計算ユーティリティ

// --- 型定義 ---
export type Goal = 'cut' | 'bulk' | 'maintain';
export type Macro = 'protein' | 'fat' | 'carbs';

export interface NutritionData {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  fat: { current: number; target: number };
  carbs: { current: number; target: number };
}

export interface NutritionScores {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  macro: number;
  total: number;
}

// --- ユーティリティ関数 ---
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

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

// メイン関数
export const computeNutritionScores = (data: NutritionData, goal: Goal = 'maintain'): NutritionScores => {
  const calS = scoreCalories(data.calories.current, data.calories.target, goal);
  const pS   = scoreMacro('protein', data.protein.current, data.protein.target, goal);
  const fS   = scoreMacro('fat',     data.fat.current,     data.fat.target,     goal);
  const cS   = scoreMacro('carbs',   data.carbs.current,   data.carbs.target,   goal);

  const macroS = weighted([pS, cS, fS], [0.5, 0.3, 0.2]);
  const totalS = weighted([calS, macroS], [0.45, 0.55]);

  return { calories: calS, protein: pS, fat: fS, carbs: cS, macro: macroS, total: totalS };
};

// スコア色づけ関数
export const getScoreColor = (score: number) => {
  // colors は import できないので、戻り値で色名を返して呼び出し側で変換
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};