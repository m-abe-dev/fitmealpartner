export interface ScoreData {
  period: string;
  nutrition_score: number;
  training_score: number;
  total_score: number;
  details: {
    nutrition: string;
    training: string;
  };
}

export interface ChartData {
  x: string;
  y: number;
  volume?: number;
  calories?: number;
}

export interface AIFeedback {
  type: 'nutrition' | 'training' | 'general';
  message: string;
  severity: 'info' | 'warning' | 'success';
  action?: string;
}

export interface AIAction {
  icon: string;
  title: string;
  subtitle: string;
  action: string;
}

export interface PeriodAIData {
  period: string;
  feedback: AIFeedback[];
  actions: AIAction[];
}

export interface StatsData {
  weightChange: string;
  weightTrend: string;
  trendType: 'success' | 'warning' | 'primary';
  avgVolume: string;
  volumeTrend: string;
  workoutCount: string;
  workoutTarget: string;
  avgScore: string;
  scoreTrend: string;
  avgCalories: string;
  caloriesTrend: string;
  avgProtein: string;
  proteinTrend: string;
  avgFoodCount: string;
  foodTrend: string;
}

export interface PeriodData {
  period: string;
  weightData: ChartData[];
  caloriesData: ChartData[];
  volumeData: ChartData[];
  stats: StatsData;
}

export interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}