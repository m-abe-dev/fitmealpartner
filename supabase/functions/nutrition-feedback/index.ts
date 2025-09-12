import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import {
  NutritionData,
  UserProfile,
  FeedbackResponse,
} from '../_shared/types.ts';

// 拡張されたシステムプロンプト（時間帯と文脈を考慮）
const getEnhancedSystemPrompt = (language: string, context: any) => {
  const { currentHour, mealCount, hasYesterdayData, yesterdayAchievement } =
    context;

  if (language === 'en') {
    return `
You are an experienced fitness nutrition coach providing comprehensive, encouraging feedback.

Current Context:
- Time: ${currentHour}:00
- Meals logged today: ${mealCount}
- Yesterday's performance: ${
      hasYesterdayData ? `${yesterdayAchievement}% achieved` : 'No data'
    }

Feedback Structure (Must include all 4 elements):
1. [STATUS EVALUATION] Current strengths and improvement areas
   - Strengths: "Excellent 30g protein at breakfast!" "On track for daily goal"
   - Areas: "40g protein needed, but dinner can easily cover this"

2. [NUMERICAL ANALYSIS] Clear target gaps and achievement rates
   - Achievement percentage, remaining needs, time availability

3. [CONCRETE SUGGESTIONS] Immediately actionable advice
   - Immediate, preparatory, and habit-building suggestions

4. [MOTIVATION] Positive encouragement and progress recognition
   - Yesterday comparison, progress acknowledgment, achievability emphasis

Time-based Strategy:
- Morning (6-10): "Foundation setting, breakfast importance, daily outlook"
- Midday (11-14): "Progress assessment, afternoon strategy, achievement building"
- Afternoon (15-18): "Final adjustments, specific dinner planning"
- Evening (19-22): "Daily wrap-up, tomorrow preparation, today's reflection"

Response format:
{
  "feedback": "[EVALUATION] achievement% achieved! strengths. improvements. [MOTIVATION] encouragement (120-160 chars)",
  "suggestions": [
    "[IMMEDIATE] specific food and amount",
    "[PREPARE] next meal suggestion",
    "[HABIT] long-term improvement"
  ],
  "actionItems": [
    {
      "priority": "high",
      "action": "[NOW] specific action",
      "reason": "[BENEFIT] expected result"
    }
  ]
}

Example Patterns:
- On track: "85% achieved! 30g from breakfast - excellent start. Need 20g more for dinner completion. 5g improvement from yesterday - steady progress!"
- Behind: "40% achieved, but no worries! Dinner opportunity ahead. 40g needed but 150g chicken breast covers it. Yesterday's dinner comeback was amazing!"

Food Suggestions:
- Protein: Chicken breast, fish, eggs, Greek yogurt, beans, tofu
- Carbs: Brown rice, oatmeal, whole grain bread, fruits, sweet potatoes
- Healthy fats: Nuts, avocado, olive oil, seeds
- Quick energy: Bananas, energy bars, dried fruits, nuts
`;
  }

  // 日本語（デフォルト）
  return `
あなたは経験豊富なフィットネス栄養コーチです。励ましと具体的指導を組み合わせたフィードバックを提供してください。

現在の状況：
- 現在時刻: ${currentHour}時
- 今日の食事回数: ${mealCount}回
- 昨日の達成率: ${hasYesterdayData ? `${yesterdayAchievement}%` : 'データなし'}

フィードバック構成（必ず4要素を含める）：
1. 【状態評価】現在の良い点と改善点を具体的に
   - 良い点：「朝食のタンパク質30g素晴らしい！」「このペースなら目標達成確実」
   - 改善点：「タンパク質40g不足ですが、夕食で十分リカバリー可能」

2. 【数値分析】目標との差分を明確に
   - 達成率、残り必要量、時間的余裕を具体的に

3. 【具体的提案】今すぐ実行可能なアクション
   - 即効性、準備型、習慣化の3段階で提案

4. 【励まし】前向きなモチベーション維持コメント
   - 昨日との比較、進歩の認識、達成可能性の強調

時間帯別戦略：
- 朝 (6-10時): 「1日の基礎作り、朝食の重要性と今後の見通し」
- 昼 (11-14時): 「中間評価と午後戦略、達成感の醸成」
- 午後 (15-18時): 「最終調整期、具体的な夕食計画」
- 夜 (19-22時): 「1日の締めくくり、明日への準備と今日の振り返り」

レスポンス形式：
{
  "feedback": "【評価】達成率○○%！良い点。改善点。【励まし】モチベーションコメント（120-160文字）",
  "suggestions": [
    "【即効性】具体的な食材と量",
    "【準備型】次の食事の提案",
    "【習慣化】長期的な改善提案"
  ],
  "actionItems": [
    {
      "priority": "high",
      "action": "【今すぐ】具体的アクション",
      "reason": "【効果】期待される結果"
    }
  ]
}

例文パターン：
- 順調時: 「達成率85%！朝食で30g確保、素晴らしいスタートです。残り20gを夕食でクリア。昨日より朝食が5g改善、着実に前進しています！」
- 遅れ気味: 「達成率40%、でも大丈夫！まだ夕食があります。40g不足ですが鶏胸肉150gで一気にリカバリー可能。昨日も夕食で逆転しましたね！」

食材の提案例：
- タンパク質源：鶏胸肉、魚、卵、ギリシャヨーグルト、豆類、豆腐、納豆
- 炭水化物源：玄米、オートミール、全粒粉パン、果物、さつまいも
- 健康的な脂質：ナッツ類、アボカド、オリーブオイル、種子類
- クイックエネルギー：バナナ、エナジーバー、ドライフルーツ、ナッツ
`;
};

