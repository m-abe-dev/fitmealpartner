import { create } from 'zustand';
import { Exercise, WorkoutSet } from '../screens/workout/types/workout.types';
import DatabaseService from '../services/database/DatabaseService';
import { exerciseTemplates } from '../screens/workout/data/mockData';

interface WorkoutState {
  exercises: Exercise[];
  isLoading: boolean;
  currentSessionId: number | null;

  // Actions
  loadTodaysWorkout: () => Promise<void>;
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

      // 無効なworkout_setレコードを削除
      await DatabaseService.runAsync(
        'DELETE FROM workout_set WHERE exercise_id IS NULL',
        []
      );

      // 今日のワークアウトデータを読み込み
      const sessionId = get().currentSessionId;
      console.log('Loading workout data for session:', sessionId, 'date:', dateString);
      
      const workoutData = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, es.exercise_id, es.name_ja as exercise_name, es.muscle_group
         FROM workout_set ws
         LEFT JOIN exercise_master es ON ws.exercise_id = es.exercise_id
         WHERE ws.session_id = ?
         ORDER BY ws.exercise_id, ws.set_number`,
        [sessionId]
      );


      // データをExercise[]形式に変換
      const exerciseMap = new Map<string, Exercise>();

      workoutData.forEach((row, index) => {
        // exercise_idが無効な場合はスキップ
        if (!row.exercise_id || row.exercise_id === 0) {
          return;
        }

        const exerciseId = row.exercise_id.toString();
        const exerciseName = row.exercise_name || `Exercise ${exerciseId}`;

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            id: exerciseId,
            name: exerciseName,
            sets: [],
            isExpanded: true,
            type: row.muscle_group === 'cardio' ? 'cardio' : 'strength',
          });
        }

        const exercise = exerciseMap.get(exerciseId)!;
        exercise.sets.push({
          id: row.set_id?.toString() || `${Date.now()}-${exercise.sets.length}`,
          weight: row.weight_kg || 0,
          reps: row.reps || 0,
          time: undefined, // workout_setテーブルにtime_minutesカラムがないため
          distance: undefined, // workout_setテーブルにdistance_kmカラムがないため
          rm:
            row.rpe ||
            (row.weight_kg && row.reps
              ? Math.round(row.weight_kg * (1 + row.reps / 30) * 100) / 100
              : undefined),
        });
      });

      const exercises = Array.from(exerciseMap.values());
      set({ exercises, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addExercise: async exercise => {
    const { currentSessionId } = get();
    if (!currentSessionId) {
      return;
    }

    try {
      // exercise_masterに種目を追加/取得
      // まずテンプレートから対応する種目を検索
      const template = exerciseTemplates.find(t => t.id === exercise.id || t.name === exercise.name);
      let exerciseId: number;
      
      if (template) {
        // デフォルト種目の場合、既存のexercise_masterから対応するものを検索
        // 英語名または日本語名でマッチング
        const existingExercise = await DatabaseService.getFirstAsync<any>(
          'SELECT * FROM exercise_master WHERE name_en = ? OR name_ja = ? OR (name_ja = ? AND muscle_group = ?)',
          [template.name, template.name, exercise.name, template.category]
        );
        
        if (existingExercise) {
          exerciseId = existingExercise.exercise_id;
        } else {
          // テンプレート種目だが、exercise_masterに存在しない場合は新規作成
          const maxIdResult = await DatabaseService.getFirstAsync<any>(
            'SELECT MAX(exercise_id) as max_id FROM exercise_master'
          );
          exerciseId = Math.max((maxIdResult?.max_id || 0) + 1, 1000);
          
          await DatabaseService.runAsync(
            'INSERT INTO exercise_master (exercise_id, name_ja, muscle_group) VALUES (?, ?, ?)',
            [
              exerciseId,
              exercise.name,
              template.category,
            ]
          );
        }
      } else {
        // 完全にカスタムな種目の場合
        const existingExerciseByName = await DatabaseService.getFirstAsync<any>(
          'SELECT * FROM exercise_master WHERE name_ja = ?',
          [exercise.name]
        );
        
        if (existingExerciseByName) {
          exerciseId = existingExerciseByName.exercise_id;
        } else {
          const maxIdResult = await DatabaseService.getFirstAsync<any>(
            'SELECT MAX(exercise_id) as max_id FROM exercise_master'
          );
          exerciseId = Math.max((maxIdResult?.max_id || 0) + 1, 1000);
          
          await DatabaseService.runAsync(
            'INSERT INTO exercise_master (exercise_id, name_ja, muscle_group) VALUES (?, ?, ?)',
            [
              exerciseId,
              exercise.name,
              'その他',
            ]
          );
        }
      }

      for (const [index, workoutSet] of exercise.sets.entries()) {
        const result = await DatabaseService.runAsync(
          `INSERT INTO workout_set (
            session_id, exercise_id, set_number, weight_kg, reps, rpe
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            currentSessionId,
            exerciseId,
            index + 1,
            workoutSet.weight || null,
            workoutSet.reps || null,
            workoutSet.rm || null,
          ]
        );
      }

      set(state => {
        const updated = [...state.exercises, exercise];
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
          session_id, exercise_id, set_number, weight_kg, reps, rpe
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [currentSessionId, parseInt(exerciseId), setNumber, 0, 0, null]
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
      field === 'weight' ? 'weight_kg' : field === 'reps' ? 'reps' : 'rpe'; // time と distance は rpe にマッピング（実際のテーブル構造に合わせる）

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
