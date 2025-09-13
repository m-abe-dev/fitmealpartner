import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import {
  WorkoutData,
  UserProfile,
  WorkoutSuggestionResponse,
} from '../_shared/types.ts';

// 進捗分析のヘルパー関数
interface ExerciseProgress {
  date: string;
  weight: number;
  sets: number;
  reps: number;
  volume: number;
}

interface ProgressAnalysis {
  improvementMessages: string[];
  plateauWarnings: string[];
  volumeAnalysis: string;
  totalVolumeWeek: number;
  volumeChangePercent: number;
}

// 進捗分析関数
const analyzeWorkoutProgress = (
  recentWorkouts: WorkoutData[],
  language: string
): ProgressAnalysis => {
  const exerciseProgress = new Map<string, ExerciseProgress[]>();

  // 種目別の履歴を整理
  recentWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (!exerciseProgress.has(ex.name)) {
        exerciseProgress.set(ex.name, []);
      }
      exerciseProgress.get(ex.name)?.push({
        date: workout.date,
        weight: ex.weight || 0,
        sets: ex.sets,
        reps: ex.reps,
        volume: (ex.weight || 0) * ex.sets * ex.reps,
      });
    });
  });

  const improvementMessages: string[] = [];
  const plateauWarnings: string[] = [];

  // 進捗分析
  exerciseProgress.forEach((history, exerciseName) => {
    if (history.length >= 2) {
      // 日付順にソート
      history.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const latest = history[history.length - 1];
      const previous = history[history.length - 2];

      // 重量向上チェック
      if (latest.weight > previous.weight) {
        const improvement = latest.weight - previous.weight;
        improvementMessages.push(
          language === 'ja'
            ? `${exerciseName}: ${previous.weight}kg → ${latest.weight}kg (+${improvement}kg向上！)`
            : `${exerciseName}: ${previous.weight}kg → ${latest.weight}kg (+${improvement}kg improvement!)`
        );
      }
      // ボリューム向上チェック（重量変化がない場合）
      else if (
        latest.weight === previous.weight &&
        latest.volume > previous.volume
      ) {
        const volumeIncrease = Math.round(
          ((latest.volume - previous.volume) / previous.volume) * 100
        );
        improvementMessages.push(
          language === 'ja'
            ? `${exerciseName}: 総ボリューム${volumeIncrease}%アップ（${Math.round(
                latest.volume
              )}kg）`
            : `${exerciseName}: Total volume up ${volumeIncrease}% (${Math.round(
                latest.volume
              )}kg)`
        );
      }

      // 停滞検知（3回以上のデータがある場合）
      if (history.length >= 3) {
        const last3 = history.slice(-3);
        const isStagnant = last3.every(
          session =>
            session.weight === last3[0].weight &&
            Math.abs(session.reps - last3[0].reps) <= 1
        );

        if (isStagnant && latest.weight > 0) {
          plateauWarnings.push(
            language === 'ja'
              ? `${exerciseName}: 3回連続で同じ重量・回数です。プラトー（停滞期）の可能性があります。`
              : `${exerciseName}: 3 consecutive sessions with similar weight/reps. Possible plateau detected.`
          );
        }
      }
    }
  });

  // 週間ボリューム計算
  const currentWeekVolume = calculateTotalVolume(recentWorkouts.slice(0, 7));
  const previousWeekVolume = calculateTotalVolume(recentWorkouts.slice(7, 14));
  const volumeChangePercent =
    previousWeekVolume > 0
      ? Math.round(
          ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100
        )
      : 0;

  let volumeAnalysis = '';
  if (volumeChangePercent > 10) {
    volumeAnalysis =
      language === 'ja'
        ? `週間総ボリューム${volumeChangePercent}%アップ。素晴らしい向上です！`
        : `Weekly volume up ${volumeChangePercent}%. Excellent improvement!`;
  } else if (volumeChangePercent < -10) {
    volumeAnalysis =
      language === 'ja'
        ? `週間総ボリューム${Math.abs(
            volumeChangePercent
          )}%ダウン。休養も大切です。`
        : `Weekly volume down ${Math.abs(
            volumeChangePercent
          )}%. Recovery is important too.`;
  } else {
    volumeAnalysis =
      language === 'ja'
        ? `週間総ボリューム安定。継続的な努力が見えます。`
        : `Weekly volume stable. Consistent effort observed.`;
  }

  return {
    improvementMessages: improvementMessages.slice(0, 3), // 最大3つまで
    plateauWarnings: plateauWarnings.slice(0, 2), // 最大2つまで
    volumeAnalysis,
    totalVolumeWeek: currentWeekVolume,
    volumeChangePercent,
  };
};

