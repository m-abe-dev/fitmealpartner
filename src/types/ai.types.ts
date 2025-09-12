export * from './shared';
import { FeedbackResponse, WorkoutSuggestionResponse } from './shared';

export interface AIFeedbackState {
  isLoading: boolean;
  nutritionFeedback?: FeedbackResponse;
  workoutSuggestion?: WorkoutSuggestionResponse;
  lastUpdated?: Date;
  error?: string;
}
