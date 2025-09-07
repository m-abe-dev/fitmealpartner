import { create } from 'zustand';
import { Exercise, WorkoutSet } from '../screens/workout/types/workout.types';
import DatabaseService from '../services/database/DatabaseService';

interface WorkoutSession {
  date: string;
  exercises: Exercise[];
  duration?: number;
  totalVolume?: number;
}

interface WorkoutState {
  exercises: Exercise[];
  isLoading: boolean;
  currentSessionId: number | null;
  workoutHistory: WorkoutSession[];

  // Actions
  loadTodaysWorkout: () => Promise<void>;
  loadWorkoutHistory: () => Promise<void>;
  addExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  updateExercise: (
    exerciseId: string,
    updates: Partial<Exercise>
  ) => Promise<void>;
  toggleExerciseExpansion: (exerciseId: string) => void;
  addSet: (exerciseId: string) => Promise<void>;
  updateSet: (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps' | 'time' | 'distance',
    value: string
  ) => Promise<void>;
  deleteSet: (exerciseId: string, setId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  exercises: [],
  isLoading: true,
  currentSessionId: null,
  workoutHistory: [],

  loadTodaysWorkout: async () => {
    try {
      await DatabaseService.initialize();

      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // セッションを取得または作成
      let session = await DatabaseService.getFirstAsync<any>(
        'SELECT * FROM workout_session WHERE date = ? AND user_id = ? ORDER BY session_id DESC LIMIT 1',
        [dateString, 'guest']
      );

      if (!session) {
        const result = await DatabaseService.runAsync(
          'INSERT INTO workout_session (user_id, date, start_time) VALUES (?, ?, ?)',
          ['guest', dateString, new Date().toISOString()]
        );
        const sessionId = result.lastInsertRowId;
        set({ currentSessionId: sessionId as number });
      } else {
        set({ currentSessionId: session.session_id });
      }

      // 今日のワークアウトデータを読み込み
      const workoutData = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, es.exercise_id, es.name_ja as exercise_name, es.muscle_group
         FROM workout_set ws
         LEFT JOIN exercise_master es ON ws.exercise_id = es.exercise_id
         WHERE ws.session_id = (
           SELECT session_id FROM workout_session
           WHERE date = ? AND user_id = ?
           ORDER BY session_id DESC LIMIT 1
         )
         ORDER BY ws.exercise_id, ws.set_number`,
        [dateString, 'guest']
      );

      // データをExercise[]形式に変換
      const exerciseMap = new Map<string, Exercise>();

      workoutData.forEach(row => {
        const exerciseId = row.exercise_id?.toString() || 'unknown';
        const exerciseName = row.exercise_name || `Exercise ${exerciseId}`;

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            id: exerciseId,
            name: exerciseName,
            category: row.muscle_group,
            sets: [],
            isExpanded: true,
            type: row.muscle_group === '有酸素' ? 'cardio' : 'strength',
          });
        }

        const exercise = exerciseMap.get(exerciseId)!;
        exercise.sets.push({
          id: row.set_id?.toString() || `${Date.now()}-${exercise.sets.length}`,
          weight: row.weight_kg || 0,
          reps: row.reps || 0,
          time: row.time_minutes || undefined,
          distance: row.distance_km || undefined,
          rm:
            row.weight_kg && row.reps
              ? Math.round(row.weight_kg * (1 + row.reps / 30) * 100) / 100
              : undefined,
        });
      });

      const exercises = Array.from(exerciseMap.values());
      set({ exercises, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  loadWorkoutHistory: async () => {
    try {
      await DatabaseService.initialize();
      
      // 過去30日間のワークアウト履歴を取得
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];
      
      const sessions = await DatabaseService.getAllAsync<any>(
        `SELECT DISTINCT ws.date, 
                COUNT(DISTINCT wset.exercise_id) as exercise_count,
                SUM(wset.weight_kg * wset.reps) as total_volume
         FROM workout_session ws
         LEFT JOIN workout_set wset ON ws.session_id = wset.session_id
         WHERE ws.date >= ? AND ws.user_id = ?
         GROUP BY ws.date
         ORDER BY ws.date DESC`,
        [dateString, 'guest']
      );
      
      const workoutHistory: WorkoutSession[] = [];
      
      for (const session of sessions) {
        const workoutData = await DatabaseService.getAllAsync<any>(
          `SELECT ws.*, es.exercise_id, es.name_ja as exercise_name, es.muscle_group
           FROM workout_set ws
           LEFT JOIN exercise_master es ON ws.exercise_id = es.exercise_id
           WHERE ws.session_id = (
             SELECT session_id FROM workout_session
             WHERE date = ? AND user_id = ?
             ORDER BY session_id DESC LIMIT 1
           )
           ORDER BY ws.exercise_id, ws.set_number`,
          [session.date, 'guest']
        );
        
        const exerciseMap = new Map<string, Exercise>();
        
        workoutData.forEach(row => {
          const exerciseId = row.exercise_id?.toString() || 'unknown';
          const exerciseName = row.exercise_name || `Exercise ${exerciseId}`;
          
          if (!exerciseMap.has(exerciseId)) {
            exerciseMap.set(exerciseId, {
              id: exerciseId,
              name: exerciseName,
              category: row.muscle_group,
              sets: [],
              isExpanded: false,
              type: row.muscle_group === '有酸素' ? 'cardio' : 'strength',
              targetMuscles: [row.muscle_group],
            });
          }
          
          const exercise = exerciseMap.get(exerciseId)!;
          exercise.sets.push({
            id: row.set_id?.toString() || `${Date.now()}-${exercise.sets.length}`,
            weight: row.weight_kg || 0,
            reps: row.reps || 0,
            time: row.time_minutes || undefined,
            distance: row.distance_km || undefined,
          });
        });
        
        workoutHistory.push({
          date: session.date,
          exercises: Array.from(exerciseMap.values()),
          duration: 45, // デフォルト値
          totalVolume: session.total_volume || 0,
        });
      }
      
      set({ workoutHistory });
    } catch (error) {
      console.error('Failed to load workout history:', error);
    }
  },

  addExercise: async exercise => {
    const { currentSessionId } = get();
    
    if (!currentSessionId) {
      return;
    }

    try {
      // exercise_masterに種目を追加/取得
      let exerciseId = parseInt(exercise.id);

      const existingExercise = await DatabaseService.getFirstAsync<any>(
        'SELECT * FROM exercise_master WHERE exercise_id = ?',
        [exerciseId]
      );

      // categoryベースでtypeを正しく判定
      const correctType: 'cardio' | 'strength' = exercise.category === '有酸素' ? 'cardio' : 'strength';
      
      if (!existingExercise) {
        await DatabaseService.runAsync(
          'INSERT INTO exercise_master (exercise_id, name_ja, muscle_group) VALUES (?, ?, ?)',
          [
            exerciseId,
            exercise.name,
            exercise.category || (correctType === 'cardio' ? '有酸素' : 'その他'),
          ]
        );
      }

      // 正しいtypeでexerciseオブジェクトを作成
      const exerciseWithCorrectType: Exercise = {
        ...exercise,
        type: correctType
      };


      // 各セットをworkout_setに追加
      for (const [index, workoutSet] of exercise.sets.entries()) {
        if (correctType === 'cardio') {
          // 有酸素運動の場合
          await DatabaseService.runAsync(
            `INSERT INTO workout_set (
              session_id, exercise_id, set_number, time_minutes, distance_km, weight_kg, reps
            ) VALUES (?, ?, ?, ?, ?, 0, 0)`,
            [
              currentSessionId,
              exerciseId,
              index + 1,
              workoutSet.time || 0,
              workoutSet.distance || 0,
            ]
          );
        } else {
          // 筋力トレーニングの場合
          await DatabaseService.runAsync(
            `INSERT INTO workout_set (
              session_id, exercise_id, set_number, weight_kg, reps, time_minutes, distance_km
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL)`,
            [
              currentSessionId,
              exerciseId,
              index + 1,
              workoutSet.weight || 0,
              workoutSet.reps || 0,
            ]
          );
        }
      }

      set(state => {
        // Check if exercise with same ID already exists
        const existingIndex = state.exercises.findIndex(ex => ex.id === exerciseWithCorrectType.id);
        let updated;
        
        if (existingIndex !== -1) {
          // Update existing exercise instead of adding duplicate
          updated = state.exercises.map((ex, index) => 
            index === existingIndex 
              ? { ...ex, sets: [...ex.sets, ...exerciseWithCorrectType.sets] }
              : ex
          );
        } else {
          // Add new exercise
          updated = [...state.exercises, exerciseWithCorrectType];
        }
        
        return { exercises: updated };
      });
    } catch (error) {
      throw error;
    }
  },

  deleteExercise: async exerciseId => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    try {
      await DatabaseService.runAsync(
        'DELETE FROM workout_set WHERE session_id = ? AND exercise_id = ?',
        [currentSessionId, parseInt(exerciseId)]
      );

      set(state => {
        const updated = state.exercises.filter(ex => ex.id !== exerciseId);
        return { exercises: updated };
      });
    } catch (error) {
      throw error;
    }
  },

  updateExercise: async (exerciseId, updates) => {
    set(state => ({
      exercises: state.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      ),
    }));
  },

  toggleExerciseExpansion: exerciseId => {
    set(state => ({
      exercises: state.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, isExpanded: !ex.isExpanded } : ex
      ),
    }));
  },

  addSet: async exerciseId => {
    const { currentSessionId, exercises } = get();
    if (!currentSessionId) return;

    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const setNumber = exercise.sets.length + 1;
    const newSet: WorkoutSet = {
      id: `${Date.now()}-${setNumber}`,
      weight: 0,
      reps: 0,
      time: undefined,
      distance: undefined,
    };

    try {
      const result = await DatabaseService.runAsync(
        `INSERT INTO workout_set (
          session_id, exercise_id, set_number, weight_kg, reps
        ) VALUES (?, ?, ?, ?, ?)`,
        [currentSessionId, parseInt(exerciseId), setNumber, 0, 0]
      );

      newSet.id = result.lastInsertRowId?.toString() || newSet.id;

      set(state => ({
        exercises: state.exercises.map(ex =>
          ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex
        ),
      }));
    } catch (error) {
      throw error;
    }
  },

  updateSet: async (exerciseId, setId, field, value) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    const numericValue = parseFloat(value) || 0;
    const dbField =
      field === 'weight'
        ? 'weight_kg'
        : field === 'reps'
        ? 'reps'
        : field === 'time'
        ? 'time_minutes'
        : 'distance_km';

    try {
      await DatabaseService.runAsync(
        `UPDATE workout_set SET ${dbField} = ? WHERE set_id = ?`,
        [numericValue, parseInt(setId)]
      );

      set(state => ({
        exercises: state.exercises.map(ex =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map(s => {
                  if (s.id === setId) {
                    const updatedSet = { ...s, [field]: numericValue };
                    if (field === 'weight' || field === 'reps') {
                      updatedSet.rm =
                        updatedSet.weight && updatedSet.reps
                          ? Math.round(
                              updatedSet.weight *
                                (1 + updatedSet.reps / 30) *
                                100
                            ) / 100
                          : undefined;
                    }
                    return updatedSet;
                  }
                  return s;
                }),
              }
            : ex
        ),
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteSet: async (exerciseId, setId) => {
    try {
      await DatabaseService.runAsync(
        'DELETE FROM workout_set WHERE set_id = ?',
        [parseInt(setId)]
      );

      set(state => ({
        exercises: state.exercises.map(ex =>
          ex.id === exerciseId
            ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
            : ex
        ),
      }));
    } catch (error) {
      throw error;
    }
  },
}));
