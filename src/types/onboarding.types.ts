export interface ProfileData {
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  height: number; // cm
  weight: number; // kg
}

export interface GoalData {
  goal: 'cut' | 'bulk' | 'maintain';
  targetWeight?: number;
  targetDate?: string;
}

export interface WorkoutHabitsData {
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  environment: 'home' | 'gym' | 'studio';
  experience: 'beginner' | 'intermediate' | 'advanced';
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