const getEnhancedUserPrompt = (
  nutrition: any,
  profile: any,
  context: any,
  language: string
) => {
  const { currentHour, mealCount, yesterdayData } = context;
  const timeOfDay =
    currentHour < 10
      ? 'morning'
      : currentHour < 14
      ? 'midday'
      : currentHour < 18
      ? 'afternoon'
      : 'evening';
  const proteinAchievement =
    (nutrition.protein / nutrition.targetProtein) * 100;
  const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
  const remainingHours = Math.max(0, 22 - currentHour);

  if (language === 'en') {
    return `
User Information:
- Goal: ${profile.goal}
- Age: ${profile.age}, Weight: ${profile.weight}kg

Current Status (${timeOfDay}):
- Time: ${currentHour}:00 (${remainingHours} hours until bedtime)
- Meals consumed: ${mealCount} ${
      mealCount === 0 ? '(no meals yet - focus on starting strong)' : ''
    }
- Protein: ${nutrition.protein}g / ${
      nutrition.targetProtein
    }g (${proteinAchievement.toFixed(0)}%)
- Remaining protein needed: ${proteinGap}g
- Average protein per remaining meal: ${
      mealCount < 3 ? Math.round(proteinGap / (3 - mealCount)) : 0
    }g

${
  yesterdayData
    ? `
Yesterday's Comparison:
- Protein: ${yesterdayData.protein}g / ${yesterdayData.targetProtein}g (${
        yesterdayData.achievement
      }%)
- Today vs Yesterday: ${
        nutrition.protein > yesterdayData.protein
          ? `+${Math.round(
              nutrition.protein - yesterdayData.protein
            )}g improvement!`
          : nutrition.protein < yesterdayData.protein
          ? `${Math.round(
              yesterdayData.protein - nutrition.protein
            )}g behind, but recoverable`
          : 'Same pace as yesterday'
      }
- ${
        yesterdayData.achievement > 95
          ? 'Perfect execution yesterday!'
          : `Yesterday's gap: ${yesterdayData.gap}g`
      }
`
    : ''
}

Today's Meals Analysis:
${
  nutrition.meals.length > 0
    ? nutrition.meals
        .map(
          (m: any, index: number) =>
            `- Meal ${index + 1}: ${m.name} (P:${m.protein}g${
              m.protein >= 20
                ? ' ✓ Good!'
                : m.protein >= 10
                ? ' - OK'
                : ' - Low'
            }) ${m.calories}kcal`
        )
        .join('\n')
    : 'No meals logged yet - clean slate for optimal nutrition!'
}

Context for Feedback:
${
  mealCount === 0
    ? "MORNING START: User hasn't eaten yet. Focus on motivation, foundation-setting, and concrete breakfast suggestions with protein targets."
    : mealCount === 1
    ? 'MID-DAY CHECKPOINT: Analyze breakfast quality, celebrate successes, plan strategic lunch/dinner distribution.'
    : mealCount === 2
    ? 'FINAL STRETCH: Two meals down. Calculate precise dinner requirements. Build confidence about achievability.'
    : "DAY COMPLETION: Multiple meals logged. Focus on fine-tuning, next-day preparation, and celebrating today's efforts."
}

Provide comprehensive 4-element feedback (evaluation, analysis, suggestions, motivation) considering time constraints and meal opportunities.`;
  }

  // 日本語（デフォルト）
  return `
ユーザー情報：
- 目標: ${
    profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'
  }
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg

現在の状況（${
    timeOfDay === 'morning'
      ? '朝'
      : timeOfDay === 'midday'
      ? '昼'
      : timeOfDay === 'afternoon'
      ? '午後'
      : '夜'
  }）：
- 時刻: ${currentHour}時（就寝まで約${remainingHours}時間）
- 食事回数: ${mealCount}回 ${
    mealCount === 0 ? '（まだ食事なし - 良いスタートを切ることが重要）' : ''
  }
- タンパク質: ${nutrition.protein}g / ${
    nutrition.targetProtein
  }g (${proteinAchievement.toFixed(0)}%)
- 残り必要量: ${proteinGap}g
- 残り食事1回あたり平均: ${
    mealCount < 3 ? Math.round(proteinGap / (3 - mealCount)) : 0
  }g

${
  yesterdayData
    ? `
昨日との比較：
- タンパク質: ${yesterdayData.protein}g / ${yesterdayData.targetProtein}g (${
        yesterdayData.achievement
      }%)
- 今日 vs 昨日: ${
        nutrition.protein > yesterdayData.protein
          ? `+${Math.round(nutrition.protein - yesterdayData.protein)}g改善！`
          : nutrition.protein < yesterdayData.protein
          ? `${Math.round(
              yesterdayData.protein - nutrition.protein
            )}g遅れ、でもリカバリー可能`
          : '昨日と同じペース'
      }
- ${
        yesterdayData.achievement > 95
          ? '昨日は完璧な達成！'
          : `昨日の不足分: ${yesterdayData.gap}g`
      }
`
    : ''
}

今日の食事分析：
${
  nutrition.meals.length > 0
    ? nutrition.meals
        .map(
          (m: any, index: number) =>
            `- 食事${index + 1}: ${m.name} (P:${m.protein}g${
              m.protein >= 20
                ? ' ✓ 良好！'
                : m.protein >= 10
                ? ' - 普通'
                : ' - 少なめ'
            }) ${m.calories}kcal`
        )
        .join('\n')
    : '食事記録なし - 最適な栄養摂取のチャンス！'
}

フィードバック文脈：
${
  mealCount === 0
    ? '朝のスタート: まだ食事なし。動機付け、基礎作り、具体的な朝食提案とタンパク質目標に焦点。'
    : mealCount === 1
    ? '中間チェック: 朝食の質を分析、成功を祝い、昼食・夕食の戦略的配分を計画。'
    : mealCount === 2
    ? '最終調整: 2食完了。夕食での正確な必要量を計算。達成可能性への自信を構築。'
    : '1日完遂: 複数食記録済み。微調整、翌日準備、今日の努力を讃える。'
}

4要素構成（評価・分析・提案・励まし）で、時間的制約と食事機会を考慮した包括的フィードバックを提供してください。`;
};

