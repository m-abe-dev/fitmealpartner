export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rm?: number; // Calculated 1RM
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  isExpanded: boolean;
}

export type WorkoutView = "main" | "exercise-selection" | "exercise-detail";

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
    sets: { setNumber: number; weight: number; reps: number; }[];
    totalSets: number;
    totalReps: number;
    maxWeight: number;
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