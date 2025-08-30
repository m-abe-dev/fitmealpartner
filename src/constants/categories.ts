export const DEFAULT_CATEGORIES = {
  ja: ['胸', '背中', '脚', '肩', '腕', '腹筋', '有酸素'],
  en: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs', 'Cardio'],
} as const;

export const CATEGORY_MAPPINGS = {
  Chest: '胸',
  Back: '背中',
  Legs: '脚',
  Shoulders: '肩',
  Arms: '腕',
  Cardio: '有酸素',
  Abs: '腹筋',
  未分類: 'その他',
} as const;
