import { useState } from 'react';
import { Alert } from 'react-native';
import { ProfileData } from '../screens/profile/components/ProfileEditModal';

interface UserProfile extends ProfileData {
  name: string;
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
}

export const useProfileData = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);

  // モックデータ
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '田中健太',
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
    joinDate: '2023-11-15'
  });

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

    setUserProfile(prev => ({
      ...prev,
      ...updatedProfile,
      bmi: newBMI,
      targetWeight: updatedProfile.targetWeight || updatedProfile.weight,
    }));

    Alert.alert('成功', 'プロフィールが更新されました');
  };

  // 詳細な体重分析を計算
  const calculateWeightAnalysis = (): WeightAnalysis => {
    const targetDate = userProfile.targetDate ? new Date(userProfile.targetDate) : null;
    const today = new Date();
    const daysToGoal = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const weightChangeToTarget = userProfile.targetWeight - userProfile.weight;
    const weeksToTarget = daysToGoal > 0 ? daysToGoal / 7 : 0;
    const requiredWeeklyPace = weeksToTarget > 0 ? weightChangeToTarget / weeksToTarget : 0;

    // Harris-Benedict式で基礎代謝を計算
    const calculateBMR = (): number => {
      const { weight, height, age, gender } = userProfile;
      if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
    };

    // 活動レベル係数
    const getActivityMultiplier = (level: string): number => {
      switch (level) {
        case 'sedentary': return 1.2;
        case 'light': return 1.375;
        case 'moderate': return 1.55;
        case 'active': return 1.725;
        case 'very-active': return 1.9;
        default: return 1.55;
      }
    };

    const bmr = calculateBMR();
    const maintenanceCalories = bmr * getActivityMultiplier(userProfile.activityLevel);

    return {
      daysToGoal,
      weightChange: weightChangeToTarget,
      weeklyPace: requiredWeeklyPace,
      bmr: Math.round(bmr),
      maintenanceCalories: Math.round(maintenanceCalories)
    };
  };

  // 動的に栄養目標を計算
  const calculateNutritionTargets = (analysis: WeightAnalysis): NutritionTargets => {
    const maintenanceCalories = analysis.maintenanceCalories;
    let targetCalories = maintenanceCalories;
    const weightChangeNeeded = userProfile.targetWeight - userProfile.weight;
    
    if (Math.abs(weightChangeNeeded) > 0.1) {
      const totalKcalChange = weightChangeNeeded * 7700;
      const dailyKcalChange = analysis.daysToGoal > 0 ? totalKcalChange / analysis.daysToGoal : 0;
      
      if (weightChangeNeeded < 0) {
        targetCalories = maintenanceCalories + dailyKcalChange;
        targetCalories = Math.max(analysis.bmr * 1.2, targetCalories);
      } else {
        targetCalories = maintenanceCalories + dailyKcalChange;
        targetCalories = Math.min(analysis.bmr * 2.5, targetCalories);
      }
      
      const weeklyPaceKg = Math.abs(analysis.weeklyPace);
      if (weeklyPaceKg > 1.0) {
        console.warn('週1kg以上の体重変化は推奨されません');
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
    const carbCalories = targetCalories - (protein * 4) - (fat * 9);
    const carbs = Math.round(Math.max(100, carbCalories / 4));
    const actualCalories = (protein * 4) + (fat * 9) + (carbs * 4);
    
    return {
      calories: Math.round(actualCalories),
      protein,
      fat,
      carbs
    };
  };

  const analysis = calculateWeightAnalysis();
  const nutritionTargets = calculateNutritionTargets(analysis);

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