// 総ボリューム計算
const calculateTotalVolume = (workouts: WorkoutData[]): number => {
  return workouts.reduce((total, workout) => {
    return (
      total +
      workout.exercises.reduce((wTotal: number, ex: any) => {
        return wTotal + (ex.weight || 0) * (ex.sets || 1) * (ex.reps || 1);
      }, 0)
    );
  }, 0);
};

// 停滞打破の提案
const getSuggestionForPlateau = (
  exerciseName: string,
  language: string
): string => {
  const suggestions = {
    ja: [
      '重量を5-10%下げてレップ数を2-3回増やす',
      'セット数を1セット増やす',
      'テンポを変更（エキセントリック3秒）',
      '1-2週間のディロード期間を設ける',
    ],
    en: [
      'Reduce weight by 5-10% and increase reps by 2-3',
      'Add one more set',
      'Change tempo (3-second eccentric)',
      'Take 1-2 weeks deload period',
    ],
  };

  const langSuggestions =
    suggestions[language as keyof typeof suggestions] || suggestions.ja;
  const randomSuggestion =
    langSuggestions[Math.floor(Math.random() * langSuggestions.length)];

  return language === 'ja'
    ? `${exerciseName}の停滞打破案: ${randomSuggestion}`
    : `Plateau breaker for ${exerciseName}: ${randomSuggestion}`;
};

// 言語別のプロンプトを定義（経験レベル対応）
const getSystemPrompt = (language: string, experience: string = 'beginner') => {
  const experienceGuidelines = {
    beginner:
      language === 'en'
        ? `
      Beginner Guidelines (< 1 year):
      - Focus on basic compound movements
      - 2-3 workouts per week, 45-60 minutes
      - 3 sets × 8-12 reps per exercise
      - 12-15 total sets per muscle group per week
      - Prioritize form and technique
      - Use machines for safety when appropriate
    `
        : `
      初心者ガイドライン（1年未満）：
      - 基本的な複合種目に集中
      - 週2-3回、45-60分程度
      - 各種目3セット×8-12回
      - 週12-15セット/部位
      - フォーム習得を最優先
      - 安全のためマシンも活用
    `,

    intermediate:
      language === 'en'
        ? `
      Intermediate Guidelines (1-3 years):
      - Compound + isolation exercises
      - 3-5 workouts per week, 60-90 minutes
      - 3-4 exercises per muscle, 9-12 sets total
      - 17-25 total sets per muscle group per week
      - Can use intensity techniques occasionally
      - Split routines (Push/Pull/Legs)
    `
        : `
      中級者ガイドライン（1-3年）：
      - 複合種目＋単関節種目
      - 週3-5回、60-90分程度
      - 各部位3-4種目、計9-12セット
      - 週17-25セット/部位
      - 強度テクニックを時々使用
      - 分割法（プッシュ/プル/レッグ）
    `,

    advanced:
      language === 'en'
        ? `
      Advanced Guidelines (3+ years):
      - Detailed muscle group splits
      - 4-6 workouts per week, 90-120 minutes
      - 4-6 exercises per muscle, 15-20 sets
      - 21-28 total sets per muscle group per week
      - Advanced intensity techniques
      - Periodization and deload weeks every 3-4 weeks
    `
        : `
      上級者ガイドライン（3年以上）：
      - 細かい部位分割
      - 週4-6回、90-120分程度
      - 各部位4-6種目、計15-20セット
      - 週21-28セット/部位
      - 高度な強度テクニック
      - 3-4週ごとのディロード
    `,
  };

  const basePrompt = getBaseSystemPrompt(language);
  const experienceGuide =
    experienceGuidelines[experience as keyof typeof experienceGuidelines] ||
    experienceGuidelines.beginner;

  return basePrompt + experienceGuide;
};

