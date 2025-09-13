import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import {
  WorkoutData,
  UserProfile,
  WorkoutSuggestionResponse,
} from '../_shared/types.ts';
import { 
  getWorkoutPrompts, 
  getSupportedLanguage, 
  formatProgressMessage 
} from '../_shared/prompts/workout-prompts.ts';
import { getFallbackMessages } from '../_shared/prompts/fallback-messages.ts';

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
  const prompts = getWorkoutPrompts(language);
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
          formatProgressMessage(prompts.progressMessages.weightImprovement, {
            exerciseName,
            prevWeight: previous.weight,
            currentWeight: latest.weight,
            improvement,
          })
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
          formatProgressMessage(prompts.progressMessages.volumeImprovement, {
            exerciseName,
            volumeIncrease,
            volume: Math.round(latest.volume),
          })
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
            formatProgressMessage(prompts.progressMessages.plateauWarning, {
              exerciseName,
            })
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
    volumeAnalysis = formatProgressMessage(
      prompts.progressMessages.volumeAnalysis.increase,
      { percent: volumeChangePercent }
    );
  } else if (volumeChangePercent < -10) {
    volumeAnalysis = formatProgressMessage(
      prompts.progressMessages.volumeAnalysis.decrease,
      { percent: Math.abs(volumeChangePercent) }
    );
  } else {
    volumeAnalysis = prompts.progressMessages.volumeAnalysis.stable;
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
  const prompts = getWorkoutPrompts(language);
  const suggestions = prompts.plateauSuggestions;
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

  return language === 'ja'
    ? `${exerciseName}の停滞打破案: ${randomSuggestion}`
    : `Plateau breaker for ${exerciseName}: ${randomSuggestion}`;
};

// 言語別のプロンプトを定義（経験レベル対応）
const getSystemPrompt = (language: string, experience: string = 'beginner') => {
  const prompts = getWorkoutPrompts(language);
  const experienceGuide = prompts.experienceGuidelines[experience as keyof typeof prompts.experienceGuidelines] ||
    prompts.experienceGuidelines.beginner;

  return prompts.systemBase + experienceGuide;
};


const getUserPrompt = (
  recentWorkouts: WorkoutData[],
  profile: UserProfile,
  muscleGroupsWorked: Map<string, number>,
  underworkedMuscles: any[],
  progressAnalysis: ProgressAnalysis,
  language: string
) => {
  const prompts = getWorkoutPrompts(language);
  const experience = profile.experience || 'beginner';
  const volumeRecommendation = prompts.volumeRecommendations[experience as keyof typeof prompts.volumeRecommendations] ||
    prompts.volumeRecommendations.beginner;

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
${prompts.exerciseRequirements[experience as keyof typeof prompts.exerciseRequirements] ||
  prompts.exerciseRequirements.beginner}
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
${prompts.exerciseRequirements[experience as keyof typeof prompts.exerciseRequirements] ||
  prompts.exerciseRequirements.beginner}
- 各種目に前回のパフォーマンスに基づく具体的な重量進歩を含める
- ターゲット筋群の最適な発達のためのバランスを考慮
`;
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

      const fallbackMessages = getFallbackMessages(language);
      const fallbackExercises = fallbackMessages.exercises;

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
        getFallbackMessages(language).successFeedback,
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

    const fallbackMessages = getFallbackMessages(language);
    const fallbackData = {
      exercises: fallbackMessages.exercises.slice(5, 8), // ベンチプレス、ショルダープレス、プッシュアップ
      feedback: fallbackMessages.feedback,
      error: fallbackMessages.error,
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
