import {
  ExerciseTemplate,
  WorkoutDay,
  Exercise,
  LastRecordSet,
} from '../types/workout.types';

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

export const categories = ['胸', '背中', '脚', '肩', '腕', '有酸素'];

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