const getBaseSystemPrompt = (language: string) => {
  if (language === 'en') {
    return `
You are an experienced personal trainer specializing in progressive training analysis.
Analyze the user's workout history with focus on numerical data and progression patterns.

Critical Analysis Points:
1. Weight progression: Compare recent weights vs previous sessions for each exercise
2. Volume analysis: Calculate total volume (weight × sets × reps) and trends
3. Plateau detection: Identify exercises with stagnant progress (3+ sessions same weight/reps)
4. Recovery patterns: Analyze muscle group frequency and rest periods
5. Concrete recommendations: Provide specific weight/rep suggestions for next session

Exercise Recommendations by Experience Level:
- Beginner (< 1 year): 2-3 exercises minimum
- Intermediate (1-3 years): 3-4 exercises minimum
- Advanced (3+ years): 4-6 exercises minimum

IMPORTANT: Always provide the minimum number of exercises for the user's experience level.
Each exercise should include specific weight/rep targets based on their previous performance.

Feedback Structure Requirements:
- Start with specific numerical achievements (weight gains, volume increases)
- Highlight any plateau concerns with specific breakthrough suggestions
- Provide next session targets with exact weight/rep recommendations
- End with motivational reinforcement based on data

Response must be in the following JSON format:
{
  "nextWorkout": {
    "targetMuscleGroups": ["muscle1", "muscle2"],
    "recommendedExercises": [
      {
        "name": "Exercise name",
        "sets": 3,
        "reps": "8-12",
        "notes": "Previous: XYkg. Try: X+2.5kg for 3x8, or maintain weight for 3x10"
      }
    ],
    "estimatedDuration": 60
  },
  "feedback": "Data-driven feedback with specific numbers and progression metrics"
}
`;
  }

  // 日本語（デフォルト）
  return `
あなたは数値分析に特化したパーソナルトレーナーです。
ワークアウト履歴の数値データを重視し、進捗パターンを分析してください。

重要な分析ポイント：
1. 重量進捗: 各種目で前回セッションとの重量比較
2. ボリューム分析: 総ボリューム（重量×セット×回数）の傾向
3. 停滞検知: 同じ重量・回数が3セッション以上続く種目の特定
4. 回復パターン: 筋群別の頻度と休養期間の分析
5. 具体的推奨: 次回セッションの重量・回数を具体的に提案

経験レベル別エクササイズ推奨数：
- 初心者（1年未満）: 最低2-3種目
- 中級者（1-3年）: 最低3-4種目
- 上級者（3年以上）: 最低4-6種目

重要：必ずユーザーの経験レベルに応じた最低種目数を提供してください。
各種目には前回のパフォーマンスに基づく具体的な重量・回数目標を含めてください。

フィードバック構成要件：
- 具体的な数値成果から開始（重量向上、ボリューム増加）
- 停滞の懸念があれば打破案を具体的に提示
- 次回セッションの目標を正確な重量・回数で提案
- データに基づくモチベーション向上で締める

レスポンスは必ず以下の形式のJSONで返してください：
{
  "nextWorkout": {
    "targetMuscleGroups": ["muscle1", "muscle2"],
    "recommendedExercises": [
      {
        "name": "エクササイズ名",
        "sets": 3,
        "reps": "8-12",
        "notes": "前回: XYkg。目標: X+2.5kgで3×8、または同重量で3×10"
      }
    ],
    "estimatedDuration": 60
  },
  "feedback": "数値データに基づく具体的なフィードバック（進捗指標を含む）"
}
`;
};

