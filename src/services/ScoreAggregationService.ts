import DatabaseService from './database/DatabaseService';
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

class ScoreAggregationService {
  async getWeeklyScores(): Promise<{ nutrition: number, training: number }> {
    try {
      await DatabaseService.initialize();
      
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      
      const startDate = oneWeekAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // 過去7日間のワークアウトデータを取得
      const workoutData = await this.getWorkoutDataForPeriod(startDate, endDate);
      
      // 過去7日間の食事データを取得
      const nutritionData = await this.getNutritionDataForPeriod(startDate, endDate);
      
      return this.calculateAverageScores(nutritionData, workoutData, 7);
    } catch (error) {
      console.error('Error getting weekly scores:', error);
      return { nutrition: 0, training: 0 };
    }
  }
  
  async getMonthlyScores(): Promise<{ nutrition: number, training: number }> {
    try {
      await DatabaseService.initialize();
      
      const today = new Date();
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setDate(today.getDate() - 30);
      
      const startDate = oneMonthAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // 過去30日間のデータを取得
      const workoutData = await this.getWorkoutDataForPeriod(startDate, endDate);
      const nutritionData = await this.getNutritionDataForPeriod(startDate, endDate);
      
      return this.calculateAverageScores(nutritionData, workoutData, 30);
    } catch (error) {
      console.error('Error getting monthly scores:', error);
      return { nutrition: 0, training: 0 };
    }
  }

  private async getWorkoutDataForPeriod(startDate: string, endDate: string) {
    const sessions = await DatabaseService.getAllAsync<any>(
      `SELECT sess.date, sess.session_id
       FROM workout_session sess
       WHERE sess.date >= ? AND sess.date <= ?
       ORDER BY sess.date`,
      [startDate, endDate]
    );

    const dailyWorkouts: { [date: string]: Exercise[] } = {};

    for (const session of sessions) {
      const workoutSets = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, em.name_ja as exercise_name, em.muscle_group
         FROM workout_set ws
         LEFT JOIN exercise_master em ON ws.exercise_id = em.exercise_id
         WHERE ws.session_id = ?
         ORDER BY ws.exercise_id, ws.set_number`,
        [session.session_id]
      );

      // データをExercise[]形式に変換
      const exerciseMap = new Map<string, Exercise>();
      
      workoutSets.forEach(row => {
        const exerciseId = row.exercise_id?.toString() || 'unknown';
        const exerciseName = row.exercise_name || `Exercise ${exerciseId}`;

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            id: exerciseId,
            name: exerciseName,
            category: row.muscle_group,
            sets: [],
            isExpanded: true,
            type: row.muscle_group === '有酸素' ? 'cardio' : 'strength',
          });
        }

        const exercise = exerciseMap.get(exerciseId)!;
        exercise.sets.push({
          id: row.set_id?.toString() || `${Date.now()}-${exercise.sets.length}`,
          weight: row.weight_kg || 0,
          reps: row.reps || 0,
          time: row.time_minutes || undefined,
          distance: row.distance_km || undefined,
          rm:
            row.weight_kg && row.reps
              ? Math.round(row.weight_kg * (1 + row.reps / 30) * 100) / 100
              : undefined,
        });
      });

      dailyWorkouts[session.date] = Array.from(exerciseMap.values());
    }

    return dailyWorkouts;
  }

  private async getNutritionDataForPeriod(startDate: string, endDate: string) {
    const foodLogs = await DatabaseService.getAllAsync<any>(
      `SELECT * FROM food_log 
       WHERE date >= ? AND date <= ?
       ORDER BY date`,
      [startDate, endDate]
    );
    
    const dailyNutrition: { [date: string]: any[] } = {};
    
    foodLogs.forEach(log => {
      if (!dailyNutrition[log.date]) {
        dailyNutrition[log.date] = [];
      }
      dailyNutrition[log.date].push(log);
    });
    
    return dailyNutrition;
  }

  private calculateAverageScores(nutritionData: any, workoutData: { [date: string]: Exercise[] }, periodDays: number) {
    const workoutDates = Object.keys(workoutData);
    const actualDataDays = workoutDates.length;
    
    // トレーニングスコアの計算
    let totalTrainingScore = 0;
    let activeDays = 0;
    
    workoutDates.forEach(date => {
      const exercises = workoutData[date];
      if (exercises.length > 0) {
        const dayScore = calculateWorkoutScore(exercises);
        totalTrainingScore += dayScore;
        activeDays++;
      }
    });
    
    // 実際にトレーニングした日の平均スコア
    let avgDailyTrainingScore = 0;
    if (activeDays > 0) {
      avgDailyTrainingScore = totalTrainingScore / activeDays;
    }
    
    // 期間に応じた頻度調整
    let frequencyMultiplier = 1.0;
    
    if (periodDays === 7) { // 週間
      const weeklyFrequency = (activeDays / Math.min(actualDataDays, 7)) * 7;
      if (weeklyFrequency >= 3 && weeklyFrequency <= 5) {
        frequencyMultiplier = 1.0;
      } else if (weeklyFrequency < 3) {
        frequencyMultiplier = 0.8;
      } else {
        frequencyMultiplier = 0.9;
      }
    } else if (periodDays === 30) { // 月間
      const monthlyFrequency = (activeDays / Math.min(actualDataDays, 30)) * 30;
      if (monthlyFrequency >= 12 && monthlyFrequency <= 20) {
        frequencyMultiplier = 1.0;
      } else if (monthlyFrequency < 12) {
        frequencyMultiplier = 0.85;
      } else {
        frequencyMultiplier = 0.95;
      }
    }
    
    const adjustedTrainingScore = avgDailyTrainingScore * frequencyMultiplier;
    
    // 栄養スコア：記録がある日のみで計算
    const nutritionDaysWithData = Object.keys(nutritionData).length;
    let totalNutritionScore = 0;
    let nutritionValidDays = 0;
    
    Object.keys(nutritionData).forEach(date => {
      const dayData = nutritionData[date];
      if (dayData && dayData.length > 0) {
        const dayScore = this.calculateDailyNutritionScore(dayData);
        totalNutritionScore += dayScore;
        nutritionValidDays++;
      }
    });
    
    const avgNutritionScore = nutritionValidDays > 0 
      ? totalNutritionScore / nutritionValidDays 
      : 50;
    
    return {
      nutrition: Math.round(avgNutritionScore * 10) / 10,
      training: Math.round(adjustedTrainingScore * 10) / 10
    };
  }


  private calculateNutritionScore(nutritionData: any, days: number): number {
    if (!nutritionData || Object.keys(nutritionData).length === 0) {
      return 50.0;
    }
    
    let totalScore = 0;
    let validDays = 0;
    
    Object.keys(nutritionData).forEach(date => {
      const dayData = nutritionData[date];
      if (dayData && dayData.length > 0) {
        const dayScore = this.calculateDailyNutritionScore(dayData);
        totalScore += dayScore;
        validDays++;
      }
    });
    
    return validDays > 0 ? totalScore / days : 50.0;
  }

  private calculateDailyNutritionScore(foodLogs: any[]): number {
    const totalProtein = foodLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    const totalCalories = foodLogs.reduce((sum, log) => sum + (log.kcal || 0), 0);
    
    const targetProtein = 100;
    const targetCalories = 2000;
    
    const proteinScore = Math.min(100, (totalProtein / targetProtein) * 100);
    const calorieScore = Math.min(100, Math.abs(1 - Math.abs(totalCalories - targetCalories) / targetCalories) * 100);
    
    return (proteinScore + calorieScore) / 2;
  }
}

export default new ScoreAggregationService();