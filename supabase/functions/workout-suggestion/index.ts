import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import { WorkoutData, UserProfile, WorkoutSuggestionResponse } from '../_shared/types.ts';

// 言語別のプロンプトを定義
const getSystemPrompt = (language: string) => {
  if (language === 'en') {
    return `
You are an experienced personal trainer.
Analyze the user's recent workout history and suggest the next training plan.

Important Guidelines:
1. Consider muscle balance and recovery
2. Tailor suggestions to user goals (cut/bulk/maintain)
3. Practical and executable exercises
4. Use equipment commonly available in gyms globally
5. Adjustable from beginner to advanced levels

Response must be in the following JSON format:
{
  "nextWorkout": {
    "targetMuscleGroups": ["muscle1", "muscle2"],
    "recommendedExercises": [
      {
        "name": "Exercise name",
        "sets": 3,
        "reps": "8-12",
        "notes": "Form tips, etc."
      }
    ],
    "estimatedDuration": 60
  },
  "feedback": "Workout plan explanation (about 100 characters)"
}
`;
  }
  
  // 日本語（デフォルト）
  return `
あなたは経験豊富なパーソナルトレーナーです。
ユーザーの最近のワークアウト履歴を分析し、次回のトレーニングプランを提案してください。

重要なガイドライン：
1. 筋肉のバランスと回復を考慮
2. ユーザーの目標（減量/増量/維持）に適した提案
3. 実用的で実行可能なエクササイズ
4. 日本のジムで一般的な器具を使用
5. 初心者から上級者まで調整可能な内容

レスポンスは必ず以下の形式のJSONで返してください：
{
  "nextWorkout": {
    "targetMuscleGroups": ["muscle1", "muscle2"],
    "recommendedExercises": [
      {
        "name": "エクササイズ名",
        "sets": 3,
        "reps": "8-12",
        "notes": "フォームのポイント等"
      }
    ],
    "estimatedDuration": 60
  },
  "feedback": "ワークアウトプランの説明（100文字程度）"
}
`;
};

const getUserPrompt = (recentWorkouts: WorkoutData[], profile: UserProfile, muscleGroupsWorked: Map<string, number>, underworkedMuscles: any[], language: string) => {
  if (language === 'en') {
    return `
User Information:
- Goal: ${profile.goal}
- Age: ${profile.age}, Weight: ${profile.weight}kg

Recent 7-day workout history:
${recentWorkouts.map(workout => 
  `${workout.date}: ${workout.exercises.length} exercises, ${workout.duration} min, Main areas: ${workout.exercises.map(e => e.muscleGroup).join(', ')}`
).join('\n')}

Muscle group frequency:
${Array.from(muscleGroupsWorked.entries()).map(([muscle, count]) => `${muscle}: ${count} times`).join(', ')}

Underworked muscle groups: ${underworkedMuscles.slice(0, 2).map(m => m.muscle).join(', ')}

Please suggest a balanced next workout plan.
Prioritize underworked muscle groups and consider appropriate recovery.
`;
  }
  
  // 日本語（デフォルト）
  return `
ユーザー情報：
- 目標: ${profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'}
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg

最近7日間のワークアウト履歴：
${recentWorkouts.map(workout => 
  `${workout.date}: ${workout.exercises.length}種目, ${workout.duration}分, 主要部位: ${workout.exercises.map(e => e.muscleGroup).join(', ')}`
).join('\n')}

筋群別の頻度：
${Array.from(muscleGroupsWorked.entries()).map(([muscle, count]) => `${muscle}: ${count}回`).join(', ')}

不足している筋群: ${underworkedMuscles.slice(0, 2).map(m => m.muscle).join(', ')}

バランスの取れた次回のワークアウトプランを提案してください。
特に働いていない筋群を優先し、適切な休養も考慮してください。
`;
};

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      recentWorkouts, 
      profile,
      language = 'ja'
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
    const allMuscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    const underworkedMuscles = allMuscleGroups
      .map(muscle => ({
        muscle,
        frequency: muscleGroupsWorked.get(muscle) || 0
      }))
      .sort((a, b) => a.frequency - b.frequency);

    const systemPrompt = getSystemPrompt(language);
    const userPrompt = getUserPrompt(recentWorkouts, profile, muscleGroupsWorked, underworkedMuscles, language);

    const aiResponse = await generateAIResponse(systemPrompt, userPrompt, 800);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    const response: WorkoutSuggestionResponse = {
      success: true,
      nextWorkout: parsedResponse.nextWorkout || {
        targetMuscleGroups: underworkedMuscles.slice(0, 2).map(m => m.muscle),
        recommendedExercises: [],
        estimatedDuration: 60
      },
      feedback: parsedResponse.feedback || (
        language === 'en' 
          ? 'Created a balanced workout plan'
          : 'バランスの取れたワークアウトプランを作成しました'
      )
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in workout-suggestion:', error);
    
    // フォールバック提案も言語対応
    const { language = 'ja' } = await req.json().catch(() => ({ language: 'ja' }));

    const fallbackData = language === 'en' ? {
      exercises: [
        {
          name: 'Bench Press',
          sets: 3,
          reps: '8-12',
          notes: 'Keep shoulder blades together, chest up'
        },
        {
          name: 'Shoulder Press',
          sets: 3,
          reps: '10-15',
          notes: 'Focus on shoulder mobility, go slow'
        },
        {
          name: 'Push-ups',
          sets: 2,
          reps: 'To failure',
          notes: 'Bodyweight finisher'
        }
      ],
      feedback: 'AI suggestion unavailable. Suggesting basic upper body training.',
      error: 'Workout suggestion feature temporarily unavailable'
    } : {
      exercises: [
        {
          name: 'ベンチプレス',
          sets: 3,
          reps: '8-12',
          notes: '肩甲骨を寄せ、胸を張って実施'
        },
        {
          name: 'ショルダープレス',
          sets: 3,
          reps: '10-15',
          notes: '肩の可動域を意識してゆっくり'
        },
        {
          name: 'プッシュアップ',
          sets: 2,
          reps: '限界まで',
          notes: '自重での追い込み'
        }
      ],
      feedback: 'AI提案が利用できないため、基本的な上半身トレーニングを提案します。',
      error: 'ワークアウト提案機能が一時的に利用できません'
    };

    const fallbackResponse: WorkoutSuggestionResponse = {
      success: false,
      nextWorkout: {
        targetMuscleGroups: ['chest', 'shoulders'],
        recommendedExercises: fallbackData.exercises,
        estimatedDuration: 45
      },
      feedback: fallbackData.feedback,
      error: fallbackData.error
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});