const getUserPrompt = (
  recentWorkouts: WorkoutData[],
  profile: UserProfile,
  muscleGroupsWorked: Map<string, number>,
  underworkedMuscles: any[],
  progressAnalysis: ProgressAnalysis,
  language: string
) => {
  const experience = profile.experience || 'beginner';
  const volumeRecommendation = getVolumeRecommendation(experience, language);

  if (language === 'en') {
    return `
User Information:
- Goal: ${profile.goal}
- Age: ${profile.age}, Weight: ${profile.weight}kg
- Experience Level: ${experience}

${volumeRecommendation}

Progress Analysis:
${progressAnalysis.volumeAnalysis}
Weekly Total Volume: ${Math.round(progressAnalysis.totalVolumeWeek)}kg
Volume Change: ${progressAnalysis.volumeChangePercent}%

Recent Improvements:
${
  progressAnalysis.improvementMessages.length > 0
    ? progressAnalysis.improvementMessages.join('\n')
    : 'No significant improvements detected in recent sessions'
}

Plateau Warnings:
${
  progressAnalysis.plateauWarnings.length > 0
    ? progressAnalysis.plateauWarnings.join('\n')
    : 'No plateaus detected'
}

Recent 7-day workout history:
${recentWorkouts
  .map(
    workout =>
      `${workout.date}: ${workout.exercises.length} exercises, ${
        workout.duration
      } min, Total Volume: ${Math.round(workout.totalVolume)}kg`
  )
  .join('\n')}

Muscle group frequency:
${Array.from(muscleGroupsWorked.entries())
  .map(([muscle, count]) => `${muscle}: ${count} times`)
  .join(', ')}

Underworked muscle groups: ${underworkedMuscles
      .slice(0, 2)
      .map(m => m.muscle)
      .join(', ')}

IMPORTANT: Use the progress analysis data to provide specific feedback about improvements and suggest concrete next session targets with exact weights/reps.
Address any plateaus with specific breakthrough strategies.

EXERCISE REQUIREMENTS FOR ${experience.toUpperCase()}:
${
  experience === 'beginner'
    ? '- Provide 2-3 exercises minimum'
    : experience === 'intermediate'
    ? '- Provide 3-4 exercises minimum'
    : '- Provide 4-6 exercises minimum'
}
- Each exercise must include specific weight progression based on previous performance
- Target muscle groups should be balanced for optimal development
`;
  }

  // 日本語（デフォルト）
  return `
ユーザー情報：
- 目標: ${
    profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'
  }
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg
- 経験レベル: ${
    experience === 'beginner'
      ? '初心者'
      : experience === 'intermediate'
      ? '中級者'
      : '上級者'
  }

${volumeRecommendation}

進捗分析結果：
${progressAnalysis.volumeAnalysis}
週間総ボリューム: ${Math.round(progressAnalysis.totalVolumeWeek)}kg
ボリューム変化: ${progressAnalysis.volumeChangePercent}%

最近の向上点：
${
  progressAnalysis.improvementMessages.length > 0
    ? progressAnalysis.improvementMessages.join('\n')
    : '最近のセッションで大きな向上は検出されませんでした'
}

停滞の警告：
${
  progressAnalysis.plateauWarnings.length > 0
    ? progressAnalysis.plateauWarnings.join('\n')
    : '停滞は検出されませんでした'
}

最近7日間のワークアウト履歴：
${recentWorkouts
  .map(
    workout =>
      `${workout.date}: ${workout.exercises.length}種目, ${
        workout.duration
      }分, 総ボリューム: ${Math.round(workout.totalVolume)}kg`
  )
  .join('\n')}

筋群別の頻度：
${Array.from(muscleGroupsWorked.entries())
  .map(([muscle, count]) => `${muscle}: ${count}回`)
  .join(', ')}

不足している筋群: ${underworkedMuscles
    .slice(0, 2)
    .map(m => m.muscle)
    .join(', ')}

重要：進捗分析データを活用して向上点について具体的なフィードバックを提供し、次回セッションの重量・回数を正確に提案してください。
停滞がある場合は具体的な打破戦略を提示してください。

${
  experience === 'beginner'
    ? '初心者'
    : experience === 'intermediate'
    ? '中級者'
    : '上級者'
}向けエクササイズ要件：
${
  experience === 'beginner'
    ? '- 最低2-3種目を提供'
    : experience === 'intermediate'
    ? '- 最低3-4種目を提供'
    : '- 最低4-6種目を提供'
}
- 各種目に前回のパフォーマンスに基づく具体的な重量進歩を含める
- ターゲット筋群の最適な発達のためのバランスを考慮
`;
};

