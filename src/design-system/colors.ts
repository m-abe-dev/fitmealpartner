import { ColorPalette } from './types';

export const colors: ColorPalette = {
  primary: {
    main: '#3B82F6', // Figmaの青色
    light: '#60A5FA',
    dark: '#2563EB',
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  secondary: {
    main: '#10B981', // 緑色
    light: '#34D399',
    dark: '#059669',
  },
  accent: {
    yellow: '#FFC107',
    orange: '#FF9800',
    red: '#FF6B6B',
    purple: '#8B5CF6',
  },
  nutrition: {
    protein: '#10B981', // 緑
    fat: '#8B5CF6', // 紫
    carbs: '#FF9800', // オレンジ
    calories: '#3B82F6', // 青
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F3F4F6',
    tertiary: '#F9FAFB',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
};