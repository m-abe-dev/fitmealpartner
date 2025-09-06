import { useState, useEffect } from 'react';
import { OnboardingStorageService } from '../services/OnboardingStorageService';
import { OnboardingData } from '../types/onboarding.types';

export const useOnboardingData = () => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await OnboardingStorageService.getOnboardingData();
      setOnboardingData(data);
    } catch (err) {
      console.error('Failed to load onboarding data:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  // 計算されたプロフィール情報を返す
  const getCalculatedProfile = () => {
    if (!onboardingData?.profile) return null;

    const { profile, goal } = onboardingData;
    
    // 年齢計算
    const today = new Date();
    const birthDate = new Date(profile.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // BMI計算
    const heightInMeters = profile.height / 100;
    const bmi = parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));

    return {
      age,
      height: profile.height,
      weight: profile.weight,
      gender: profile.gender,
      bmi,
      goal: goal?.goal || 'maintain',
      targetWeight: goal?.targetWeight,
      targetDate: goal?.targetDate,
    };
  };

  return {
    // Raw data
    onboardingData,
    profile: onboardingData?.profile || null,
    goal: onboardingData?.goal || null,
    workoutHabits: onboardingData?.workoutHabits || null,
    
    // Calculated data
    calculatedProfile: getCalculatedProfile(),
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshData,
    
    // Utilities
    isComplete: !!onboardingData?.completedAt,
  };
};