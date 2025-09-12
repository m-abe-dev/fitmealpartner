import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import { NutritionData, UserProfile, FeedbackResponse } from '../_shared/types.ts';

// 拡張されたシステムプロンプト（時間帯と文脈を考慮）
const getEnhancedSystemPrompt = (language: string, context: any) => {
  const { currentHour, mealCount, hasYesterdayData, yesterdayAchievement } = context;
  if (language === 'en') {
    return `
You are an experienced fitness nutrition coach providing context-aware feedback.

Current Context:
- Time: ${currentHour}:00
- Meals logged today: ${mealCount}
- Yesterday's performance: ${hasYesterdayData ? `${yesterdayAchievement}% achieved` : 'No data'}

Feedback Guidelines:
1. TIME-BASED ADVICE:
   - Morning (6-10): Focus on starting strong, setting daily foundation
   - Midday (11-14): Assess progress, adjust afternoon strategy
   - Afternoon (15-18): Plan dinner to meet remaining targets
   - Evening (19-22): Focus on completion or damage control

2. MEAL PROGRESSION:
   - 0 meals: Reference yesterday's data if available, provide morning start guidance
   - 1 meal: Analyze breakfast quality, project daily needs
   - 2 meals: Mid-day checkpoint, calculate dinner requirements precisely
   - 3+ meals: Focus on fine-tuning or next day preparation

3. YESTERDAY'S INFLUENCE:
   - If perfect (>95%): "Yesterday was perfect! Keep the momentum"
   - If lacking: "Yesterday's gap - compensate today"
   - If over: "Yesterday's excess - moderate today"

Response format:
{
  "feedback": "Contextual main message (100-150 chars)",
  "suggestions": ["Time-appropriate suggestion 1", "Suggestion 2", "Suggestion 3"],
  "actionItems": [
    {
      "priority": "high/medium/low",
      "action": "Specific time-sensitive action",
      "reason": "Why this matters now"
    }
  ]
}

Food Suggestions:
- Protein: Chicken breast, fish, eggs, Greek yogurt, beans, tofu
- Carbs: Brown rice, oatmeal, whole grain bread, fruits, sweet potatoes
- Healthy fats: Nuts, avocado, olive oil, seeds
- Quick energy: Bananas, energy bars, dried fruits, nuts
`;
  }
  
  // 日本語（デフォルト）
  return `
あなたは経験豊富なフィットネス栄養コーチです。時間帯と状況に応じた的確なアドバイスを提供してください。

現在の状況：
- 現在時刻: ${currentHour}時
- 今日の食事回数: ${mealCount}回
- 昨日の達成率: ${hasYesterdayData ? `${yesterdayAchievement}%` : 'データなし'}

フィードバックガイドライン：
1. 時間帯別アドバイス：
   - 朝 (6-10時): 「朝のタンパク質は吸収率が高い。目標の25%以上を狙いましょう」
   - 昼 (11-14時): 「午後のエネルギー確保。進捗確認と午後の戦略調整」
   - 午後 (15-18時): 「夕食で目標達成への道筋を。残り必要量を正確に計算」
   - 夜 (19-22時): 「消化の良いタンパク質源で仕上げ。明日への準備も」

2. 食事回数による分析：
   - 0食: ${hasYesterdayData ? '昨日のデータを参考に朝食の重要性を強調' : '朝食から良いスタートを'}
   - 1食: 朝食の質を評価し、残り2食での配分を提案
   - 2食: 中間チェックポイント。夕食で必要な栄養素を正確に提示
   - 3食以上: 微調整または翌日への準備

3. 昨日との比較：
   ${hasYesterdayData ? `
   - 完璧達成時 (>95%): 「昨日はPFCバランス完璧！今日も同じペースで」
   - 不足時: 「昨日のタンパク質不足分、今日の朝食でリカバリー」
   - 過剰時: 「昨日の脂質オーバー分、今日は控えめに」
   ` : ''}

レスポンス形式：
{
  "feedback": "時間と状況に応じたメインメッセージ（100-150文字）",
  "suggestions": ["時間帯に適した提案1", "提案2", "提案3"],
  "actionItems": [
    {
      "priority": "high/medium/low",
      "action": "今すぐ実行可能な具体的アクション",
      "reason": "なぜ今これが重要か"
    }
  ]
}

食材の提案例：
- タンパク質源：鶏胸肉、魚、卵、ギリシャヨーグルト、豆類、豆腐、納豆
- 炭水化物源：玄米、オートミール、全粒粉パン、果物、さつまいも
- 健康的な脂質：ナッツ類、アボカド、オリーブオイル、種子類
- クイックエネルギー：バナナ、エナジーバー、ドライフルーツ、ナッツ
`;
};

