// 通知関連の型定義

export interface NotificationData {
  type: 'protein_reminder' | 'workout_reminder' | 'test';
  screen?: 'Nutrition' | 'Workout' | 'Dashboard' | 'Profile';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  proteinGap?: number;
}

// 通知データの型ガード
export function isNotificationData(data: unknown): data is NotificationData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as any).type === 'string' &&
    ['protein_reminder', 'workout_reminder', 'test'].includes((data as any).type)
  );
}

// より安全な通知データの型
export interface SafeNotificationData {
  type: 'protein_reminder' | 'workout_reminder' | 'test';
  screen?: 'Nutrition' | 'Workout' | 'Dashboard' | 'Profile';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  proteinGap?: number;
}

export interface NavigationParams {
  fromNotification?: boolean;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  proteinGap?: number;
}

// React Navigation用の画面パラメータ型
export type RootStackParamList = {
  Dashboard: NavigationParams | undefined;
  Nutrition: NavigationParams | undefined;
  Workout: NavigationParams | undefined;
  Profile: NavigationParams | undefined;
};