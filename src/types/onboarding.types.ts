export interface ProfileData {
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  height: number; // cm
  weight: number; // kg
}

export interface GoalData {
  goal: 'cut' | 'bulk' | 'maintain';
  priority: 'strength' | 'physique' | 'health';
  timeframe: '3months' | '6months' | '1year';
  targetWeight?: number; // kg
}

export interface WorkoutHabitsData {
  frequency: number; // 週何回
  environment: 'home' | 'gym' | 'both';
  experience: 'beginner' | 'intermediate' | 'advanced';
  preferredDays: string[]; // ['monday', 'wednesday', 'friday']
}

export interface OnboardingData {
  profile: ProfileData;
  goal: GoalData;
  workoutHabits: WorkoutHabitsData;
  completedAt?: Date;
}

export interface OnboardingStepProps {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  currentData?: Partial<OnboardingData>;
}