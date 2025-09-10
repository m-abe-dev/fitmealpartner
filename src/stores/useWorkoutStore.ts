import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../services/database/DatabaseService';
import StreakService from '../services/StreakService';

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
  
  // Data loading
  loadWorkoutHistory: () => Promise<WorkoutSession[]>;

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

      endSession: () => {
        const state = get();
        if (!state.currentSession) return;

        const completedSession = {
          ...state.currentSession,
          endTime: new Date(),
          completed: true,
          totalVolume: state.currentSession.sets
            .filter(set => set.completed)
            .reduce((acc, set) => acc + set.weight * set.reps, 0),
        };

        // 先にストアを更新
        set({
          sessions: [...state.sessions, completedSession],
          currentSession: null,
        });

        // 非同期でデータベースに保存
        (async () => {
          try {
            await DatabaseService.initialize();
            
            const result = await DatabaseService.runAsync(
              `INSERT INTO workout_session (
                user_id, date, start_time, end_time, notes, total_volume_kg
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                'user_1',
                completedSession.date,
                completedSession.startTime.toISOString(),
                completedSession.endTime!.toISOString(),
                completedSession.notes || '',
                completedSession.totalVolume,
              ]
            );

            console.log('Workout session saved to DB with ID:', result.lastInsertRowId);

            // ストリーク更新
            StreakService.updateStreak().catch(error => {
              console.error('Failed to update streak:', error);
            });
            
          } catch (error) {
            console.error('Failed to save workout session:', error);
          }
        })();
      },

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

      loadWorkoutHistory: async () => {
        try {
          await DatabaseService.initialize();
          
          // デバッグ: データベースの内容を確認
          const checkSessions = await DatabaseService.getAllAsync<any>(
            'SELECT * FROM workout_session WHERE user_id = ?',
            ['user_1']
          );
          console.log('DB sessions count:', checkSessions.length);
          
          // セットが存在するセッションのみを取得（Calendarと同じロジック）
          const dbSessions = await DatabaseService.getAllAsync<any>(
            `SELECT DISTINCT ws.* 
             FROM workout_session ws
             INNER JOIN workout_set wset ON ws.session_id = wset.session_id
             WHERE ws.user_id = ?
             ORDER BY ws.date DESC`,
            ['user_1']
          );
          
          console.log('Sessions with sets:', dbSessions.length);

          const sessions: WorkoutSession[] = dbSessions.map(session => ({
            id: session.session_id.toString(),
            date: session.date,
            startTime: new Date(session.start_time),
            endTime: session.end_time ? new Date(session.end_time) : undefined,
            notes: session.notes || '',
            totalVolume: session.total_volume_kg || 0,
            exercises: [],
            sets: [],
            completed: !!session.end_time,
          }));

          set({ sessions });
          console.log('Loaded workout sessions:', sessions.length);
          
          return sessions; // Promiseで返す
          
        } catch (error) {
          console.error('Failed to load workout history:', error);
          return [];
        }
      },

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
        console.log('Rehydrating workout store:', state);
        
        if (state) {
          // favoriteExercisesをSetに変換
          if (Array.isArray((state as any).favoriteExercises)) {
            state.favoriteExercises = new Set((state as any).favoriteExercises);
          }
          
          // sessionsが配列でない場合は初期化
          if (!Array.isArray(state.sessions)) {
            state.sessions = [];
          }
          
          console.log('Sessions after rehydration:', state.sessions);
        }
      },
    }
  )
);
