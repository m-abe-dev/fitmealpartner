import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { OnboardingStorageService } from '../services/OnboardingStorageService';
import { OnboardingData } from '../types/onboarding.types';
import { AIFeedbackService } from '../services/AIFeedbackService';
import DatabaseService from '../services/database/DatabaseService';
import UserRepository from '../services/database/repositories/UserRepository';

interface UserProfile {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  targetWeight: number;
  targetDate?: string;
  goal: 'cut' | 'bulk' | 'maintain';
  bmi: number;
  startWeight: number;
  joinDate: string;
}

interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface WeightAnalysis {
  daysToGoal: number;
  weightChange: number;
  weeklyPace: number;
  bmr: number;
  maintenanceCalories: number;
  warningLevel?: 'safe' | 'caution' | 'danger';
  warningMessage?: string;
  recommendedWeeks?: number;
  maxSafeWeeks?: number;
}

export const useProfileData = () => {
  const [refreshing, setRefreshing] = useState(false);
  const refreshCountRef = useRef(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // オンボーディングデータの読み込み
  const loadOnboardingData = async () => {
    try {
      const data = await OnboardingStorageService.getOnboardingData();
      setOnboardingData(data);
      return data;
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardingData();
  }, []);

  // 改善されたリフレッシュハンドラー
  const onRefresh = useCallback(async () => {
    try {
      refreshCountRef.current++;
      setRefreshing(true);
      
      // 並列処理で高速化
      const refreshPromises = [];
      
      // 1. オンボーディングデータの再読み込み
      refreshPromises.push(loadOnboardingData());
      
      // 2. データベースの統計情報を更新（体重履歴など）
      refreshPromises.push(updateWeightHistory());
      
      // 3. アチーブメントの更新
      refreshPromises.push(updateAchievements());
      
      // 4. 栄養目標の再計算（必要に応じて）
      if (onboardingData) {
        refreshPromises.push(recalculateNutritionTargets());
      }
      
      // すべての処理を並列実行
      const results = await Promise.allSettled(refreshPromises);
      
      // エラーチェック
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        console.warn('Some refresh operations failed:', errors);
      }
      
      
    } catch (error) {
      console.error('❌ Profile refresh failed:', error);
      Alert.alert(
        'エラー', 
        'プロフィールの更新に失敗しました。もう一度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshing(false);
    }
  }, [onboardingData]);

  // 体重履歴の更新
  const updateWeightHistory = async () => {
    try {
      // UserRepositoryを使用して最新の体重記録を取得
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const weightHistory = await UserRepository.getWeightHistory('user_1', startDate, endDate);
      
      return weightHistory;
    } catch (error) {
      console.error('Failed to update weight history:', error);
      throw error;
    }
  };

  // アチーブメントの更新
  const updateAchievements = async () => {
    try {
      // アチーブメントの条件をチェック
      const achievements = [];
      
      // 7日連続記録のチェック
      const streakDays = await checkConsecutiveDays();
      if (streakDays >= 7) {
        achievements.push('7days_streak');
      }
      
      // タンパク質目標達成のチェック
      const proteinDays = await checkProteinGoalDays();
      if (proteinDays >= 30) {
        achievements.push('protein_master');
      }
      
      return achievements;
    } catch (error) {
      console.error('Failed to update achievements:', error);
      throw error;
    }
  };

  // 連続記録日数のチェック
  const checkConsecutiveDays = async (): Promise<number> => {
    try {
      const result = await DatabaseService.getFirstAsync<{ streak_days: number }>(
        `SELECT COUNT(DISTINCT date) as streak_days 
         FROM food_log 
         WHERE user_id = ? 
         AND date >= date('now', '-7 days')`,
        ['user_1']
      );
      return result?.streak_days || 0;
    } catch (error) {
      console.error('Failed to check consecutive days:', error);
      return 0;
    }
  };

  // タンパク質目標達成日数のチェック
  const checkProteinGoalDays = async (): Promise<number> => {
    try {
      const result = await DatabaseService.getFirstAsync<{ protein_days: number }>(
        `SELECT COUNT(DISTINCT date) as protein_days 
         FROM food_log 
         WHERE user_id = ? 
         AND date >= date('now', '-30 days')
         GROUP BY date
         HAVING SUM(protein_g) >= ?`,
        ['user_1', nutritionTargets.protein * 0.9] // 90%以上で達成とする
      );
      return result?.protein_days || 0;
    } catch (error) {
      console.error('Failed to check protein goal days:', error);
      return 0;
    }
  };

  // 栄養目標の再計算
  const recalculateNutritionTargets = async () => {
    try {
      // AIサービスのキャッシュをクリアして最新の推奨値を取得
      await AIFeedbackService.clearCache();
    } catch (error) {
      console.error('Failed to recalculate nutrition targets:', error);
    }
  };

  // プロフィール更新処理
  const handleProfileSave = async (updatedProfile: any) => {
    if (!onboardingData) {
      Alert.alert('エラー', 'データの読み込みに失敗しました');
      return;
    }

    try {
      // 更新データの作成
      const updatedOnboardingData: OnboardingData = {
        ...onboardingData,
        profile: {
          ...onboardingData.profile,
          height: updatedProfile.height,
          weight: updatedProfile.weight,
          gender: updatedProfile.gender,
        },
        goal: {
          ...onboardingData.goal,
          goal: updatedProfile.goal || 'maintain',
          targetWeight:
            updatedProfile.goal === 'maintain'
              ? undefined
              : updatedProfile.targetWeight,
          targetDate:
            updatedProfile.goal === 'maintain'
              ? undefined
              : updatedProfile.targetDate,
        },
        workoutHabits: {
          ...onboardingData.workoutHabits,
          activityLevel: updatedProfile.activityLevel,
          experience: updatedProfile.experience || 'beginner',
        },
      };

      // AsyncStorageに保存
      await OnboardingStorageService.saveOnboardingData(updatedOnboardingData);

      // ローカル状態を更新
      setOnboardingData(updatedOnboardingData);

      Alert.alert('成功', 'プロフィールが更新されました');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました');
    }
  };

  // UserProfileの生成
  const userProfile: UserProfile = useMemo(() => {
    if (!onboardingData) {
      return {
        age: 25,
        height: 170,
        weight: 65,
        gender: 'male',
        activityLevel: 'moderate',
        experience: 'beginner',
        targetWeight: 65,
        targetDate: undefined,
        goal: 'maintain',
        bmi: 22.5,
        startWeight: 65,
        joinDate: new Date().toISOString().split('T')[0],
      };
    }

    const { profile, goal, workoutHabits } = onboardingData;

    // 年齢計算
    const today = new Date();
    const birthDate = new Date(profile.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // BMI計算
    const heightInMeters = profile.height / 100;
    const bmi = parseFloat(
      (profile.weight / (heightInMeters * heightInMeters)).toFixed(1)
    );

    return {
      age,
      height: profile.height,
      weight: profile.weight,
      gender: profile.gender,
      activityLevel: workoutHabits.activityLevel,
      experience: workoutHabits.experience,
      targetWeight: goal.targetWeight || profile.weight,
      targetDate: goal.targetDate,
      goal: goal.goal,
      bmi,
      startWeight: profile.weight,
      joinDate: onboardingData.completedAt
        ? new Date(onboardingData.completedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
  }, [onboardingData]);

  // 体重分析の計算
  const analysis: WeightAnalysis = useMemo(() => {
    const targetDate = userProfile.targetDate
      ? new Date(userProfile.targetDate)
      : null;
    const today = new Date();
    const daysToGoal = targetDate
      ? Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const weightChangeToTarget = userProfile.targetWeight - userProfile.weight;
    const weeksToTarget = daysToGoal > 0 ? daysToGoal / 7 : 0;
    const requiredWeeklyPace =
      weeksToTarget > 0 ? weightChangeToTarget / weeksToTarget : 0;

    // BMR計算（Harris-Benedict式）
    let bmr: number;
    if (userProfile.gender === 'male') {
      bmr =
        88.362 +
        13.397 * userProfile.weight +
        4.799 * userProfile.height -
        5.677 * userProfile.age;
    } else {
      bmr =
        447.593 +
        9.247 * userProfile.weight +
        3.098 * userProfile.height -
        4.33 * userProfile.age;
    }

    // 活動レベル係数
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very-active': 1.9,
    };

    const maintenanceCalories =
      bmr * activityMultipliers[userProfile.activityLevel];

    // 警告レベルの判定
    const weeklyPaceKg = Math.abs(requiredWeeklyPace);
    let warningLevel: 'safe' | 'caution' | 'danger' = 'safe';
    let warningMessage = '';
    let recommendedWeeks: number | undefined;

    if (weightChangeToTarget < 0) {
      recommendedWeeks = Math.abs(weightChangeToTarget) / 0.5;
      if (weeklyPaceKg > 0.75) {
        warningLevel = 'danger';
        warningMessage = `危険な減量ペース（週${weeklyPaceKg.toFixed(
          1
        )}kg）です。推奨期間は${recommendedWeeks.toFixed(0)}週間です。`;
      } else if (weeklyPaceKg > 0.5) {
        warningLevel = 'caution';
        warningMessage = `やや速い減量ペース（週${weeklyPaceKg.toFixed(
          1
        )}kg）です。注意して進めてください。`;
      }
    } else if (weightChangeToTarget > 0 && weeklyPaceKg > 0.5) {
      warningLevel = 'caution';
      warningMessage = `速い増量ペース（週${weeklyPaceKg.toFixed(1)}kg）です。`;
    }

    return {
      daysToGoal,
      weightChange: weightChangeToTarget,
      weeklyPace: requiredWeeklyPace,
      bmr: Math.round(bmr),
      maintenanceCalories: Math.round(maintenanceCalories),
      warningLevel,
      warningMessage,
      recommendedWeeks,
    };
  }, [userProfile]);

  // 栄養目標の計算
  const nutritionTargets: NutritionTargets = useMemo(() => {
    const { maintenanceCalories } = analysis;
    let targetCalories = maintenanceCalories;

    // 目標に応じたカロリー調整
    switch (userProfile.goal) {
      case 'cut':
        targetCalories = Math.round(maintenanceCalories * 0.8);
        break;
      case 'bulk':
        targetCalories = Math.round(maintenanceCalories * 1.15);
        break;
      case 'maintain':
      default:
        targetCalories = Math.round(maintenanceCalories);
    }

    // マクロ栄養素の計算
    const proteinPerKg =
      userProfile.goal === 'cut'
        ? 2.2
        : userProfile.goal === 'bulk'
        ? 1.8
        : 2.0;
    const protein = Math.round(userProfile.weight * proteinPerKg);
    const fatRatio = userProfile.goal === 'bulk' ? 0.25 : 0.27;
    const fat = Math.round((targetCalories * fatRatio) / 9);
    const carbCalories = targetCalories - protein * 4 - fat * 9;
    const carbs = Math.round(Math.max(100, carbCalories / 4));

    return {
      calories: targetCalories,
      protein,
      fat,
      carbs,
    };
  }, [analysis, userProfile]);

  return {
    userProfile,
    analysis,
    nutritionTargets,
    refreshing,
    notificationsEnabled,
    showProfileEditModal,
    isLoading,
    setNotificationsEnabled,
    setShowProfileEditModal,
    onRefresh,
    handleProfileSave,
  };
};

export type { UserProfile, NutritionTargets, WeightAnalysis };
