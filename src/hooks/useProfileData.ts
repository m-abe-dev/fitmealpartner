import { useState, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { OnboardingStorageService } from '../services/OnboardingStorageService';
import { OnboardingData } from '../types/onboarding.types';

interface UserProfile {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
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
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOnboardingData();
    setRefreshing(false);
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
