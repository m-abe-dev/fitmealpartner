# FitMeal Partner - Codebase Structure

## Project Root
```
/
├── App.tsx                 # Main app entry point
├── index.ts               # Expo entry point
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── babel.config.js        # Babel configuration with path aliases
├── app.json              # Expo app configuration
├── CLAUDE.md             # Project requirements and specifications
└── README.md             # Project documentation
```

## Source Code Organization (/src)
```
src/
├── components/           # Reusable UI components
│   └── common/          # Shared components (Button, Card, Input, etc.)
├── design-system/       # Design tokens and theme
│   ├── colors.ts        # Color palette with nutrition-specific colors
│   ├── typography.ts    # Font configurations
│   ├── spacing.ts       # Spacing constants
│   ├── shadows.ts       # Shadow definitions
│   └── radius.ts        # Border radius values
├── screens/             # Screen components organized by feature
│   ├── dashboard/       # Dashboard and analytics
│   ├── nutrition/       # Food logging and nutrition tracking
│   ├── workout/         # Exercise logging and workout tracking
│   ├── profile/         # User profile and settings
│   └── onboarding/      # User onboarding flow
├── navigation/          # Navigation configuration
├── hooks/               # Custom React hooks
├── stores/              # Zustand state management
├── services/            # Business logic and external integrations
│   └── database/        # SQLite database layer
│       └── repositories/ # Data access layer
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── constants/           # App constants
└── data/               # Static data and mock data
```

## Path Aliases (configured in babel.config.js and tsconfig.json)
- `@/*` → `src/*`
- `@components/*` → `src/components/*`  
- `@screens/*` → `src/screens/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`
- `@types/*` → `src/types/*`
- `@constants/*` → `src/constants/*`
- `@design-system` → `src/design-system`

## Key Architecture Patterns
- **Feature-based organization**: Each major feature (nutrition, workout, dashboard) has its own directory with components, types, and data
- **Repository pattern**: Database access is abstracted through repository classes
- **Custom hooks**: Business logic is extracted into reusable hooks
- **Design system**: Centralized theme and component library
- **Service layer**: External integrations and complex business logic separated from UI