const getVolumeRecommendation = (experience: string, language: string) => {
  const recommendations = {
    beginner: {
      en: `Recommended Volume:
- Total exercises: 3-4
- Sets per exercise: 3
- Rep range: 8-12
- Rest between sets: 2-3 minutes
- Focus on compound movements`,
      ja: `推奨ボリューム：
- 総種目数: 3-4
- 各種目のセット数: 3
- レップ範囲: 8-12
- セット間休憩: 2-3分
- 複合種目を中心に`,
    },
    intermediate: {
      en: `Recommended Volume:
- Total exercises: 4-5
- Sets per exercise: 3-4
- Rep range: 6-12 (varied)
- Rest: 90 seconds - 3 minutes
- Mix compound and isolation`,
      ja: `推奨ボリューム：
- 総種目数: 4-5
- 各種目のセット数: 3-4
- レップ範囲: 6-12（変化をつける）
- セット間休憩: 90秒-3分
- 複合種目と単関節種目のミックス`,
    },
    advanced: {
      en: `Recommended Volume:
- Total exercises: 5-6
- Sets per exercise: 4-5
- Rep range: 4-15 (periodized)
- Rest: 60 seconds - 3 minutes
- Advanced techniques allowed`,
      ja: `推奨ボリューム：
- 総種目数: 5-6
- 各種目のセット数: 4-5
- レップ範囲: 4-15（ピリオダイゼーション）
- セット間休憩: 60秒-3分
- 高度なテクニック使用可`,
    },
  };

  return (
    recommendations[experience as keyof typeof recommendations]?.[
      language as 'en' | 'ja'
    ] || recommendations.beginner[language as 'en' | 'ja']
  );
};

