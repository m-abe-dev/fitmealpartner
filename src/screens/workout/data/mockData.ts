import {
  ExerciseTemplate,
  WorkoutDay,
  Exercise,
  LastRecordSet,
} from '../types/workout.types';

export const exerciseTemplates: ExerciseTemplate[] = [
  // Chest exercises
  { id: 'incline-bench-press', name: 'Incline Bench Press', category: 'Chest' },
  { id: 'bench-press', name: 'Bench Press', category: 'Chest' },
  { id: 'chest-fly', name: 'Chest Fly', category: 'Chest' },
  { id: 'cable-crossover', name: 'Cable Crossover', category: 'Chest' },
  { id: 'push-ups', name: 'Push up', category: 'Chest' },
  { id: 'dumbbell-press', name: 'Dumbbell Press', category: 'Chest' },

  // Legs exercises
  { id: 'squat', name: 'Squat', category: 'Legs' },
  { id: 'deadlift', name: 'Deadlift', category: 'Legs' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs' },
  { id: 'lunges', name: 'Lunges', category: 'Legs' },
  { id: 'leg-curls', name: 'Leg Curls', category: 'Legs' },
  { id: 'calf-raises', name: 'Calf Raises', category: 'Legs' },

  // Shoulders exercises
  { id: 'shoulder-press', name: 'Shoulder Press', category: 'Shoulders' },
  { id: 'lateral-raises', name: 'Lateral Raises', category: 'Shoulders' },
  { id: 'front-raises', name: 'Front Raises', category: 'Shoulders' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', category: 'Shoulders' },
  { id: 'upright-rows', name: 'Upright Rows', category: 'Shoulders' },

  // Arms exercises
  { id: 'bicep-curls', name: 'Bicep Curls', category: 'Arms' },
  { id: 'tricep-dips', name: 'Tricep Dips', category: 'Arms' },
  { id: 'hammer-curls', name: 'Hammer Curls', category: 'Arms' },
  { id: 'tricep-pushdowns', name: 'Tricep Pushdowns', category: 'Arms' },
  { id: 'preacher-curls', name: 'Preacher Curls', category: 'Arms' },

  // Back exercises
  { id: 'pull-ups', name: 'Pull-ups', category: 'Back' },
  { id: 'lat-pulldowns', name: 'Lat Pulldowns', category: 'Back' },
  { id: 'rows', name: 'Rows', category: 'Back' },
  { id: 'T-bar-rows', name: 'T-bar Rows', category: 'Back' },
  { id: 'face-pulls', name: 'Face Pulls', category: 'Back' },

  // Cardio exercises
  { id: 'treadmill-running', name: 'トレッドミル', category: '有酸素' },
  { id: 'cycling', name: 'サイクリング', category: '有酸素' },
  { id: 'elliptical', name: 'エリプティカル', category: '有酸素' },
  { id: 'rowing-machine', name: 'ローイングマシン', category: '有酸素' },
  { id: 'stair-climber', name: 'ステアクライマー', category: '有酸素' },
  { id: 'jump-rope', name: '縄跳び', category: '有酸素' },
  { id: 'swimming', name: '水泳', category: '有酸素' },
  { id: 'hiking', name: 'ハイキング', category: '有酸素' },
  { id: 'dancing', name: 'ダンス', category: '有酸素' },
  { id: 'boxing', name: 'ボクシング', category: '有酸素' },
];

export const workoutHistory: WorkoutDay[] = [
  {
    date: 3,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { setNumber: 1, weight: 75, reps: 10 },
          { setNumber: 2, weight: 80, reps: 8 },
          { setNumber: 3, weight: 80, reps: 7 },
        ],
        totalSets: 3,
        totalReps: 25,
        maxWeight: 80,
      },
    ],
    totalSets: 3,
    score: 85,
  },
  {
    date: 5,
    exercises: [
      {
        name: 'Squat',
        sets: [
          { setNumber: 1, weight: 90, reps: 10 },
          { setNumber: 2, weight: 100, reps: 8 },
          { setNumber: 3, weight: 100, reps: 7 },
          { setNumber: 4, weight: 95, reps: 7 },
        ],
        totalSets: 4,
        totalReps: 32,
        maxWeight: 100,
      },
    ],
    totalSets: 4,
    score: 92,
  },
];

export const initialExercises: Exercise[] = [
  {
    id: '1',
    name: 'Incline Bench Press',
    isExpanded: true,
    sets: [
      { id: '1-1', weight: 65.0, reps: 3, rm: 69.88 },
      { id: '1-2', weight: 65.0, reps: 3, rm: 69.88 },
      { id: '1-3', weight: 60.0, reps: 7, rm: 70.5 },
    ],
  },
  {
    id: '2',
    name: 'Smith Machine Incline',
    isExpanded: true,
    sets: [
      { id: '2-1', weight: 40.0, reps: 10, rm: 50.0 },
      { id: '2-2', weight: 45.0, reps: 5, rm: 50.63 },
      { id: '2-3', weight: 45.0, reps: 4, rm: 50.63 },
    ],
  },
];

export const mockLastRecord: LastRecordSet[] = [
  { set: 1, weight: 15.0, reps: 10 },
  { set: 2, weight: 25.0, reps: 12 },
  { set: 3, weight: 35.0, reps: 6 },
  { set: 4, weight: 35.0, reps: 5 },
  { set: 5, weight: 35.0, reps: 5 },
];

export const categories = [
  'Chest',
  'Legs',
  'Shoulders',
  'Arms',
  'Back',
  '有酸素',
];

export const monthNames = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];
