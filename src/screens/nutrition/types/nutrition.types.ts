export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  isFavorite?: boolean;
  amount?: number;
  unit?: string;
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time?: string;
}

export interface NewFood {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
}

export interface FoodLogItem {
  id: string;
  foodId: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  amount: number;
  unit: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  date?: string;
  isFavorite?: boolean;
}

export interface NutritionData {
  calories: {
    current: number;
    target: number;
  };
  protein: {
    current: number;
    target: number;
  };
  fat: {
    current: number;
    target: number;
  };
  carbs: {
    current: number;
    target: number;
  };
}

export interface NutritionScores {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  total: number;
}

export interface MealTab {
  id: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  icon: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';