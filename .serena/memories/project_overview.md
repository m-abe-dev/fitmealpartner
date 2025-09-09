# FitMeal Partner - Project Overview

## Purpose
FitMeal Partner is a React Native mobile application designed for fitness enthusiasts who want to track their nutrition and workout data in an integrated way. The app focuses on providing immediate feedback on nutritional deficiencies and specific workout recommendations rather than meal planning.

## Key Features
- **Food Logging**: Barcode scanning, search functionality, favorites, and nutritional analysis
- **Workout Tracking**: Set recording (weight/reps/RPE), exercise management, volume tracking
- **Dashboard**: Real-time scoring system, progress visualization, AI-powered feedback
- **Offline-first**: Uses SQLite for local storage with sync capabilities
- **Internationalization**: Built with i18next for Japanese/English support

## Target Users
- 20-40 year old fitness enthusiasts
- Train 2-5 times per week
- Mix of home cooking and convenience store meals
- Data-driven approach to fitness

## Business Model
- Freemium model with Pro subscription (¥980/月)
- Free tier: 5 food entries/day, 30 days history, today's dashboard only
- Pro tier: Unlimited entries, full history, weekly/monthly analytics, enhanced AI feedback

## Technical Architecture
- Local-first with SQLite database
- AI feedback limited to short advice generation
- Minimal backend using Supabase for sync and AI processing
- Revenue management through RevenueCat