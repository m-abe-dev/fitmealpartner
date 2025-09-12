import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import { NutritionData, UserProfile, FeedbackResponse } from '../_shared/types.ts';

// 言語別のプロンプトを定義
const getSystemPrompt = (language: string) => {
  if (language === 'en') {
    return `
You are an experienced fitness nutrition coach.
Analyze the user's nutritional intake and provide specific, actionable advice in English.

Important Guidelines:
1. Recommend healthy and balanced approaches
2. Avoid extreme restrictions or unhealthy methods
3. Suggest commonly available foods globally (focus on food types rather than specific brands)
4. Maintain a positive and encouraging tone
5. Acknowledge achievements
6. Prioritize immediate actions to supplement lacking nutrients
7. Be concise and clear

Response must be in the following JSON format:
{
  "feedback": "Overall feedback (100-150 characters)",
  "suggestions": ["Suggestion 1 with specific foods", "Suggestion 2", "Suggestion 3"],
  "actionItems": [
    {
      "priority": "high/medium/low",
      "action": "Specific action with food examples",
      "reason": "Reason"
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
あなたは経験豊富なフィットネス栄養コーチです。
ユーザーの栄養摂取状況を分析し、具体的で実行可能なアドバイスを日本語で提供してください。

重要なガイドライン：
1. 健康的でバランスの取れたアプローチを推奨
2. 極端な制限や不健康な方法は避ける
3. 世界中で入手可能な一般的な食材を提案（特定のブランド名ではなく食材の種類を中心に）
4. ポジティブで励みになるトーンを保つ
5. 達成できた部分も認める
6. 不足栄養素を補う即座のアクションを優先
7. 簡潔で分かりやすく

レスポンスは必ず以下の形式のJSONで返してください：
{
  "feedback": "全体的なフィードバック（100-150文字）",
  "suggestions": ["提案1（具体的な食材名を含む）", "提案2", "提案3"],
  "actionItems": [
    {
      "priority": "high/medium/low",
      "action": "具体的なアクション（食材例も含む）",
      "reason": "理由"
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

const getUserPrompt = (nutrition: any, profile: any, language: string) => {
  const proteinAchievement = (nutrition.protein / nutrition.targetProtein) * 100;
  const carbsAchievement = (nutrition.carbs / nutrition.targetCarbs) * 100;
  const fatAchievement = (nutrition.fat / nutrition.targetFat) * 100;
  const caloriesAchievement = (nutrition.calories / nutrition.targetCalories) * 100;
  const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);

  if (language === 'en') {
    return `
User Information:
- Goal: ${profile.goal}
- Age: ${profile.age}, Weight: ${profile.weight}kg, Gender: ${profile.gender}

Today's Nutrition:
- Calories: ${nutrition.calories}kcal / Target ${nutrition.targetCalories}kcal (${caloriesAchievement.toFixed(0)}%)
- Protein: ${nutrition.protein}g / Target ${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%) Gap: ${proteinGap}g
- Carbs: ${nutrition.carbs}g / Target ${nutrition.targetCarbs}g (${carbsAchievement.toFixed(0)}%)
- Fat: ${nutrition.fat}g / Target ${nutrition.targetFat}g (${fatAchievement.toFixed(0)}%)

Meals:
${nutrition.meals.map((m: any) => `- ${m.name}: ${m.calories}kcal (P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`).join('\n')}

Current time is ${new Date().getHours()}:00.

Please provide practical suggestions to supplement lacking nutrients for the remaining time.
Focus on commonly available foods globally.
If protein is significantly lacking (>20g), prioritize protein-rich foods.
`;
  }
  
  // 日本語（デフォルト）
  return `
ユーザー情報：
- 目標: ${profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'}
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg, 性別: ${profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : 'その他'}

今日の栄養摂取状況：
- カロリー: ${nutrition.calories}kcal / 目標${nutrition.targetCalories}kcal (${caloriesAchievement.toFixed(0)}%)
- タンパク質: ${nutrition.protein}g / 目標${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%) 不足${proteinGap}g
- 炭水化物: ${nutrition.carbs}g / 目標${nutrition.targetCarbs}g (${carbsAchievement.toFixed(0)}%)
- 脂質: ${nutrition.fat}g / 目標${nutrition.targetFat}g (${fatAchievement.toFixed(0)}%)

食事内容：
${nutrition.meals.map((m: any) => `- ${m.name}: ${m.calories}kcal (P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`).join('\n')}

現在時刻は${new Date().getHours()}時です。

残りの時間で不足栄養素を補うための実用的な提案をしてください。
世界中で入手可能な一般的な食材を使った提案を心がけてください。
タンパク質が大幅に不足（20g以上）している場合は、タンパク質豊富な食材を優先してください。
`;
};

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { nutrition, profile, language = 'ja' }: { 
      nutrition: NutritionData; 
      profile: UserProfile;
      language?: string;
    } = body;

    // 栄養素の達成率を計算
    const proteinAchievement = (nutrition.protein / nutrition.targetProtein) * 100;
    const carbsAchievement = (nutrition.carbs / nutrition.targetCarbs) * 100;
    const fatAchievement = (nutrition.fat / nutrition.targetFat) * 100;
    const caloriesAchievement = (nutrition.calories / nutrition.targetCalories) * 100;

    // 不足量の計算
    const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
    const calorieGap = Math.max(0, nutrition.targetCalories - nutrition.calories);
    const carbGap = Math.max(0, nutrition.targetCarbs - nutrition.carbs);

    const systemPrompt = getSystemPrompt(language);
    const userPrompt = getUserPrompt(nutrition, profile, language);

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
      actionItems: parsedResponse.actionItems || []
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nutrition-feedback:', error);
    
    // フォールバック処理も言語対応
    const { nutrition, language = 'ja' } = await req.json().catch(() => ({ 
      nutrition: null,
      language: 'ja' 
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
      error: fallbackData.error
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // クライアント側でエラーハンドリング
    });
  }
});