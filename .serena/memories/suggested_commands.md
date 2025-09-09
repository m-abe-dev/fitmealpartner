# FitMeal Partner - Essential Commands

## Development Commands
```bash
# Start development server
npm start

# Platform-specific development
npm run android     # Start Android development
npm run ios         # Start iOS development  
npm run web         # Start web development

# Install dependencies
npm install
```

## Code Quality & Testing
```bash
# Run linting
npm run lint

# Run tests (Jest configured but no test files currently present)
npm test
```

## Project Navigation
```bash
# Navigate to project root
cd /Users/abemasashi/Desktop/fitmealpartner

# Key directories to know
cd src/                    # Main source code
cd src/components/common/  # Reusable UI components
cd src/screens/           # Screen components
cd src/services/database/ # Database layer
cd src/design-system/     # Design tokens
```

## Useful System Commands (macOS)
```bash
# Search for files
find . -name "*.tsx" -type f    # Find all TypeScript React files
find . -name "*.ts" -type f     # Find all TypeScript files

# Search within files  
grep -r "searchterm" src/       # Search for text in source files
grep -r "interface" src/types/  # Find interface definitions

# File operations
ls -la                          # List files with details
cat filename.ts                 # Display file contents
head -20 filename.ts            # Show first 20 lines
```

## Git Operations
```bash
# Current branch status
git status
git branch

# Common operations
git add .
git commit -m "description"
git push origin branch-name

# View recent commits
git log --oneline -10
```

## Database Investigation (if needed)
```bash
# The app uses SQLite - database files are typically in:
# iOS Simulator: ~/Library/Developer/CoreSimulator/Devices/[device-id]/data/Containers/Data/Application/[app-id]/Documents/
# Android Emulator: Usually handled through Expo's database tools
```

## When Task is Complete
After making changes, always run:
1. `npm run lint` - Check code style and catch potential issues
2. `npm test` - Run tests (when tests are added)
3. Test the app manually using `npm start`

## Important Notes
- The project uses Expo managed workflow
- SQLite database is initialized on first app launch
- Uses TypeScript strict mode - ensure all types are properly defined
- Path aliases are configured - use @components, @services, etc. for imports