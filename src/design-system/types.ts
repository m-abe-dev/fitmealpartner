// Type definitions for design system

export interface ColorPalette {
  primary: {
    main: string;
    light: string;
    dark: string;
    50: string;
    100: string;
    200: string;
    300: string;
    500: string;
    600: string;
    700: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
  };
  accent: {
    yellow: string;
    orange: string;
    red: string;
    purple: string;
  };
  nutrition: {
    protein: string;
    fat: string;
    carbs: string;
    calories: string;
  };
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface Typography {
  fontFamily: {
    regular: string | undefined;
    medium: string | undefined;
    semibold: string | undefined;
    bold: string | undefined;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface Spacing {
  xxxs: number;
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface Radius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  full: number;
}

export interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export interface Shadows {
  sm: ShadowStyle | undefined;
  md: ShadowStyle | undefined;
  lg: ShadowStyle | undefined;
  xl: ShadowStyle | undefined;
}