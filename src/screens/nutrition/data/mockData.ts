import { Food, FoodLogItem } from '../types/nutrition.types';

// モック食品データベース
export const mockFoodDatabase: Food[] = [
  { id: '1', name: '鶏胸肉（皮なし）', calories: 108, protein: 22, fat: 2, carbs: 0 },
  { id: '2', name: '白米（炊飯済み）', calories: 156, protein: 3, fat: 0, carbs: 37 },
  { id: '3', name: 'ブロッコリー', calories: 33, protein: 4, fat: 0, carbs: 5 },
  { id: '4', name: 'ホエイプロテイン', calories: 117, protein: 24, fat: 2, carbs: 2 },
  { id: '5', name: 'バナナ', calories: 89, protein: 1, fat: 0, carbs: 23 },
  { id: '6', name: '卵', calories: 151, protein: 12, fat: 11, carbs: 1 },
  { id: '7', name: 'サーモン', calories: 142, protein: 20, fat: 6, carbs: 0 },
  { id: '8', name: 'アーモンド', calories: 579, protein: 21, fat: 50, carbs: 22 },
];

// モック食事履歴
export const mockFoodHistory: Food[] = [
  { id: '1', name: '鶏胸肉（皮なし）', calories: 108, protein: 22, fat: 2, carbs: 0 },
  { id: '4', name: 'ホエイプロテイン', calories: 117, protein: 24, fat: 2, carbs: 2 },
  { id: '5', name: 'バナナ', calories: 89, protein: 1, fat: 0, carbs: 23 },
];

// モックお気に入り食品
export const mockFavoritesFoods: Food[] = [
  { id: '1', name: '鶏胸肉（皮なし）', calories: 108, protein: 22, fat: 2, carbs: 0, isFavorite: true },
  { id: '4', name: 'ホエイプロテイン', calories: 117, protein: 24, fat: 2, carbs: 2, isFavorite: true },
];

// モック食事ログ
export const mockFoodLog: FoodLogItem[] = [
  {
    id: '1',
    foodId: '1',
    name: '鶏胸肉（皮なし）',
    calories: 108,
    protein: 22,
    fat: 2,
    carbs: 0,
    amount: 100,
    unit: 'g',
    meal: 'lunch',
    time: '12:30',
    isFavorite: true,
  },
  {
    id: '2',
    foodId: '4',
    name: 'ホエイプロテイン',
    calories: 117,
    protein: 24,
    fat: 2,
    carbs: 2,
    amount: 30,
    unit: 'g',
    meal: 'breakfast',
    time: '07:00',
    isFavorite: true,
  },
  {
    id: '3',
    foodId: '2',
    name: '白米（炊飯済み）',
    calories: 156,
    protein: 3,
    fat: 0,
    carbs: 37,
    amount: 150,
    unit: 'g',
    meal: 'lunch',
    time: '12:30',
  },
];