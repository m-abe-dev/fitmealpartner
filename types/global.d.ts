// Global type declarations for path aliases
declare module '@design-system' {
  export const colors: any;
  export const typography: any;
  export const spacing: any;
  export const shadows: any;
  export const radius: any;
}

// Re-export design system for better IDE support
declare module '@design-system/index' {
  export * from '@design-system';
}

declare module '@design-system/colors' {
  export const colors: any;
}

declare module '@design-system/typography' {
  export const typography: any;
}

declare module '@design-system/spacing' {
  export const spacing: any;
}

declare module '@design-system/shadows' {
  export const shadows: any;
}

declare module '@design-system/radius' {
  export const radius: any;
}

declare module '@components/*' {
  const value: any;
  export default value;
}

declare module '@screens/*' {
  const value: any;
  export default value;
}

declare module '@services/*' {
  const value: any;
  export default value;
}

declare module '@utils/*' {
  const value: any;
  export default value;
}

declare module '@types/*' {
  const value: any;
  export default value;
}

declare module '@constants/*' {
  const value: any;
  export default value;
}