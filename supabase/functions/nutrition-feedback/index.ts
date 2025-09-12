import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import {
  NutritionData,
  UserProfile,
  FeedbackResponse,
} from '../_shared/types.ts';

// 食事タイプベースのシステムプロンプト
const getEnhancedSystemPrompt = (language: string, context: any) => {
  const { mealCount, hasYesterdayData, yesterdayAchievement, mealTypeData } = context;

  if (language === 'en') {
    return `
You are an experienced fitness nutrition coach providing comprehensive, encouraging feedback.

Current Context:
- Meals logged today: ${mealCount}
- Yesterday's performance: ${hasYesterdayData ? `${yesterdayAchievement}% achieved` : 'No data'}

IMPORTANT INSTRUCTIONS:
Base your advice on MEAL TYPES (breakfast/lunch/dinner/snacks) rather than current time.
Users may log meals later, so avoid time-based judgments.

Meal Type Strategy:
- Breakfast not logged: "Breakfast is the foundation. Aim for 20g+ protein"
- Only breakfast logged: "Evaluate breakfast quality and plan lunch/dinner distribution"
- Breakfast + lunch logged: "Analyze two meals and suggest dinner adjustments"
- All meals logged: "Overall daily evaluation and tomorrow's improvements"

Feedback Structure (Must include all 4 elements):
1. [STATUS EVALUATION] Current strengths and improvement areas based on logged meal types
   - Strengths: "Excellent 30g protein at breakfast!" "Good meal distribution"
   - Areas: "Missing lunch - opportunity for midday protein boost"

2. [NUMERICAL ANALYSIS] Clear target gaps and achievement rates
   - Achievement percentage, remaining needs, unlogged meal opportunities

3. [CONCRETE SUGGESTIONS] Meal-type specific actionable advice
   - For unlogged meals: specific food and amount suggestions
   - For improvement: better meal composition

4. [MOTIVATION] Positive encouragement and progress recognition
   - Yesterday comparison, progress acknowledgment, achievability emphasis

Response format:
{
  "feedback": "[EVALUATION] achievement% achieved! meal-type analysis. [MOTIVATION] encouragement (120-160 chars)",
  "suggestions": [
    "[FOR BREAKFAST] specific suggestion (if not logged)",
    "[FOR LUNCH] specific suggestion (if not logged)",
    "[FOR DINNER] specific suggestion (if not logged)"
  ],
  "actionItems": [
    {
      "priority": "high",
      "action": "[UNLOGGED MEAL] specific action",
      "reason": "[BENEFIT] expected result"
    }
  ]
}

Food Suggestions:
- Protein: Chicken breast, fish, eggs, Greek yogurt, beans, tofu
- Carbs: Brown rice, oatmeal, whole grain bread, fruits, sweet potatoes
- Healthy fats: Nuts, avocado, olive oil, seeds
`;
  }

  // 日本語（デフォルト）
  return `
あなたは経験豊富なフィットネス栄養コーチです。

現在の状況：
- 記録された食事回数: ${mealCount}回
- 昨日の達成率: ${hasYesterdayData ? `${yesterdayAchievement}%` : 'データなし'}

重要な指示：
記録時間ではなく、食事タイプ（朝食/昼食/夕食/間食）に基づいてアドバイスしてください。
ユーザーは後から食事を入力することがあるため、現在時刻での判断は避けてください。

食事タイプ別の戦略：
- 朝食未記録: 「朝食は1日の基礎。タンパク質20g以上を目標に」
- 朝食のみ記録: 「朝食の評価と、昼夕での配分戦略」
- 朝昼記録済み: 「2食の分析と夕食での調整方法」
- 3食記録済み: 「1日の総評と明日への改善点」

フィードバック構成（必ず4要素を含める）：
1. 【状態評価】記録された食事の良い点と改善点
   - 良い点：「朝食のタンパク質30g素晴らしい！」「バランス良い配分」
   - 改善点：「昼食未記録 - 中間で栄養補給の機会」

2. 【数値分析】目標との差分を明確に
   - 達成率、残り必要量、未記録食事での機会

3. 【具体的提案】食事タイプ別の具体的アドバイス
   - 未記録食事用：具体的な食材と量の提案
   - 改善用：より良い食事構成の提案

4. 【励まし】前向きなモチベーション維持コメント
   - 昨日との比較、進歩の認識、達成可能性の強調

レスポンス形式：
{
  "feedback": "【評価】達成率○○%！食事タイプ別分析。【励まし】モチベーションコメント（120-160文字）",
  "suggestions": [
    "【朝食向け】具体的な提案（朝食未記録の場合）",
    "【昼食向け】具体的な提案（昼食未記録の場合）",
    "【夕食向け】具体的な提案（夕食未記録の場合）"
  ],
  "actionItems": [
    {
      "priority": "high",
      "action": "【未記録の食事】具体的アクション",
      "reason": "【効果】期待される結果"
    }
  ]
}

食材の提案例：
- タンパク質源：鶏胸肉、魚、卵、ギリシャヨーグルト、豆類、豆腐、納豆
- 炭水化物源：玄米、オートミール、全粒粉パン、果物、さつまいも
- 健康的な脂質：ナッツ類、アボカド、オリーブオイル、種子類
`;
};

