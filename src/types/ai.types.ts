export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface WorkoutData {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    muscleGroup: string;
  }>;
  duration: number;
  type: 'strength' | 'cardio' | 'mixed';
  totalVolume: number;
  date: string;
}

export interface AIUserProfile {
  age: number;
  weight: number;
  height: number;
  goal: 'cut' | 'bulk' | 'maintain';
  activityLevel: string;
  gender: 'male' | 'female' | 'other';
}

export interface FeedbackResponse {
  success: boolean;
  feedback: string;
  suggestions: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
  }>;
  error?: string;
  fromCache?: boolean;
}

export interface WorkoutSuggestionResponse {
  success: boolean;
  nextWorkout: {
    targetMuscleGroups: string[];
    recommendedExercises: Array<{
      name: string;
      sets: number;
      reps: string;
      notes: string;
    }>;
    estimatedDuration: number;
  };
  feedback: string;
  error?: string;
}

export interface AIFeedbackState {
  isLoading: boolean;
  nutritionFeedback?: FeedbackResponse;
  workoutSuggestion?: WorkoutSuggestionResponse;
  lastUpdated?: Date;
  error?: string;
}