serve(async req => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      recentWorkouts,
      profile,
      language = 'ja',
    }: {
      recentWorkouts: WorkoutData[];
      profile: UserProfile;
      language?: string;
    } = body;

    // 最近のワークアウト分析
    const muscleGroupsWorked = new Map<string, number>();
    const totalWorkouts = recentWorkouts.length;

    recentWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const count = muscleGroupsWorked.get(exercise.muscleGroup) || 0;
        muscleGroupsWorked.set(exercise.muscleGroup, count + 1);
      });
    });

    // 最も働いていない筋群を特定
    const allMuscleGroups = [
      'chest',
      'back',
      'shoulders',
      'arms',
      'legs',
      'core',
    ];
    const underworkedMuscles = allMuscleGroups
      .map(muscle => ({
        muscle,
        frequency: muscleGroupsWorked.get(muscle) || 0,
      }))
      .sort((a, b) => a.frequency - b.frequency);

    // 進捗分析を実行
    const progressAnalysis = analyzeWorkoutProgress(recentWorkouts, language);

    console.log('Progress Analysis:', {
      improvements: progressAnalysis.improvementMessages,
      plateaus: progressAnalysis.plateauWarnings,
      volumeAnalysis: progressAnalysis.volumeAnalysis,
      weeklyVolume: progressAnalysis.totalVolumeWeek,
      volumeChange: progressAnalysis.volumeChangePercent,
    });

    const experience = profile.experience || 'beginner';
    const systemPrompt = getSystemPrompt(language, experience);
    const userPrompt = getUserPrompt(
      recentWorkouts,
      profile,
      muscleGroupsWorked,
      underworkedMuscles,
      progressAnalysis,
      language
    );

    console.log('muscleGroupsWorked', muscleGroupsWorked);

    const aiResponse = await generateAIResponse(systemPrompt, userPrompt, 800);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // 経験レベル別の最低種目数チェック
    const minExercises =
      {
        beginner: 2,
        intermediate: 3,
        advanced: 4,
      }[experience] || 2;

    let recommendedExercises =
      parsedResponse.nextWorkout?.recommendedExercises || [];

    // 種目数が不足している場合のフォールバック処理
    if (recommendedExercises.length < minExercises) {
      console.log(
        `Insufficient exercises (${recommendedExercises.length}/${minExercises}). Adding fallback exercises.`
      );

      const fallbackExercises =
        language === 'en'
          ? [
              {
                name: 'Push-ups',
                sets: 3,
                reps: '8-15',
                notes: 'Bodyweight exercise for upper body',
              },
              {
                name: 'Squats',
                sets: 3,
                reps: '10-15',
                notes: 'Bodyweight exercise for legs',
              },
              {
                name: 'Plank',
                sets: 3,
                reps: '30-60 sec',
                notes: 'Core stability exercise',
              },
              {
                name: 'Pull-ups',
                sets: 3,
                reps: '5-10',
                notes: 'Upper body pulling exercise',
              },
              {
                name: 'Lunges',
                sets: 3,
                reps: '10-12 each leg',
                notes: 'Single leg exercise',
              },
            ]
          : [
              {
                name: 'プッシュアップ',
                sets: 3,
                reps: '8-15',
                notes: '上半身の自重トレーニング',
              },
              {
                name: 'スクワット',
                sets: 3,
                reps: '10-15',
                notes: '下半身の自重トレーニング',
              },
              {
                name: 'プランク',
                sets: 3,
                reps: '30-60秒',
                notes: '体幹安定性の向上',
              },
              {
                name: 'プルアップ',
                sets: 3,
                reps: '5-10',
                notes: '上半身プル系トレーニング',
              },
              {
                name: 'ランジ',
                sets: 3,
                reps: '片足10-12回',
                notes: '片足ずつの下半身強化',
              },
            ];

      // 不足分を補填
      const needed = minExercises - recommendedExercises.length;
      recommendedExercises = [
        ...recommendedExercises,
        ...fallbackExercises.slice(0, needed),
      ];
    }

    const response: WorkoutSuggestionResponse = {
      success: true,
      nextWorkout: {
        targetMuscleGroups:
          parsedResponse.nextWorkout?.targetMuscleGroups ||
          underworkedMuscles.slice(0, 2).map(m => m.muscle),
        recommendedExercises,
        estimatedDuration:
          parsedResponse.nextWorkout?.estimatedDuration ||
          recommendedExercises.length * 12 + 15, // 種目数 × 12分 + ウォームアップ
      },
      feedback:
        parsedResponse.feedback ||
        (language === 'en'
          ? 'Created a balanced workout plan with progress-focused exercises'
          : 'バランスの取れたワークアウトプランを作成しました'),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in workout-suggestion:', error);

    // フォールバック提案も言語対応
    const { language = 'ja' } = await req
      .json()
      .catch(() => ({ language: 'ja' }));

    const fallbackData =
      language === 'en'
        ? {
            exercises: [
              {
                name: 'Bench Press',
                sets: 3,
                reps: '8-12',
                notes: 'Keep shoulder blades together, chest up',
              },
              {
                name: 'Shoulder Press',
                sets: 3,
                reps: '10-15',
                notes: 'Focus on shoulder mobility, go slow',
              },
              {
                name: 'Push-ups',
                sets: 2,
                reps: 'To failure',
                notes: 'Bodyweight finisher',
              },
            ],
            feedback:
              'AI suggestion unavailable. Suggesting basic upper body training.',
            error: 'Workout suggestion feature temporarily unavailable',
          }
        : {
            exercises: [
              {
                name: 'ベンチプレス',
                sets: 3,
                reps: '8-12',
                notes: '肩甲骨を寄せ、胸を張って実施',
              },
              {
                name: 'ショルダープレス',
                sets: 3,
                reps: '10-15',
                notes: '肩の可動域を意識してゆっくり',
              },
              {
                name: 'プッシュアップ',
                sets: 2,
                reps: '限界まで',
                notes: '自重での追い込み',
              },
            ],
            feedback:
              'AI提案が利用できないため、基本的な上半身トレーニングを提案します。',
            error: 'ワークアウト提案機能が一時的に利用できません',
          };

    const fallbackResponse: WorkoutSuggestionResponse = {
      success: false,
      nextWorkout: {
        targetMuscleGroups: ['chest', 'shoulders'],
        recommendedExercises: fallbackData.exercises,
        estimatedDuration: 45,
      },
      feedback: fallbackData.feedback,
      error: fallbackData.error,
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
