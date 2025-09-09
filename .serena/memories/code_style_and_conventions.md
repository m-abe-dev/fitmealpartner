# FitMeal Partner - Code Style & Conventions

## Language & Typing
- **TypeScript** is used throughout the project with strict mode enabled
- All components, functions, and data structures should be properly typed
- Avoid `any` types - use proper interfaces and type definitions
- Type definitions are stored in `/src/types/` and feature-specific `types/` directories

## File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`, `MealLogCard.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useNutritionData.ts`)
- **Services**: PascalCase with "Service" suffix (e.g., `DatabaseService.ts`)
- **Utilities**: camelCase (e.g., `nutritionScoring.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `nutrition.types.ts`)

## Component Structure
- Functional components with TypeScript interfaces for props
- Use React hooks for state and lifecycle management
- Export default for main component, named exports for utilities
- Organize imports: React/React Native first, then third-party, then local imports

## Code Organization Patterns
- **Feature-based structure**: Group related files by feature rather than file type
- **Barrel exports**: Use `index.ts` files to create clean import paths
- **Separation of concerns**: Keep UI components separate from business logic
- **Custom hooks**: Extract reusable logic into custom hooks

## Naming Conventions
- **Variables/Functions**: camelCase (e.g., `getUserProfile`, `nutritionData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PROTEIN_TARGET`)
- **Interfaces/Types**: PascalCase (e.g., `UserProfile`, `NutritionData`)
- **Database fields**: snake_case to match SQLite conventions

## Comments & Documentation
- Use JSDoc comments for public APIs and complex functions
- Japanese comments are acceptable for domain-specific logic
- Document complex business logic and calculations
- Keep comments concise and focused on "why" rather than "what"

## State Management (Zustand)
- Store files follow pattern: `use[Feature]Store.ts` (e.g., `useNutritionStore.ts`)
- Keep stores focused on specific domains
- Use immer for immutable updates when needed
- Actions should be clearly named and documented

## Database Conventions
- **Table names**: snake_case (e.g., `food_log`, `workout_session`)
- **Column names**: snake_case (e.g., `user_id`, `created_at`)
- **Repository methods**: camelCase (e.g., `getFoodLogsByDate`)
- Use proper foreign key relationships and indexes

## Error Handling
- Use try/catch blocks for async operations
- Provide meaningful error messages
- Log errors appropriately without exposing sensitive information
- Graceful fallbacks for non-critical failures

## Import/Export Style
- Use named imports/exports where possible
- Group imports logically (React, libraries, local)
- Use path aliases consistently (@components, @services, etc.)
- Avoid deep relative imports (../../../)