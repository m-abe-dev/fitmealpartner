import { useState, useCallback, useEffect } from 'react';
import { Exercise, WorkoutSet } from '../screens/workout/types/workout.types';
import DatabaseService from '../services/database/DatabaseService';

export const useWorkoutData = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // 起動時にSQLiteからデータを読み込み
  useEffect(() => {
    initializeWorkoutSession();
  }, []);

  const initializeWorkoutSession = async () => {
    try {
      await DatabaseService.initialize();
      
      // 今日のセッションを取得または作成
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      console.log('🏋️ ワークアウトセッション初期化:', dateString);
      
      // 既存セッション確認
      let session = await DatabaseService.getFirstAsync<any>(
        'SELECT * FROM workout_session WHERE date = ? AND user_id = ? ORDER BY session_id DESC LIMIT 1',
        [dateString, 'guest']
      );

      if (!session) {
        // 新規セッション作成
        const result = await DatabaseService.runAsync(
          'INSERT INTO workout_session (user_id, date, start_time) VALUES (?, ?, ?)',
          ['guest', dateString, new Date().toISOString()]
        );
        setCurrentSessionId(result.lastInsertRowId as number);
        console.log('📝 新規セッション作成:', result.lastInsertRowId);
      } else {
        setCurrentSessionId(session.session_id);
        console.log('📖 既存セッション使用:', session.session_id);
        await loadWorkoutData(session.session_id);
      }
    } catch (error) {
      console.error('セッション初期化エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkoutData = async (sessionId: number) => {
    try {
      // セットデータを取得
      const sets = await DatabaseService.getAllAsync<any>(
        `SELECT ws.*, em.name_ja as exercise_name, em.muscle_group 
         FROM workout_set ws
         LEFT JOIN exercise_master em ON ws.exercise_id = em.exercise_id
         WHERE ws.session_id = ?
         ORDER BY ws.exercise_id, ws.set_number`,
        [sessionId]
      );

      console.log('📊 ワークアウトデータ読み込み:', sets.length, '件');

      // Exercise形式に変換
      const exerciseMap = new Map<number, Exercise>();
      
      sets.forEach((set: any) => {
        if (!exerciseMap.has(set.exercise_id)) {
          exerciseMap.set(set.exercise_id, {
            id: set.exercise_id.toString(),
            name: set.exercise_name || `Exercise ${set.exercise_id}`,
            type: 'strength',
            sets: [],
            isExpanded: false,
            category: set.muscle_group || '未分類'
          });
        }

        const exercise = exerciseMap.get(set.exercise_id)!;
        exercise.sets.push({
          id: set.set_id.toString(),
          weight: set.weight_kg || 0,
          reps: set.reps || 0,
          rm: set.rpe,
        });
      });

      setExercises(Array.from(exerciseMap.values()));
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    }
  };

  const addSet = useCallback(async (exerciseId: string) => {
    if (!currentSessionId) return;

    try {
      const exercise = exercises.find(e => e.id === exerciseId);
      if (!exercise) return;

      const setNumber = exercise.sets.length + 1;
      
      console.log('➕ セット追加:', { exerciseId, setNumber });
      
      const result = await DatabaseService.runAsync(
        'INSERT INTO workout_set (session_id, exercise_id, set_number, weight_kg, reps) VALUES (?, ?, ?, ?, ?)',
        [currentSessionId, parseInt(exerciseId), setNumber, 0, 0]
      );

      const newSet = {
        id: result.lastInsertRowId?.toString() || Date.now().toString(),
        weight: 0,
        reps: 0,
        rm: undefined
      };

      setExercises(prev => prev.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      ));
    } catch (error) {
      console.error('セット追加エラー:', error);
    }
  }, [currentSessionId, exercises]);

  const updateSet = useCallback(async (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'time' | 'distance', value: string) => {
    const numericValue = parseFloat(value) || 0;
    
    try {
      // SQLite更新
      const columnName = field === 'weight' ? 'weight_kg' : field === 'reps' ? 'reps' : field;
      await DatabaseService.runAsync(
        `UPDATE workout_set SET ${columnName} = ? WHERE set_id = ?`,
        [numericValue, parseInt(setId)]
      );

      console.log('✏️ セット更新:', { setId, field, value: numericValue });

      // 1RM計算
      const calculateRM = (weight: number, reps: number): number | undefined => {
        if (weight <= 0 || reps <= 0) return undefined;
        return Math.round(weight * (1 + reps / 30));
      };

      // ローカル状態更新
      setExercises(prev => prev.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(set =>
                set.id === setId
                  ? {
                      ...set,
                      [field]: numericValue,
                      rm: (field === 'weight' || field === 'reps') 
                        ? calculateRM(
                            field === 'weight' ? numericValue : set.weight,
                            field === 'reps' ? numericValue : set.reps
                          )
                        : set.rm,
                    }
                  : set
              )
            }
          : ex
      ));
    } catch (error) {
      console.error('セット更新エラー:', error);
    }
  }, []);

  const deleteSet = useCallback(async (exerciseId: string, setId: string) => {
    try {
      await DatabaseService.runAsync(
        'DELETE FROM workout_set WHERE set_id = ?',
        [parseInt(setId)]
      );

      console.log('🗑️ セット削除:', setId);

      setExercises(prev => prev.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      ));
    } catch (error) {
      console.error('セット削除エラー:', error);
    }
  }, []);

  const addExercise = useCallback(async (newExercise: Exercise) => {
    if (!currentSessionId) return;

    try {
      console.log('🆕 種目追加:', newExercise.name);
      
      // 種目マスタに追加または取得
      let exerciseMaster = await DatabaseService.getFirstAsync<any>(
        'SELECT * FROM exercise_master WHERE name_ja = ?',
        [newExercise.name]
      );

      if (!exerciseMaster) {
        const maxId = await DatabaseService.getFirstAsync<any>(
          'SELECT MAX(exercise_id) as max_id FROM exercise_master'
        );
        const newId = (maxId?.max_id || 0) + 1;
        
        await DatabaseService.runAsync(
          'INSERT INTO exercise_master (exercise_id, name_ja, muscle_group) VALUES (?, ?, ?)',
          [newId, newExercise.name, newExercise.category || '未分類']
        );
        
        exerciseMaster = { exercise_id: newId };
      }

      // セットを保存
      for (let i = 0; i < newExercise.sets.length; i++) {
        const set = newExercise.sets[i];
        await DatabaseService.runAsync(
          'INSERT INTO workout_set (session_id, exercise_id, set_number, weight_kg, reps, rpe) VALUES (?, ?, ?, ?, ?, ?)',
          [currentSessionId, exerciseMaster.exercise_id, i + 1, set.weight || 0, set.reps || 0, set.rm]
        );
      }

      // ローカル状態に追加
      const exerciseWithId = {
        ...newExercise,
        id: exerciseMaster.exercise_id.toString()
      };
      setExercises(prev => [...prev, exerciseWithId]);
    } catch (error) {
      console.error('種目追加エラー:', error);
    }
  }, [currentSessionId]);

  const toggleExerciseExpansion = useCallback((exerciseId: string) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, isExpanded: !ex.isExpanded }
        : ex
    ));
  }, []);

  const deleteExercise = useCallback(async (exerciseId: string) => {
    try {
      // 関連するセットをすべて削除
      await DatabaseService.runAsync(
        'DELETE FROM workout_set WHERE session_id = ? AND exercise_id = ?',
        [currentSessionId, parseInt(exerciseId)]
      );

      console.log('🗑️ 種目削除:', exerciseId);

      setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('種目削除エラー:', error);
    }
  }, [currentSessionId]);

  // Legacy methods for compatibility
  const updateExercises = useCallback((newExercises: Exercise[]) => {
    setExercises(newExercises);
  }, []);

  const updateExercise = useCallback((exerciseId: string, updates: Partial<Exercise>) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ));
  }, []);

  return {
    exercises,
    isLoading,
    updateExercises,
    updateExercise,
    addSet,
    updateSet,
    deleteSet,
    deleteExercise,
    addExercise,
    toggleExerciseExpansion
  };
};