const getEnhancedUserPrompt = (nutrition: any, profile: any, context: any, language: string) => {
  const { currentHour, mealCount, yesterdayData } = context;
  const timeOfDay = currentHour < 10 ? 'morning' : currentHour < 14 ? 'midday' : currentHour < 18 ? 'afternoon' : 'evening';
  const proteinAchievement = (nutrition.protein / nutrition.targetProtein) * 100;
  const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
  const remainingHours = Math.max(0, 22 - currentHour);

  if (language === 'en') {
    return `
User Information:
- Goal: ${profile.goal}
- Age: ${profile.age}, Weight: ${profile.weight}kg

Current Status (${timeOfDay}):
- Time: ${currentHour}:00 (${remainingHours} hours until bedtime)
- Meals consumed: ${mealCount} ${mealCount === 0 ? '(no meals yet - focus on starting strong)' : ''}
- Protein: ${nutrition.protein}g / ${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%)
- Remaining protein needed: ${proteinGap}g

${yesterdayData ? `
Yesterday's Performance:
- Protein: ${yesterdayData.protein}g / ${yesterdayData.targetProtein}g
- Achievement: ${yesterdayData.achievement}%
- ${yesterdayData.achievement > 95 ? 'Perfect execution!' : `Gap: ${yesterdayData.gap}g`}
` : ''}

Meals Today:
${nutrition.meals.map((m: any) => `- ${m.name}: ${m.calories}kcal (P:${m.protein}g)`).join('\n')}

${mealCount === 0 ? 
  'No meals logged yet. Provide morning motivation and concrete first meal suggestions.' :
  mealCount === 1 ? 
  'One meal logged. Analyze breakfast quality and plan remaining day.' :
  mealCount === 2 ?
  'Two meals logged. Calculate precise dinner requirements.' :
  'Multiple meals logged. Focus on fine-tuning or next day prep.'
}

Provide time-appropriate, actionable advice considering remaining hours and meal opportunities.`;
  }
  
  // 日本語（デフォルト）
  return `
ユーザー情報：
- 目標: ${profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'}
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg

現在の状況（${
  timeOfDay === 'morning' ? '朝' : 
  timeOfDay === 'midday' ? '昼' : 
  timeOfDay === 'afternoon' ? '午後' : '夜'
}）：
- 時刻: ${currentHour}時（就寝まで約${remainingHours}時間）
- 食事回数: ${mealCount}回 ${mealCount === 0 ? '（まだ食事なし - 良いスタートを切ることが重要）' : ''}
- タンパク質: ${nutrition.protein}g / ${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%)
- 残り必要量: ${proteinGap}g

${yesterdayData ? `
昨日の実績：
- タンパク質: ${yesterdayData.protein}g / ${yesterdayData.targetProtein}g
- 達成率: ${yesterdayData.achievement}%
- ${yesterdayData.achievement > 95 ? '完璧な達成！' : `不足: ${yesterdayData.gap}g`}
` : ''}

今日の食事：
${nutrition.meals.map((m: any) => `- ${m.name}: ${m.calories}kcal (P:${m.protein}g)`).join('\n')}

${mealCount === 0 ? 
  '食事記録なし。朝の動機付けと具体的な朝食提案を提供。' :
  mealCount === 1 ? 
  '朝食済み。朝食の質を評価し、残りの食事計画を提案。' :
  mealCount === 2 ?
  '2食済み。夕食で必要な栄養素を正確に計算して提示。' :
  '複数食済み。微調整または翌日への準備に焦点。'
}

残り時間と食事機会を考慮した、時間帯に適したアクションを提案してください。`;
};

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      nutrition, 
      profile, 
      language = 'ja',
      yesterdayData,  // 新規: 昨日のデータ
      mealCount = 0   // 新規: 今日の食事回数
    }: { 
      nutrition: NutritionData; 
      profile: UserProfile;
      language?: string;
      yesterdayData?: any;
      mealCount?: number;
    } = body;

    // コンテキスト情報の準備
    const currentHour = new Date().getHours();
    const context = {
      currentHour,
      mealCount,
      yesterdayData,
      hasYesterdayData: !!yesterdayData,
      yesterdayAchievement: yesterdayData?.achievement || 0
    };

    // 拡張されたプロンプトを使用
    const systemPrompt = getEnhancedSystemPrompt(language, context);
    const userPrompt = getEnhancedUserPrompt(nutrition, profile, context, language);

    const aiResponse = await generateAIResponse(systemPrompt, userPrompt, 600);
    
    // JSONレスポンスをパース（エラー処理付き）
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    const response: FeedbackResponse = {
      success: true,
      feedback: parsedResponse.feedback || (language === 'en' ? 'Analyzed nutrition balance' : '栄養バランスを分析しました'),
      suggestions: parsedResponse.suggestions || [],
      actionItems: parsedResponse.actionItems || [],
      context: {
        timeOfDay: context.currentHour < 10 ? 'morning' : 
                   context.currentHour < 14 ? 'midday' : 
                   context.currentHour < 18 ? 'afternoon' : 'evening',
        mealCount: context.mealCount,
        hasYesterdayData: context.hasYesterdayData
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nutrition-feedback:', error);
    
    // フォールバック処理も言語対応
    const { nutrition, language = 'ja', mealCount = 0 } = await req.json().catch(() => ({ 
      nutrition: null,
      language: 'ja',
      mealCount: 0
    }));
    

    const fallbackData = language === 'en' ? {
      feedback: 'Analyzing nutrition balance. Keep tracking to achieve your goals!',
      proteinShortage: (gap: number) => `You're about ${Math.round(gap)}g short on protein. Add high-protein foods.`,
      suggestions: [
        'Add chicken breast (about 25g protein per 100g)',
        'Protein shake or Greek yogurt (15-20g)',
        'Include eggs or tofu (10-15g protein)'
      ],
      calorieShortage: [
        'Banana with nut butter',
        'Whole grain bread with avocado',
        'Mixed nuts and dried fruits'
      ],
      defaultSuggestions: [
        'Focus on protein-rich foods for nutrition',
        'Stay hydrated (aim for 2L daily)',
        'Consistent tracking is key to success'
      ],
      action: {
        priority: 'high' as const,
        action: 'Add protein-rich foods to your next meal',
        reason: 'Support muscle recovery and growth'
      },
      defaultAction: {
        priority: 'medium' as const,
        action: 'Focus on protein in your next meal',
        reason: 'Improve nutrition balance'
      },
      error: 'AI analysis temporarily unavailable'
    } : {
      feedback: '栄養バランスを確認中です。記録を継続して目標達成を目指しましょう！',
      proteinShortage: (gap: number) => `タンパク質が約${Math.round(gap)}g不足しています。高タンパク食材で補いましょう。`,
      suggestions: [
        '鶏胸肉を追加（100gあたり約25gのタンパク質）',
        'プロテインシェイクまたはギリシャヨーグルト（15-20g）',
        '卵や豆腐を活用（10-15gのタンパク質）'
      ],
      calorieShortage: [
        'バナナとナッツバター',
        '全粒粉パンとアボカド',
        'ミックスナッツとドライフルーツ'
      ],
      defaultSuggestions: [
        'タンパク質を含む食品で栄養補給',
        '水分補給を忘れずに（1日2L目安）',
        '食事記録の継続が成功への第一歩'
      ],
      action: {
        priority: 'high' as const,
        action: 'タンパク質豊富な食材を次の食事に追加',
        reason: '筋肉の回復と成長をサポート'
      },
      defaultAction: {
        priority: 'medium' as const,
        action: '次の食事でタンパク質を意識',
        reason: '栄養バランスの改善'
      },
      error: 'AI分析が一時的に利用できません'
    };

    let fallbackFeedback = fallbackData.feedback;
    
    // 型を明示的に指定
    const fallbackSuggestions: string[] = [];
    const fallbackActions: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      reason: string;
    }> = [];

    if (nutrition) {
      const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
      const calorieGap = Math.max(0, nutrition.targetCalories - nutrition.calories);

      if (proteinGap > 20) {
        fallbackFeedback = fallbackData.proteinShortage(proteinGap);
        fallbackSuggestions.push(...fallbackData.suggestions);
        fallbackActions.push(fallbackData.action);
      } else if (calorieGap > 200) {
        fallbackFeedback = language === 'en' 
          ? 'Calories are slightly low. Let\'s balance your nutrition.' 
          : 'カロリーがやや不足気味です。バランスよく栄養補給しましょう。';
        fallbackSuggestions.push(...fallbackData.calorieShortage);
      }
    }

    if (fallbackSuggestions.length === 0) {
      fallbackSuggestions.push(...fallbackData.defaultSuggestions);
    }

    if (fallbackActions.length === 0) {
      fallbackActions.push(fallbackData.defaultAction);
    }

    const fallbackResponse: FeedbackResponse = {
      success: false,
      feedback: fallbackFeedback,
      suggestions: fallbackSuggestions,
      actionItems: fallbackActions,
      context: {
        timeOfDay: 'morning',
        mealCount: mealCount,
        hasYesterdayData: false
      },
      error: fallbackData.error
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // クライアント側でエラーハンドリング
    });
  }
});