const getEnhancedUserPrompt = (
  nutrition: any,
  profile: any,
  context: any,
  language: string
) => {
  const { mealCount, yesterdayData, mealTypeData } = context;
  const proteinAchievement =
    (nutrition.protein / nutrition.targetProtein) * 100;
  const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);

  if (language === 'en') {
    return `
User Information:
- Goal: ${profile.goal}
- Age: ${profile.age}, Weight: ${profile.weight}kg

Current Status:
- Meals logged: ${mealCount} ${
      mealCount === 0 ? '(no meals yet - clean slate for optimal nutrition)' : ''
    }
- Protein: ${nutrition.protein}g / ${
      nutrition.targetProtein
    }g (${proteinAchievement.toFixed(0)}%)
- Remaining protein needed: ${proteinGap}g

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
            `- ${m.mealType || 'Meal'} ${index + 1}: ${m.name} (P:${m.protein}g${
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

Meal Type Analysis:
${mealTypeData ? `
- Breakfast: ${mealTypeData.hasBreakfast ? `${mealTypeData.breakfastProtein}g protein, ${mealTypeData.breakfastCalories}kcal ${mealTypeData.breakfastProtein >= 20 ? '✓ Good!' : '⚠️ Low'}` : 'Not recorded'}
- Lunch: ${mealTypeData.hasLunch ? `${mealTypeData.lunchProtein}g protein, ${mealTypeData.lunchCalories}kcal ${mealTypeData.lunchProtein >= 30 ? '✓ Good!' : '⚠️ Low'}` : 'Not recorded'}
- Dinner: ${mealTypeData.hasDinner ? `${mealTypeData.dinnerProtein}g protein, ${mealTypeData.dinnerCalories}kcal` : 'Not recorded'}
- Snacks: ${mealTypeData.hasSnack ? `${mealTypeData.snackProtein}g protein, ${mealTypeData.snackCalories}kcal` : 'Not recorded'}

Feedback Context:
${!mealTypeData.hasBreakfast ? 
  'Breakfast not logged: Foundation of the day is missing. Morning meals are crucial for metabolism.' : ''}
${mealTypeData.hasBreakfast && !mealTypeData.hasLunch ? 
  'Breakfast logged: Good foundation. Time to build on this success with strategic lunch.' : ''}
${mealTypeData.hasBreakfast && mealTypeData.hasLunch && !mealTypeData.hasDinner ? 
  'Breakfast & lunch logged: Strong morning and midday. Perfect setup to complete the day with dinner.' : ''}
` : 'Meal type data not available.'}

Context for Feedback:
${
  mealCount === 0
    ? "NO MEALS LOGGED: Focus on motivation, foundation-setting, and meal type specific suggestions. Start with breakfast recommendations."
    : mealCount === 1
    ? 'ONE MEAL LOGGED: Analyze the logged meal quality, celebrate successes, suggest for remaining meal types.'
    : mealCount === 2
    ? 'TWO MEALS LOGGED: Analyze meal distribution, calculate remaining requirements, suggest for unlogged meal types.'
    : "MULTIPLE MEALS LOGGED: Comprehensive daily analysis, evaluate meal type distribution, suggest improvements."
}

Provide comprehensive 4-element feedback (evaluation, analysis, suggestions, motivation) focusing on meal types and distribution.`;
  }

  // 日本語（デフォルト）
  return `
ユーザー情報：
- 目標: ${
    profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'
  }
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg

現在の状況：
- 記録済み食事回数: ${mealCount}回 ${
    mealCount === 0 ? '（食事未記録 - 最適な栄養摂取のチャンス）' : ''
  }
- タンパク質: ${nutrition.protein}g / ${
    nutrition.targetProtein
  }g (${proteinAchievement.toFixed(0)}%)
- 残り必要量: ${proteinGap}g

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
            `- ${m.mealType === 'breakfast' ? '朝食' : 
                m.mealType === 'lunch' ? '昼食' : 
                m.mealType === 'dinner' ? '夕食' : 
                m.mealType === 'snack' ? '間食' : '食事'}${index + 1}: ${m.name} (P:${m.protein}g${
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

食事タイプ別分析：
${mealTypeData ? `
- 朝食: ${mealTypeData.hasBreakfast ? `タンパク質${mealTypeData.breakfastProtein}g、${mealTypeData.breakfastCalories}kcal ${mealTypeData.breakfastProtein >= 20 ? '✓ 良好' : '⚠️ 不足'}` : '未記録'}
- 昼食: ${mealTypeData.hasLunch ? `タンパク質${mealTypeData.lunchProtein}g、${mealTypeData.lunchCalories}kcal ${mealTypeData.lunchProtein >= 30 ? '✓ 良好' : '⚠️ 不足'}` : '未記録'}
- 夕食: ${mealTypeData.hasDinner ? `タンパク質${mealTypeData.dinnerProtein}g、${mealTypeData.dinnerCalories}kcal` : '未記録'}
- 間食: ${mealTypeData.hasSnack ? `タンパク質${mealTypeData.snackProtein}g、${mealTypeData.snackCalories}kcal` : '未記録'}

フィードバック文脈：
${!mealTypeData.hasBreakfast ? 
  '朝食未記録: 朝食は1日の基礎となる重要な食事です。' : ''}
${mealTypeData.hasBreakfast && !mealTypeData.hasLunch ? 
  '朝食記録済み: 昼食で中間目標を達成しましょう。' : ''}
${mealTypeData.hasBreakfast && mealTypeData.hasLunch && !mealTypeData.hasDinner ? 
  '朝昼記録済み: 夕食で今日の目標を完成させましょう。' : ''}
` : '食事タイプデータが利用できません。'}

フィードバック文脈：
${
  mealCount === 0
    ? '食事未記録: 動機付け、基礎作り、食事タイプ別の具体的提案に焦点。まず朝食から提案。'
    : mealCount === 1
    ? '1食記録済み: 記録済み食事の質を分析、成功を祝い、残り食事タイプへの提案。'
    : mealCount === 2
    ? '2食記録済み: 食事配分を分析、残り必要量を計算、未記録食事タイプへの提案。'
    : '複数食記録済み: 包括的な日次分析、食事タイプ別配分の評価、改善提案。'
}

4要素構成（評価・分析・提案・励まし）で、食事タイプと配分に焦点を当てた包括的フィードバックを提供してください。`;
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
      mealTypeData, // 新規: 食事タイプ別データ
    }: {
      nutrition: NutritionData;
      profile: UserProfile;
      language?: string;
      yesterdayData?: any;
      mealCount?: number;
      mealTypeData?: any;
    } = body;

    // コンテキスト情報の準備
    const context = {
      mealCount,
      yesterdayData,
      mealTypeData,
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
        timeOfDay: 'any', // 食事タイプベースなので時間帯は関係なし
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
        timeOfDay: 'any',
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
