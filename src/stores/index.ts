// Centralized store exports
export { useNutritionStore } from './useNutritionStore';
export { useWorkoutStore } from './useWorkoutStore';
export { useUserStore } from './useUserStore';

// Type exports
export type { 
  Food, 
  NutritionGoals 
} from './useNutritionStore';

export type { 
  Exercise, 
  WorkoutSet, 
  WorkoutSession, 
  WorkoutGoals 
} from './useWorkoutStore';

export type { 
  UserProfile, 
  UserPreferences, 
  Achievement, 
  HealthMetrics 
} from './useUserStore';