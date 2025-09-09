# FitMeal Partner - Database Architecture

## Database Technology
- **SQLite** via Expo SQLite for local storage
- **Offline-first** architecture with planned sync to Supabase
- Repository pattern for data access abstraction

## Key Tables Structure

### User Management
- `user_settings` - User preferences, goals, and targets
- `sync_queue` - Tracks pending synchronization operations

### Food & Nutrition
- `food_db` - Master food database (100g normalized nutrition values)
- `food_log` - User's daily food intake records
- Supports barcode lookup, favorites, and search functionality

### Workout & Exercise
- `workout_session` - Workout sessions with metadata
- `workout_set` - Individual sets (weight, reps, RPE)
- `exercise_master` - Exercise definitions with muscle group classification

## Repository Classes
Located in `src/services/database/repositories/`:
- **UserRepository** - User settings, profile, onboarding status
- **FoodRepository** - Food database, logging, nutrition calculations
- **WorkoutRepository** - Exercise tracking, session management, volume calculations

## Database Service
- **DatabaseService** (`src/services/database/DatabaseService.ts`) - Database initialization and migration management
- **DatabaseTest** - Test utilities for validating database operations

## Data Flow
1. **Local-first**: All operations work offline using SQLite
2. **100g Normalization**: Food data stored per 100g, calculated for actual portions
3. **Immediate Calculations**: PFC (Protein/Fat/Carbs) and calories calculated client-side
4. **Sync Queue**: Changes queued for eventual cloud synchronization

## Key Features
- **Full-text search** on food names
- **Barcode indexing** for quick lookup
- **Favorite foods** for one-tap logging
- **Volume calculations** for workout tracking
- **RPE (Rate of Perceived Exertion)** tracking
- **Date-based queries** for daily/weekly/monthly summaries

## Data Integrity
- Foreign key constraints between related tables
- Proper indexing on frequently queried fields (barcode, date, user_id)
- Transaction support for multi-table operations
- Migration system for schema updates