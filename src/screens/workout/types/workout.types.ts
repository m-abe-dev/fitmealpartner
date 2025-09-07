export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rm?: number; // Calculated 1RM
  time?: number; // Time in minutes for cardio
  distance?: number; // Distance in km for cardio
}

export interface Exercise {
  id: string;
  name: string;
  category?: string; // muscle_group from database
  sets: WorkoutSet[];
  isExpanded: boolean;
  type?: 'strength' | 'cardio'; // Exercise type
  targetMuscles?: string[]; // 追加: ターゲット筋群の配列
}

export type WorkoutView = 'main' | 'exercise-selection' | 'exercise-detail';

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
}

export interface LastRecordSet {
  set: number;
  weight: number;
  reps: number;
}

export interface WorkoutDay {
  date: number;
  exercises: {
    name: string;
    sets: { 
      setNumber: number; 
      weight: number; 
      reps: number;
      time?: number;
      distance?: number;
    }[];
    totalSets: number;
    totalReps: number;
    maxWeight: number;
    targetMuscles?: string[]; // 追加
  }[];
  totalSets: number;
  score: number;
}

export interface SetInputs {
  id: number;
  weight: string;
  reps: string;
  time: string;
  distance: string;
}

// WorkoutSessionインターフェースも追加
export interface WorkoutSession {
  date: string;
  exercises: Exercise[];
  duration?: number;
  totalVolume?: number;
}
