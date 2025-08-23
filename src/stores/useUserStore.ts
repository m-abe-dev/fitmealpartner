import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'cut' | 'bulk' | 'maintain';
  targetWeight?: number;
  joinDate: string;
  avatar?: string;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  language: 'ja' | 'en';
  darkMode: boolean;
  notifications: {
    workoutReminders: boolean;
    nutritionReminders: boolean;
    progressUpdates: boolean;
    achievements: boolean;
  };
  privacy: {
    shareProgress: boolean;
    publicProfile: boolean;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

export interface HealthMetrics {
  weight: Array<{ date: string; value: number }>;
  bodyFat?: Array<{ date: string; value: number }>;
  muscleMass?: Array<{ date: string; value: number }>;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

interface UserStore {
  profile: UserProfile | null;
  preferences: UserPreferences;
  achievements: Achievement[];
  healthMetrics: HealthMetrics;
  isPro: boolean;

  // Profile management
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // Preferences
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  toggleDarkMode: () => void;
  setLanguage: (language: 'ja' | 'en') => void;
  updateNotificationSettings: (
    settings: Partial<UserPreferences['notifications']>
  ) => void;

  // Health metrics
  addWeightEntry: (weight: number, date?: string) => void;
  updateMeasurements: (
    measurements: Partial<HealthMetrics['measurements']>
  ) => void;

  // Achievements
  unlockAchievement: (id: string) => void;
  updateAchievementProgress: (id: string, progress: number) => void;

  // Pro subscription
  setPro: (isPro: boolean) => void;

  // Computed values
  getCurrentBMI: () => number;
  getWeightProgress: () => {
    current: number;
    target?: number;
    change: number;
    progressPercent: number;
  };

  getUnlockedAchievements: () => Achievement[];
  getTotalScore: () => number;
}

const defaultAchievements: Achievement[] = [
  {
    id: '7-day-streak',
    title: '7日連続記録',
    description: '食事を7日間連続で記録しました',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'protein-master',
    title: 'プロテイン王',
    description: 'タンパク質目標を30日連続達成',
    icon: '💪',
    unlocked: false,
    progress: 0,
    target: 30,
  },
  {
    id: 'workout-warrior',
    title: 'ワークアウト戦士',
    description: '月20回のワークアウトを達成',
    icon: '🏆',
    unlocked: false,
    progress: 0,
    target: 20,
  },
  {
    id: 'goal-achiever',
    title: '目標達成者',
    description: '目標体重に到達しました',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'consistency-king',
    title: '継続の王',
    description: '100日間アプリを使用',
    icon: '👑',
    unlocked: false,
    progress: 0,
    target: 100,
  },
];

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      preferences: {
        units: 'metric',
        language: 'ja',
        darkMode: false,
        notifications: {
          workoutReminders: true,
          nutritionReminders: true,
          progressUpdates: true,
          achievements: true,
        },
        privacy: {
          shareProgress: false,
          publicProfile: false,
        },
      },
      achievements: defaultAchievements,
      healthMetrics: {
        weight: [],
      },
      isPro: false,

      setProfile: profile => set({ profile }),

      updateProfile: updates =>
        set(state => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      setPreferences: preferences =>
        set(state => ({
          preferences: { ...state.preferences, ...preferences },
        })),

      toggleDarkMode: () =>
        set(state => ({
          preferences: {
            ...state.preferences,
            darkMode: !state.preferences.darkMode,
          },
        })),

      setLanguage: language =>
        set(state => ({
          preferences: { ...state.preferences, language },
        })),

      updateNotificationSettings: settings =>
        set(state => ({
          preferences: {
            ...state.preferences,
            notifications: { ...state.preferences.notifications, ...settings },
          },
        })),

      addWeightEntry: (weight, date = new Date().toISOString().split('T')[0]) =>
        set(state => ({
          healthMetrics: {
            ...state.healthMetrics,
            weight: [
              ...state.healthMetrics.weight,
              { date, value: weight },
            ].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
          },
          profile: state.profile ? { ...state.profile, weight } : null,
        })),

      updateMeasurements: measurements =>
        set(state => ({
          healthMetrics: {
            ...state.healthMetrics,
            measurements: {
              ...state.healthMetrics.measurements,
              ...measurements,
            },
          },
        })),

      unlockAchievement: id =>
        set(state => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === id
              ? { ...achievement, unlocked: true, unlockedAt: new Date() }
              : achievement
          ),
        })),

      updateAchievementProgress: (id, progress) =>
        set(state => ({
          achievements: state.achievements.map(achievement => {
            if (achievement.id === id) {
              const updated = { ...achievement, progress };
              // 自動的に達成判定
              if (
                achievement.target &&
                progress >= achievement.target &&
                !achievement.unlocked
              ) {
                updated.unlocked = true;
                updated.unlockedAt = new Date();
              }
              return updated;
            }
            return achievement;
          }),
        })),

      setPro: isPro => set({ isPro }),

      getCurrentBMI: () => {
        const { profile } = get();
        if (!profile) return 0;
        const heightInM = profile.height / 100;
        return Math.round((profile.weight / (heightInM * heightInM)) * 10) / 10;
      },

      getWeightProgress: () => {
        const { profile, healthMetrics } = get();
        if (!profile) return { current: 0, change: 0, progressPercent: 0 };

        const weightHistory = healthMetrics.weight;
        const startWeight = weightHistory[0]?.value || profile.weight;
        const currentWeight = profile.weight;
        const change = currentWeight - startWeight;

        let progressPercent = 0;
        if (profile.targetWeight) {
          const totalChange = Math.abs(profile.targetWeight - startWeight);
          const currentChange = Math.abs(currentWeight - startWeight);
          progressPercent =
            totalChange > 0 ? (currentChange / totalChange) * 100 : 0;
        }

        return {
          current: currentWeight,
          target: profile.targetWeight,
          change,
          progressPercent: Math.min(100, progressPercent),
        };
      },

      getUnlockedAchievements: () => {
        const { achievements } = get();
        return achievements.filter(achievement => achievement.unlocked);
      },

      getTotalScore: () => {
        const { achievements } = get();
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const totalCount = achievements.length;

        // 基本スコア（実績基準）+ 追加要素
        const achievementScore = (unlockedCount / totalCount) * 40;
        const consistencyScore = 30; // プレースホルダー
        const progressScore = 30; // プレースホルダー

        return Math.round(achievementScore + consistencyScore + progressScore);
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        profile: state.profile,
        preferences: state.preferences,
        achievements: state.achievements,
        healthMetrics: state.healthMetrics,
        isPro: state.isPro,
      }),
    }
  )
);
