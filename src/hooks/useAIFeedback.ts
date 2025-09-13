import { useState, useCallback } from 'react';
import { AIFeedbackService } from '../services/AIFeedbackService';
import { 
  NutritionData, 
  UserProfile, 
  FeedbackResponse, 
  WorkoutData, 
  WorkoutSuggestionResponse,
  AIFeedbackState 
} from '../types/ai.types';

export const useAIFeedback = () => {
  const [state, setState] = useState<AIFeedbackState>({
    isLoading: false,
    nutritionFeedback: undefined,
    workoutSuggestion: undefined,
    lastUpdated: undefined,
    error: undefined,
  });

  /**
   * 栄養フィードバックを取得（additionalContextを追加）
   */
  const getNutritionFeedback = useCallback(async (
    nutrition: NutritionData,
    profile: UserProfile,
    additionalContext?: {
      yesterdayData?: any;
      mealCount?: number;
      mealTypeData?: any;
    }
  ): Promise<FeedbackResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const feedback = await AIFeedbackService.getNutritionFeedback(
        nutrition, 
        profile,
        additionalContext
      );
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        nutritionFeedback: feedback,
        lastUpdated: new Date(),
        error: feedback.success ? undefined : feedback.error
      }));
      
      return feedback;
    } catch (error) {
      console.error('Failed to get nutrition feedback:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      }));
      
      return null;
    }
  }, []);

  /**
   * ワークアウト提案を取得
   */
  const getWorkoutSuggestion = useCallback(async (
    recentWorkouts: WorkoutData[],
    profile: UserProfile
  ): Promise<WorkoutSuggestionResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const suggestion = await AIFeedbackService.getWorkoutSuggestion(recentWorkouts, profile);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        workoutSuggestion: suggestion,
        lastUpdated: new Date(),
        error: suggestion.success ? undefined : suggestion.error
      }));
      
      return suggestion;
    } catch (error) {
      console.error('Failed to get workout suggestion:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      }));
      
      return null;
    }
  }, []);

  /**
   * フィードバック履歴をクリア
   */
  const clearFeedback = useCallback(() => {
    setState({
      isLoading: false,
      nutritionFeedback: undefined,
      workoutSuggestion: undefined,
      lastUpdated: undefined,
      error: undefined,
    });
  }, []);

  /**
   * 最後のフィードバックから指定時間経過したかチェック
   */
  const isStale = useCallback((maxAgeMinutes: number = 30): boolean => {
    if (!state.lastUpdated) return true;
    
    const now = new Date();
    const ageMinutes = (now.getTime() - state.lastUpdated.getTime()) / (1000 * 60);
    
    return ageMinutes > maxAgeMinutes;
  }, [state.lastUpdated]);

  /**
   * 栄養フィードバックをリフレッシュ（additionalContext対応）
   */
  const refreshNutritionFeedback = useCallback(async (
    nutrition: NutritionData,
    profile: UserProfile,
    additionalContext?: {
      yesterdayData?: any;
      mealCount?: number;
      mealTypeData?: any;
    },
    forceRefresh: boolean = false
  ): Promise<FeedbackResponse | null> => {
    // フォースリフレッシュでない場合、キャッシュをチェック
    if (!forceRefresh && state.nutritionFeedback && !isStale(15)) {
      console.log('Using cached nutrition feedback');
      return state.nutritionFeedback;
    }
    
    return getNutritionFeedback(nutrition, profile, additionalContext);
  }, [state.nutritionFeedback, isStale, getNutritionFeedback]);

  return {
    // State
    isLoading: state.isLoading,
    nutritionFeedback: state.nutritionFeedback,
    workoutSuggestion: state.workoutSuggestion,
    lastUpdated: state.lastUpdated,
    error: state.error,
    
    // Actions
    getNutritionFeedback,
    getWorkoutSuggestion,
    refreshNutritionFeedback,
    clearFeedback,
    isStale,
  };
};