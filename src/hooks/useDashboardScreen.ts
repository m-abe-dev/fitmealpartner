import { useState, useEffect } from 'react';
import { periodData, periodAIData } from '../screens/dashboard/data/mockData';
import { PeriodData } from '../screens/dashboard/types/dashboard.types';
import { useScoreData } from './useScoreData';
import { useWorkoutData } from './useWorkoutData';
import { useFoodLog } from './useFoodLog';
import { useProfileData } from './useProfileData';

export const useDashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coach');
  const [currentWorkoutPeriod, setCurrentWorkoutPeriod] = useState(0);
  const [currentNutritionPeriod, setCurrentNutritionPeriod] = useState(0);
  const [currentScoreTab, setCurrentScoreTab] = useState(0);
  
  // プロフィールデータから動的な目標値を取得
  const { nutritionTargets } = useProfileData();

  // 実際のワークアウトデータを取得
  const { exercises, subscribe } = useWorkoutData();
  
  // 実際の食事データを取得
  const { foodLog } = useFoodLog();
  
  // 実際のスコアデータを取得（食事ログと動的な目標値を含む）
  const { scoreData } = useScoreData(exercises, foodLog, nutritionTargets);
  
  // Subscribe to workout data changes
  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getCurrentAIData = () => {
    return periodAIData[currentScoreTab];
  };

  const getCurrentWorkoutPeriodData = (): PeriodData => {
    return periodData[currentWorkoutPeriod];
  };

  const getCurrentNutritionPeriodData = (): PeriodData => {
    return periodData[currentNutritionPeriod];
  };

  return {
    // State
    refreshing,
    activeTab,
    currentWorkoutPeriod,
    currentNutritionPeriod,
    currentScoreTab,
    
    // Data
    scoreData,
    periodData,
    
    // Setters
    setActiveTab,
    setCurrentWorkoutPeriod,
    setCurrentNutritionPeriod,
    setCurrentScoreTab,
    
    // Handlers
    onRefresh,
    
    // Data getters
    getCurrentAIData,
    getCurrentWorkoutPeriodData,
    getCurrentNutritionPeriodData,
  };
};