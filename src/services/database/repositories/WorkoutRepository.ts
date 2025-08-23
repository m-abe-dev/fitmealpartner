import DatabaseService from '../DatabaseService';

export interface Exercise {
  exercise_id: number;
  name_ja: string;
  name_en?: string;
  muscle_group: string;
  equipment: string;
  is_compound: boolean;
}

export interface WorkoutSession {
  session_id?: number;
  user_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  total_volume_kg: number;
  synced?: boolean;
}

export interface WorkoutSet {
  set_id?: number;
  session_id: number;
  exercise_id: number;
  set_number: number;
  weight_kg?: number;
  reps?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  rest_seconds?: number;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: (WorkoutSet & { exercise: Exercise })[];
}

export interface WorkoutSummary {
  date: string;
  total_sets: number;
  total_volume_kg: number;
  total_exercises: number;
  muscle_groups: string[];
  duration_minutes?: number;
}

export interface MuscleGroupVolume {
  muscle_group: string;
  total_sets: number;
  total_volume_kg: number;
  exercises_count: number;
}

class WorkoutRepository {

  // 種目検索（名前での部分一致）
  async searchExercises(query: string, limit: number = 20): Promise<Exercise[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      `SELECT * FROM exercise_master 
       WHERE name_ja LIKE ? OR name_en LIKE ? 
       ORDER BY is_compound DESC, name_ja ASC 
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit]
    ) as Record<string, any>[];
    
    return result.map(row => this.mapRowToExercise(row));
  }

  // 筋肉部位で種目検索
  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      'SELECT * FROM exercise_master WHERE muscle_group = ? ORDER BY is_compound DESC, name_ja ASC',
      [muscleGroup]
    ) as Record<string, any>[];
    
    return result.map(row => this.mapRowToExercise(row));
  }

  // 種目IDで取得
  async getExerciseById(exerciseId: number): Promise<Exercise | null> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getFirstAsync(
      'SELECT * FROM exercise_master WHERE exercise_id = ?',
      [exerciseId]
    ) as Record<string, any> | null;
    
    return result ? this.mapRowToExercise(result) : null;
  }

  // 最近使用した種目を取得
  async getRecentExercises(userId: string, limit: number = 10): Promise<Exercise[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      `SELECT DISTINCT e.* FROM exercise_master e
       INNER JOIN workout_set ws ON e.exercise_id = ws.exercise_id
       INNER JOIN workout_session wss ON ws.session_id = wss.session_id
       WHERE wss.user_id = ?
       ORDER BY wss.date DESC, wss.start_time DESC
       LIMIT ?`,
      [userId, limit]
    ) as Record<string, any>[];
    
    return result.map(row => this.mapRowToExercise(row));
  }

  // 新しい種目を追加
  async addExercise(exercise: Omit<Exercise, 'exercise_id'>): Promise<number> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.runAsync(
      `INSERT INTO exercise_master (name_ja, name_en, muscle_group, equipment, is_compound) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        exercise.name_ja,
        exercise.name_en || null,
        exercise.muscle_group,
        exercise.equipment,
        exercise.is_compound ? 1 : 0
      ]
    );
    
    return result.lastInsertRowId;
  }

  // ワークアウトセッションを開始
  async startWorkoutSession(session: Omit<WorkoutSession, 'session_id' | 'total_volume_kg' | 'synced'>): Promise<number> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.runAsync(
      `INSERT INTO workout_session (user_id, date, start_time, notes) 
       VALUES (?, ?, ?, ?)`,
      [
        session.user_id,
        session.date,
        session.start_time || new Date().toISOString(),
        session.notes || null
      ]
    );
    
    return result.lastInsertRowId;
  }

  // ワークアウトセッションを終了
  async endWorkoutSession(sessionId: number, endTime?: string): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    // トータルボリュームを計算
    const volumeResult = await db.getFirstAsync(
      `SELECT SUM(weight_kg * reps) as total_volume 
       FROM workout_set 
       WHERE session_id = ? AND weight_kg IS NOT NULL AND reps IS NOT NULL`,
      [sessionId]
    ) as { total_volume: number | null } | null;
    
    const totalVolume = volumeResult?.total_volume || 0;
    
    await db.runAsync(
      `UPDATE workout_session 
       SET end_time = ?, total_volume_kg = ?, synced = 0 
       WHERE session_id = ?`,
      [endTime || new Date().toISOString(), totalVolume, sessionId]
    );
  }

  // ワークアウトセッションを更新
  async updateWorkoutSession(sessionId: number, updates: Partial<WorkoutSession>): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    const fields = [];
    const values = [];
    
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.end_time);
    }
    
    if (fields.length > 0) {
      fields.push('synced = 0');
      values.push(sessionId);
      
      await db.runAsync(
        `UPDATE workout_session SET ${fields.join(', ')} WHERE session_id = ?`,
        values
      );
    }
  }

  // セットを追加
  async addWorkoutSet(set: Omit<WorkoutSet, 'set_id'>): Promise<number> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.runAsync(
      `INSERT INTO workout_set (session_id, exercise_id, set_number, weight_kg, reps, rpe, rest_seconds) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        set.session_id,
        set.exercise_id,
        set.set_number,
        set.weight_kg || null,
        set.reps || null,
        set.rpe || null,
        set.rest_seconds || null
      ]
    );
    
    // セッションのトータルボリュームを更新
    await this.updateSessionVolume(set.session_id);
    
    return result.lastInsertRowId;
  }

  // セットを更新
  async updateWorkoutSet(setId: number, updates: Partial<WorkoutSet>): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    // まずセッションIDを取得
    const setData = await db.getFirstAsync(
      'SELECT session_id FROM workout_set WHERE set_id = ?',
      [setId]
    ) as { session_id: number } | null;
    
    if (!setData) throw new Error('Workout set not found');
    
    const fields = [];
    const values = [];
    
    if (updates.weight_kg !== undefined) {
      fields.push('weight_kg = ?');
      values.push(updates.weight_kg);
    }
    if (updates.reps !== undefined) {
      fields.push('reps = ?');
      values.push(updates.reps);
    }
    if (updates.rpe !== undefined) {
      fields.push('rpe = ?');
      values.push(updates.rpe);
    }
    if (updates.rest_seconds !== undefined) {
      fields.push('rest_seconds = ?');
      values.push(updates.rest_seconds);
    }
    
    if (fields.length > 0) {
      values.push(setId);
      
      await db.runAsync(
        `UPDATE workout_set SET ${fields.join(', ')} WHERE set_id = ?`,
        values
      );
      
      // セッションのトータルボリュームを更新
      await this.updateSessionVolume(setData.session_id);
    }
  }

  // セットを削除
  async deleteWorkoutSet(setId: number): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    // まずセッションIDを取得
    const setData = await db.getFirstAsync(
      'SELECT session_id FROM workout_set WHERE set_id = ?',
      [setId]
    ) as { session_id: number } | null;
    
    if (!setData) throw new Error('Workout set not found');
    
    await db.runAsync('DELETE FROM workout_set WHERE set_id = ?', [setId]);
    
    // セッションのトータルボリュームを更新
    await this.updateSessionVolume(setData.session_id);
  }

  // 特定日のワークアウトセッションを取得
  async getWorkoutSessionsByDate(userId: string, date: string): Promise<WorkoutSession[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      'SELECT * FROM workout_session WHERE user_id = ? AND date = ? ORDER BY start_time ASC',
      [userId, date]
    ) as Record<string, any>[];
    
    return result.map(row => this.mapRowToWorkoutSession(row));
  }

  // セッションの詳細（セット含む）を取得
  async getWorkoutSessionWithSets(sessionId: number): Promise<WorkoutSessionWithSets | null> {
    const db = DatabaseService.getDatabase();
    
    const sessionResult = await db.getFirstAsync(
      'SELECT * FROM workout_session WHERE session_id = ?',
      [sessionId]
    ) as Record<string, any> | null;
    
    if (!sessionResult) return null;
    
    const setsResult = await db.getAllAsync(
      `SELECT ws.*, e.* FROM workout_set ws
       INNER JOIN exercise_master e ON ws.exercise_id = e.exercise_id
       WHERE ws.session_id = ?
       ORDER BY ws.exercise_id, ws.set_number`,
      [sessionId]
    ) as Record<string, any>[];
    
    const session = this.mapRowToWorkoutSession(sessionResult);
    const sets = setsResult.map((row: Record<string, any>) => ({
      set_id: row.set_id,
      session_id: row.session_id,
      exercise_id: row.exercise_id,
      set_number: row.set_number,
      weight_kg: row.weight_kg,
      reps: row.reps,
      rpe: row.rpe,
      rest_seconds: row.rest_seconds,
      exercise: this.mapRowToExercise(row)
    }));
    
    return { ...session, sets };
  }

  // 前回の同種目のセットを取得（前回コピー機能用）
  async getLastSetsForExercise(userId: string, exerciseId: number, excludeSessionId?: number): Promise<WorkoutSet[]> {
    const db = DatabaseService.getDatabase();
    
    let query = `
      SELECT ws.* FROM workout_set ws
      INNER JOIN workout_session wss ON ws.session_id = wss.session_id
      WHERE wss.user_id = ? AND ws.exercise_id = ?
    `;
    const params: any[] = [userId, exerciseId];
    
    if (excludeSessionId) {
      query += ' AND ws.session_id != ?';
      params.push(excludeSessionId);
    }
    
    query += ' ORDER BY wss.date DESC, wss.start_time DESC, ws.set_number ASC LIMIT 10';
    
    const result = await db.getAllAsync(query, params) as Record<string, any>[];
    
    return result.map(row => this.mapRowToWorkoutSet(row));
  }

  // 指定期間のワークアウトサマリーを取得
  async getWorkoutSummary(userId: string, startDate: string, endDate: string): Promise<WorkoutSummary[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      `SELECT 
         ws.date,
         COUNT(DISTINCT wset.exercise_id) as total_exercises,
         COUNT(wset.set_id) as total_sets,
         SUM(ws.total_volume_kg) as total_volume_kg,
         GROUP_CONCAT(DISTINCT e.muscle_group) as muscle_groups,
         AVG(
           CASE 
             WHEN ws.start_time IS NOT NULL AND ws.end_time IS NOT NULL 
             THEN (strftime('%s', ws.end_time) - strftime('%s', ws.start_time)) / 60.0
             ELSE NULL
           END
         ) as duration_minutes
       FROM workout_session ws
       LEFT JOIN workout_set wset ON ws.session_id = wset.session_id
       LEFT JOIN exercise_master e ON wset.exercise_id = e.exercise_id
       WHERE ws.user_id = ? AND ws.date BETWEEN ? AND ?
       GROUP BY ws.date
       ORDER BY ws.date ASC`,
      [userId, startDate, endDate]
    ) as Record<string, any>[];
    
    return result.map((row: Record<string, any>) => ({
      date: row.date,
      total_sets: row.total_sets || 0,
      total_volume_kg: row.total_volume_kg || 0,
      total_exercises: row.total_exercises || 0,
      muscle_groups: row.muscle_groups ? row.muscle_groups.split(',') : [],
      duration_minutes: row.duration_minutes ? Math.round(row.duration_minutes) : undefined
    }));
  }

  // 筋肉部位別のボリューム集計
  async getMuscleGroupVolume(userId: string, startDate: string, endDate: string): Promise<MuscleGroupVolume[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      `SELECT 
         e.muscle_group,
         COUNT(wset.set_id) as total_sets,
         SUM(wset.weight_kg * wset.reps) as total_volume_kg,
         COUNT(DISTINCT wset.exercise_id) as exercises_count
       FROM workout_session ws
       INNER JOIN workout_set wset ON ws.session_id = wset.session_id
       INNER JOIN exercise_master e ON wset.exercise_id = e.exercise_id
       WHERE ws.user_id = ? AND ws.date BETWEEN ? AND ?
         AND wset.weight_kg IS NOT NULL AND wset.reps IS NOT NULL
       GROUP BY e.muscle_group
       ORDER BY total_volume_kg DESC`,
      [userId, startDate, endDate]
    ) as Record<string, any>[];
    
    return result.map((row: Record<string, any>) => ({
      muscle_group: row.muscle_group,
      total_sets: row.total_sets || 0,
      total_volume_kg: row.total_volume_kg || 0,
      exercises_count: row.exercises_count || 0
    }));
  }

  // 未同期のワークアウトデータを取得（オフライン対応）
  async getUnsyncedWorkoutSessions(): Promise<WorkoutSession[]> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getAllAsync(
      'SELECT * FROM workout_session WHERE synced = 0 ORDER BY date ASC, start_time ASC'
    ) as Record<string, any>[];
    
    return result.map(row => this.mapRowToWorkoutSession(row));
  }

  // ワークアウトセッションの同期状態を更新
  async markWorkoutSessionAsSynced(sessionId: number): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      'UPDATE workout_session SET synced = 1 WHERE session_id = ?',
      [sessionId]
    );
  }

  // セッションのトータルボリュームを更新（内部使用）
  private async updateSessionVolume(sessionId: number): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    const volumeResult = await db.getFirstAsync(
      `SELECT SUM(weight_kg * reps) as total_volume 
       FROM workout_set 
       WHERE session_id = ? AND weight_kg IS NOT NULL AND reps IS NOT NULL`,
      [sessionId]
    ) as { total_volume: number | null } | null;
    
    const totalVolume = volumeResult?.total_volume || 0;
    
    await db.runAsync(
      'UPDATE workout_session SET total_volume_kg = ?, synced = 0 WHERE session_id = ?',
      [totalVolume, sessionId]
    );
  }

  // データマッピング用のヘルパー関数
  private mapRowToExercise(row: Record<string, any>): Exercise {
    return {
      exercise_id: row.exercise_id,
      name_ja: row.name_ja,
      name_en: row.name_en,
      muscle_group: row.muscle_group,
      equipment: row.equipment,
      is_compound: row.is_compound === 1
    };
  }

  private mapRowToWorkoutSession(row: Record<string, any>): WorkoutSession {
    return {
      session_id: row.session_id,
      user_id: row.user_id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      notes: row.notes,
      total_volume_kg: row.total_volume_kg,
      synced: row.synced === 1
    };
  }

  private mapRowToWorkoutSet(row: Record<string, any>): WorkoutSet {
    return {
      set_id: row.set_id,
      session_id: row.session_id,
      exercise_id: row.exercise_id,
      set_number: row.set_number,
      weight_kg: row.weight_kg,
      reps: row.reps,
      rpe: row.rpe,
      rest_seconds: row.rest_seconds
    };
  }
}

export default new WorkoutRepository();