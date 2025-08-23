import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCompound: boolean;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  restTime?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  totalVolume: number;
  exercises: Exercise[];
  sets: WorkoutSet[];
  completed: boolean;
}

export interface WorkoutGoals {
  weeklyWorkouts: number;
  volumeTarget: number;
  strengthGoals: Record<string, number>; // exerciseId -> target weight
}

interface WorkoutStore {
  sessions: WorkoutSession[];
  currentSession: WorkoutSession | null;
  exercises: Exercise[];
  goals: WorkoutGoals;
  favoriteExercises: Set<string>;

  // Session management
  startSession: () => void;
  endSession: () => void;
  updateSession: (session: Partial<WorkoutSession>) => void;
  deleteSession: (id: string) => void;

  // Exercise management
  addExercise: (exercise: Exercise) => void;
  removeExercise: (id: string) => void;
  toggleFavoriteExercise: (id: string) => void;

  // Set management
  addSet: (workoutSet: Omit<WorkoutSet, 'id'>) => void;
  updateSet: (id: string, updates: Partial<WorkoutSet>) => void;
  deleteSet: (id: string) => void;
  completeSet: (id: string) => void;

  // Goals
  setGoals: (goals: WorkoutGoals) => void;

  // Analytics
  getWeeklyStats: () => {
    sessionsCount: number;
    totalVolume: number;
    averageSession: number;
  };

  getWorkoutScore: () => number;
}

const calculateWorkoutScore = (
  sessions: WorkoutSession[],
  goals: WorkoutGoals
): number => {
  const thisWeek = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return sessionDate >= weekStart;
  });

  const weeklyProgress = (thisWeek.length / goals.weeklyWorkouts) * 100;
  const totalVolume = thisWeek.reduce(
    (acc, session) => acc + session.totalVolume,
    0
  );
  const volumeProgress = (totalVolume / goals.volumeTarget) * 100;

  // 重み付き平均
  const score = weeklyProgress * 0.6 + volumeProgress * 0.4;
  return Math.min(100, Math.round(score));
};

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      exercises: [
        // デフォルトエクササイズ
        {
          id: 'bench-press',
          name: 'ベンチプレス',
          muscleGroup: '大胸筋',
          equipment: 'バーベル',
          isCompound: true,
        },
        {
          id: 'squat',
          name: 'スクワット',
          muscleGroup: '脚',
          equipment: 'バーベル',
          isCompound: true,
        },
        {
          id: 'deadlift',
          name: 'デッドリフト',
          muscleGroup: '背中',
          equipment: 'バーベル',
          isCompound: true,
        },
      ],
      goals: {
        weeklyWorkouts: 4,
        volumeTarget: 5000,
        strengthGoals: {},
      },
      favoriteExercises: new Set(),

      startSession: () =>
        set(() => ({
          currentSession: {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            startTime: new Date(),
            totalVolume: 0,
            exercises: [],
            sets: [],
            completed: false,
          },
        })),

      endSession: () =>
        set(state => {
          if (!state.currentSession) return state;

          const completedSession = {
            ...state.currentSession,
            endTime: new Date(),
            completed: true,
            totalVolume: state.currentSession.sets
              .filter(set => set.completed)
              .reduce((acc, set) => acc + set.weight * set.reps, 0),
          };

          return {
            sessions: [...state.sessions, completedSession],
            currentSession: null,
          };
        }),

      updateSession: updates =>
        set(state => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, ...updates }
            : null,
        })),

      deleteSession: id =>
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== id),
        })),

      addExercise: exercise =>
        set(state => ({
          exercises: [...state.exercises, exercise],
        })),

      removeExercise: id =>
        set(state => ({
          exercises: state.exercises.filter(e => e.id !== id),
        })),

      toggleFavoriteExercise: id =>
        set(state => {
          const newFavorites = new Set(state.favoriteExercises);
          if (newFavorites.has(id)) {
            newFavorites.delete(id);
          } else {
            newFavorites.add(id);
          }
          return { favoriteExercises: newFavorites };
        }),

      addSet: workoutSet =>
        set(state => {
          if (!state.currentSession) return state;

          const newSet: WorkoutSet = {
            ...workoutSet,
            id: Date.now().toString(),
          };

          return {
            currentSession: {
              ...state.currentSession,
              sets: [...state.currentSession.sets, newSet],
            },
          };
        }),

      updateSet: (id, updates) =>
        set(state => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              sets: state.currentSession.sets.map(set =>
                set.id === id ? { ...set, ...updates } : set
              ),
            },
          };
        }),

      deleteSet: id =>
        set(state => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              sets: state.currentSession.sets.filter(set => set.id !== id),
            },
          };
        }),

      completeSet: id =>
        set(state => {
          if (!state.currentSession) return state;

          return {
            currentSession: {
              ...state.currentSession,
              sets: state.currentSession.sets.map(set =>
                set.id === id ? { ...set, completed: true } : set
              ),
            },
          };
        }),

      setGoals: goals => set({ goals }),

      getWeeklyStats: () => {
        const { sessions } = get();
        const thisWeek = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          return sessionDate >= weekStart && session.completed;
        });

        const totalVolume = thisWeek.reduce(
          (acc, session) => acc + session.totalVolume,
          0
        );

        return {
          sessionsCount: thisWeek.length,
          totalVolume,
          averageSession:
            thisWeek.length > 0 ? totalVolume / thisWeek.length : 0,
        };
      },

      getWorkoutScore: () => {
        const { sessions, goals } = get();
        return calculateWorkoutScore(sessions, goals);
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        sessions: state.sessions,
        exercises: state.exercises,
        goals: state.goals,
        favoriteExercises: Array.from(state.favoriteExercises),
      }),
      onRehydrateStorage: () => (state: WorkoutStore | undefined) => {
        if (state && Array.isArray((state as any).favoriteExercises)) {
          state.favoriteExercises = new Set((state as any).favoriteExercises);
        }
      },
    }
  )
);
