import { colors } from '../design-system';

export const getGoalText = (goal: string): string => {
  switch (goal) {
    case 'cut': return '減量';
    case 'bulk': return '増量';
    case 'maintain': return '維持';
    default: return '未設定';
  }
};

export const getGoalColor = (goal: string): string => {
  switch (goal) {
    case 'cut': return colors.status.error;
    case 'bulk': return colors.status.success;
    case 'maintain': return colors.primary.main;
    default: return colors.text.secondary;
  }
};

export const getActivityLevelText = (level: string): string => {
  switch (level) {
    case 'sedentary': return '座りがち（運動なし）';
    case 'light': return '軽い活動（週1-3回）';
    case 'moderate': return '中程度（週3-5回）';
    case 'active': return '活発（週6-7回）';
    case 'very-active': return '非常に活発（1日2回）';
    default: return '未設定';
  }
};

export const getBMIStatus = (bmi: number): { status: string; color: string } => {
  if (bmi < 18.5) return { status: '低体重', color: colors.status.warning };
  if (bmi < 25) return { status: '標準', color: colors.status.success };
  if (bmi < 30) return { status: '肥満（軽度）', color: colors.status.warning };
  return { status: '肥満（重度）', color: colors.status.error };
};

export const getNutritionBadgeText = (currentWeight: number, targetWeight: number): string => {
  return Math.abs(targetWeight - currentWeight) > 0.1 
    ? (targetWeight < currentWeight ? '減量用' : '増量用')
    : '維持用';
};