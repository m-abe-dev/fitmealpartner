import { useState, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { ProfileData } from '../screens/profile/components/ProfileEditModal';

interface UserProfile extends ProfileData {
  goal: 'cut' | 'bulk' | 'maintain';
  bmi: number;
  targetWeight: number;
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

// グローバル状態として管理
let globalUserProfile: UserProfile = {
  age: 28,
  height: 175,
  weight: 71.2,
  gender: 'male',
  activityLevel: 'moderate',
  targetWeight: 68.0,
  targetDate: '2024-06-30',
  goal: 'cut',
  bmi: 23.2,
  startWeight: 74.5,
  joinDate: '2023-11-15',
};

// グローバル状態の変更を通知するためのリスナー
let profileListeners: (() => void)[] = [];

export const useProfileData = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [, forceUpdate] = useState({});

  // グローバル状態から取得
  const [userProfile, setUserProfile] =
    useState<UserProfile>(globalUserProfile);

  // グローバル状態の変更を監視
  useEffect(() => {
    const listener = () => {
      console.log('useProfileData: グローバル状態更新検知');
      setUserProfile({ ...globalUserProfile });
      forceUpdate({});
    };

    profileListeners.push(listener);

    return () => {
      profileListeners = profileListeners.filter(l => l !== listener);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const handleProfileSave = (updatedProfile: ProfileData) => {
    const newBMI = calculateBMI(updatedProfile.height, updatedProfile.weight);

    // グローバル状態を更新
    globalUserProfile = {
      ...globalUserProfile,
      ...updatedProfile,
      bmi: newBMI,
      targetWeight: updatedProfile.targetWeight || updatedProfile.weight,
    };

    console.log('handleProfileSave: グローバル状態更新', globalUserProfile);

    // 全てのリスナーに通知
    profileListeners.forEach(listener => listener());

    Alert.alert('成功', 'プロフィールが更新されました');
  };

  // 詳細な体重分析を計算
  const calculateWeightAnalysis = (): WeightAnalysis => {
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

    // Harris-Benedict式で基礎代謝を計算
    const calculateBMR = (): number => {
      const { weight, height, age, gender } = userProfile;
      if (gender === 'male') {
        return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      } else {
        return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
      }
    };

    // 活動レベル係数
    const getActivityMultiplier = (level: string): number => {
      switch (level) {
        case 'sedentary':
          return 1.2;
        case 'light':
          return 1.375;
        case 'moderate':
          return 1.55;
        case 'active':
          return 1.725;
        case 'very-active':
          return 1.9;
        default:
          return 1.55;
      }
    };

    const bmr = calculateBMR();
    const maintenanceCalories =
      bmr * getActivityMultiplier(userProfile.activityLevel);

    // 減量/増量ペースの評価
    const weeklyPaceKg = Math.abs(requiredWeeklyPace);
    let warningLevel: 'safe' | 'caution' | 'danger' = 'safe';
    let warningMessage = '';
    let recommendedWeeks: number | undefined;
    let maxSafeWeeks: number | undefined;

    if (Math.abs(weightChangeToTarget) > 0.1) {
      if (weightChangeToTarget < 0) {
        // 減量の場合
        recommendedWeeks = Math.abs(weightChangeToTarget) / 0.5;
        maxSafeWeeks = Math.abs(weightChangeToTarget) / 0.75;
        
        if (weeklyPaceKg > 0.75) {
          warningLevel = 'danger';
          warningMessage = `危険な減量ペース（週${weeklyPaceKg.toFixed(1)}kg）です。推奨期間は${recommendedWeeks.toFixed(0)}週間です。`;
        } else if (weeklyPaceKg > 0.5) {
          warningLevel = 'caution';
          warningMessage = `やや速い減量ペース（週${weeklyPaceKg.toFixed(1)}kg）です。注意して進めてください。`;
        }
      } else {
        // 増量の場合
        if (weeklyPaceKg > 0.5) {
          warningLevel = 'caution';
          warningMessage = `速い増量ペース（週${weeklyPaceKg.toFixed(1)}kg）です。`;
        }
      }
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
      maxSafeWeeks,
    };
  };

  // 動的に栄養目標を計算
  const calculateNutritionTargets = (
    analysis: WeightAnalysis
  ): NutritionTargets => {
    const maintenanceCalories = analysis.maintenanceCalories;
    let targetCalories = maintenanceCalories;
    const weightChangeNeeded = userProfile.targetWeight - userProfile.weight;
    
    console.log('カロリー計算:', {
      maintenanceCalories,
      weightChangeNeeded,
      bmr: analysis.bmr,
      daysToGoal: analysis.daysToGoal
    });

    if (Math.abs(weightChangeNeeded) > 0.1) {
      const totalKcalChange = weightChangeNeeded * 7700;
      const dailyKcalChange =
        analysis.daysToGoal > 0 ? totalKcalChange / analysis.daysToGoal : 0;

      if (weightChangeNeeded < 0) {
        const theoreticalCalories = maintenanceCalories + dailyKcalChange;
        const weeklyPaceKg = Math.abs(analysis.weeklyPace);
        
        // 週0.5kg（推奨）〜0.75kg（上限）の減量ペースで推奨期間を計算
        const recommendedWeeks = Math.abs(weightChangeNeeded) / 0.5; // 週0.5kg基準
        const maxSafeWeeks = Math.abs(weightChangeNeeded) / 0.75; // 週0.75kg基準
        
        // 理論値をそのまま採用（BMR制限なし）
        targetCalories = theoreticalCalories;
        
        if (weeklyPaceKg > 0.75) {
          console.warn(`⚠️ 危険な減量ペース: 週${weeklyPaceKg.toFixed(1)}kg`);
          console.warn(`推奨期間: ${recommendedWeeks.toFixed(0)}週間（週0.5kg）`);
          console.warn(`最短安全期間: ${maxSafeWeeks.toFixed(0)}週間（週0.75kg）`);
        } else if (weeklyPaceKg > 0.5) {
          console.warn(`注意: やや速い減量ペース（週${weeklyPaceKg.toFixed(1)}kg）`);
        }
        
        console.log('減量計算:', {
          theoreticalCalories,
          dailyKcalChange,
          weeklyPaceKg,
          bmr: analysis.bmr,
          finalTargetCalories: targetCalories,
          bmrDifference: targetCalories - analysis.bmr,
          recommendedWeeks,
          maxSafeWeeks
        });
        
      } else if (weightChangeNeeded > 0) {
        const weeklyPaceKg = Math.abs(analysis.weeklyPace);
        
        if (weeklyPaceKg > 0.5) {
          console.warn(`注意: 速い増量ペース（週${weeklyPaceKg.toFixed(1)}kg）`);
        }
        
        targetCalories = maintenanceCalories + dailyKcalChange;
        targetCalories = Math.min(analysis.bmr * 2.5, targetCalories);
        
        console.log('増量計算:', {
          dailyKcalChange,
          weeklyPaceKg,
          finalTargetCalories: targetCalories
        });
      }
    }

    const getProteinMultiplier = (): number => {
      if (weightChangeNeeded < 0) {
        return 2.0 + (userProfile.activityLevel === 'very-active' ? 0.2 : 0);
      } else if (weightChangeNeeded > 0) {
        return 1.8 + (userProfile.activityLevel === 'very-active' ? 0.2 : 0);
      }
      return 1.6;
    };

    const protein = Math.round(userProfile.weight * getProteinMultiplier());
    const fatRatio = weightChangeNeeded > 0 ? 0.25 : 0.27;
    const fat = Math.round((targetCalories * fatRatio) / 9);
    const carbCalories = targetCalories - protein * 4 - fat * 9;
    const carbs = Math.round(Math.max(100, carbCalories / 4));
    const actualCalories = protein * 4 + fat * 9 + carbs * 4;

    return {
      calories: Math.round(actualCalories),
      protein,
      fat,
      carbs,
    };
  };

  const analysis = useMemo(
    () => calculateWeightAnalysis(),
    [
      userProfile.targetDate,
      userProfile.targetWeight,
      userProfile.weight,
      userProfile.activityLevel,
      userProfile.age,
      userProfile.gender,
      userProfile.height,
    ]
  );

  const nutritionTargets = useMemo(() => {
    const targets = calculateNutritionTargets(analysis);
    console.log('useProfileData: nutritionTargets memo更新', targets);
    return targets;
  }, [
    analysis,
    userProfile.weight,
    userProfile.targetWeight,
    userProfile.activityLevel,
  ]);

  return {
    userProfile,
    analysis,
    nutritionTargets,
    refreshing,
    notificationsEnabled,
    showProfileEditModal,
    setNotificationsEnabled,
    setShowProfileEditModal,
    onRefresh,
    handleProfileSave,
  };
};

export type { UserProfile, NutritionTargets, WeightAnalysis };
