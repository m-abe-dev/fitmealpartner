# FitMeal Partner - Task Completion Checklist

## Code Quality Checks
When completing any coding task, ensure you:

### 1. Code Quality & Style
- [ ] Run `npm run lint` to check for linting errors
- [ ] Ensure TypeScript strict mode compliance (no `any` types)
- [ ] Follow established naming conventions (camelCase, PascalCase as appropriate)
- [ ] Use proper path aliases (@components, @services, etc.)
- [ ] Add appropriate TypeScript interfaces/types

### 2. Testing & Validation
- [ ] Run `npm test` (when tests are present)
- [ ] Test the changes manually using `npm start`
- [ ] Verify functionality on both the feature and integration level
- [ ] Check that database operations work correctly (if applicable)
- [ ] Ensure no console errors or warnings

### 3. Documentation & Comments
- [ ] Add JSDoc comments for complex functions
- [ ] Update relevant documentation if API changes were made
- [ ] Ensure code is self-documenting with clear variable/function names
- [ ] Add comments for complex business logic or calculations

### 4. Database Changes (if applicable)
- [ ] Test database migration scripts
- [ ] Verify repository methods work correctly
- [ ] Check that indexes and foreign keys are properly set
- [ ] Test offline functionality and data integrity

### 5. Integration Checks
- [ ] Verify state management updates work correctly
- [ ] Test navigation flows if screens were modified
- [ ] Check that design system components are used consistently
- [ ] Ensure internationalization keys are added for new text

### 6. Performance Considerations
- [ ] Avoid unnecessary re-renders
- [ ] Use proper React hooks dependencies
- [ ] Optimize database queries
- [ ] Check that offline-first architecture is maintained

### 7. Final Review
- [ ] Review changed files for any accidentally committed debug code
- [ ] Ensure no sensitive information (API keys, etc.) is exposed
- [ ] Verify that error handling is appropriate
- [ ] Check that the changes align with project requirements in CLAUDE.md

## Pre-commit Commands
```bash
npm run lint          # Fix linting issues
npm test             # Run tests (when available)
npm start            # Manual testing
```

## Common Issues to Watch For
- Forgetting to add TypeScript types for new data structures
- Not using path aliases for imports
- Adding hardcoded strings instead of internationalization keys
- Breaking offline-first functionality with API dependencies
- Not following the established repository pattern for database access