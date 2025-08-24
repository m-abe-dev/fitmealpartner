import { useState } from 'react';
import { scoreData, periodData, periodAIData } from '../screens/dashboard/data/mockData';
import { PeriodData } from '../screens/dashboard/types/dashboard.types';

export const useDashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coach');
  const [currentWorkoutPeriod, setCurrentWorkoutPeriod] = useState(0);
  const [currentNutritionPeriod, setCurrentNutritionPeriod] = useState(0);
  const [currentScoreTab, setCurrentScoreTab] = useState(0);

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