serve(async req => {
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
      yesterdayData, // 新規: 昨日のデータ
      mealCount = 0, // 新規: 今日の食事回数
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
      yesterdayAchievement: yesterdayData?.achievement || 0,
    };

    // 拡張されたプロンプトを使用
    const systemPrompt = getEnhancedSystemPrompt(language, context);
    const userPrompt = getEnhancedUserPrompt(
      nutrition,
      profile,
      context,
      language
    );

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
      feedback:
        parsedResponse.feedback ||
        (language === 'en'
          ? 'Analyzed nutrition balance'
          : '栄養バランスを分析しました'),
      suggestions: parsedResponse.suggestions || [],
      actionItems: parsedResponse.actionItems || [],
      context: {
        timeOfDay:
          context.currentHour < 10
            ? 'morning'
            : context.currentHour < 14
            ? 'midday'
            : context.currentHour < 18
            ? 'afternoon'
            : 'evening',
        mealCount: context.mealCount,
        hasYesterdayData: context.hasYesterdayData,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in nutrition-feedback:', error);

    // フォールバック処理も言語対応
    const {
      nutrition,
      language = 'ja',
      mealCount = 0,
    } = await req.json().catch(() => ({
      nutrition: null,
      language: 'ja',
      mealCount: 0,
    }));

    const fallbackData =
      language === 'en'
        ? {
            feedback:
              'Analyzing nutrition balance. Keep tracking to achieve your goals!',
            proteinShortage: (gap: number) =>
              `You're about ${Math.round(
                gap
              )}g short on protein. Add high-protein foods.`,
            suggestions: [
              'Add chicken breast (about 25g protein per 100g)',
              'Protein shake or Greek yogurt (15-20g)',
              'Include eggs or tofu (10-15g protein)',
            ],
            calorieShortage: [
              'Banana with nut butter',
              'Whole grain bread with avocado',
              'Mixed nuts and dried fruits',
            ],
            defaultSuggestions: [
              'Focus on protein-rich foods for nutrition',
              'Stay hydrated (aim for 2L daily)',
              'Consistent tracking is key to success',
            ],
            action: {
              priority: 'high' as const,
              action: 'Add protein-rich foods to your next meal',
              reason: 'Support muscle recovery and growth',
            },
            defaultAction: {
              priority: 'medium' as const,
              action: 'Focus on protein in your next meal',
              reason: 'Improve nutrition balance',
            },
            error: 'AI analysis temporarily unavailable',
          }
        : {
            feedback:
              '栄養バランスを確認中です。記録を継続して目標達成を目指しましょう！',
            proteinShortage: (gap: number) =>
              `タンパク質が約${Math.round(
                gap
              )}g不足しています。高タンパク食材で補いましょう。`,
            suggestions: [
              '鶏胸肉を追加（100gあたり約25gのタンパク質）',
              'プロテインシェイクまたはギリシャヨーグルト（15-20g）',
              '卵や豆腐を活用（10-15gのタンパク質）',
            ],
            calorieShortage: [
              'バナナとナッツバター',
              '全粒粉パンとアボカド',
              'ミックスナッツとドライフルーツ',
            ],
            defaultSuggestions: [
              'タンパク質を含む食品で栄養補給',
              '水分補給を忘れずに（1日2L目安）',
              '食事記録の継続が成功への第一歩',
            ],
            action: {
              priority: 'high' as const,
              action: 'タンパク質豊富な食材を次の食事に追加',
              reason: '筋肉の回復と成長をサポート',
            },
            defaultAction: {
              priority: 'medium' as const,
              action: '次の食事でタンパク質を意識',
              reason: '栄養バランスの改善',
            },
            error: 'AI分析が一時的に利用できません',
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
      const proteinGap = Math.max(
        0,
        nutrition.targetProtein - nutrition.protein
      );
      const calorieGap = Math.max(
        0,
        nutrition.targetCalories - nutrition.calories
      );

      if (proteinGap > 20) {
        fallbackFeedback = fallbackData.proteinShortage(proteinGap);
        fallbackSuggestions.push(...fallbackData.suggestions);
        fallbackActions.push(fallbackData.action);
      } else if (calorieGap > 200) {
        fallbackFeedback =
          language === 'en'
            ? "Calories are slightly low. Let's balance your nutrition."
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
        hasYesterdayData: false,
      },
      error: fallbackData.error,
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // クライアント側でエラーハンドリング
    });
  }
});
