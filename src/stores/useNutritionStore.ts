import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Food {
  id: string;
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  timestamp: Date;
  icon: string;
}

export interface NutritionGoals {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

interface NutritionStore {
  foods: Food[];
  goals: NutritionGoals;
  favorites: Set<string>;

  addFood: (food: Food) => void;
  removeFood: (id: string) => void;
  updateFood: (id: string, food: Partial<Food>) => void;
  toggleFavorite: (id: string) => void;
  setGoals: (goals: NutritionGoals) => void;

  getTotals: () => {
    protein: number;
    fat: number;
    carbs: number;
    calories: number;
  };

  getNutritionScore: () => number;
}

const calculateNutritionScore = (
  totals: { protein: number; fat: number; carbs: number; calories: number },
  goals: NutritionGoals
): number => {
  const proteinScore = Math.min(100, (totals.protein / goals.protein) * 100);
  const fatScore = Math.min(100, (totals.fat / goals.fat) * 100);
  const carbsScore = Math.min(100, (totals.carbs / goals.carbs) * 100);
  const caloriesScore = Math.min(100, (totals.calories / goals.calories) * 100);

  // 重み付き平均（タンパク質を重視）
  const weightedScore =
    proteinScore * 0.4 +
    caloriesScore * 0.3 +
    carbsScore * 0.2 +
    fatScore * 0.1;

  return Math.round(weightedScore);
};

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      foods: [],
      goals: {
        protein: 150,
        fat: 60,
        carbs: 300,
        calories: 2200,
      },
      favorites: new Set(),

      addFood: food =>
        set(state => ({
          foods: [...state.foods, food],
        })),

      removeFood: id =>
        set(state => ({
          foods: state.foods.filter(f => f.id !== id),
        })),

      updateFood: (id, updatedFood) =>
        set(state => ({
          foods: state.foods.map(f =>
            f.id === id ? { ...f, ...updatedFood } : f
          ),
        })),

      toggleFavorite: id =>
        set(state => {
          const newFavorites = new Set(state.favorites);
          if (newFavorites.has(id)) {
            newFavorites.delete(id);
          } else {
            newFavorites.add(id);
          }
          return { favorites: newFavorites };
        }),

      setGoals: goals => set({ goals }),

      getTotals: () => {
        const { foods } = get();
        return foods.reduce(
          (acc, food) => ({
            protein: acc.protein + food.protein,
            fat: acc.fat + food.fat,
            carbs: acc.carbs + food.carbs,
            calories: acc.calories + food.calories,
          }),
          { protein: 0, fat: 0, carbs: 0, calories: 0 }
        );
      },

      getNutritionScore: () => {
        const totals = get().getTotals();
        const { goals } = get();
        return calculateNutritionScore(totals, goals);
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        foods: state.foods,
        goals: state.goals,
        favorites: Array.from(state.favorites), // Set を配列に変換
      }),
      onRehydrateStorage: () => state => {
        if (state && Array.isArray(state.favorites)) {
          state.favorites = new Set(state.favorites); // 配列を Set に戻す
        }
      },
    }
  )
);
