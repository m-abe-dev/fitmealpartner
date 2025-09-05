import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import { NutritionData, UserProfile, FeedbackResponse } from '../_shared/types.ts';

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { nutrition, profile }: { nutrition: NutritionData; profile: UserProfile } = 
      await req.json();

    // 栄養素の達成率を計算
    const proteinAchievement = (nutrition.protein / nutrition.targetProtein) * 100;
    const carbsAchievement = (nutrition.carbs / nutrition.targetCarbs) * 100;
    const fatAchievement = (nutrition.fat / nutrition.targetFat) * 100;
    const caloriesAchievement = (nutrition.calories / nutrition.targetCalories) * 100;

    // 不足量の計算
    const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
    const calorieGap = Math.max(0, nutrition.targetCalories - nutrition.calories);
    const carbGap = Math.max(0, nutrition.targetCarbs - nutrition.carbs);

    // システムプロンプト
    const systemPrompt = `
あなたは経験豊富なフィットネス栄養コーチです。
ユーザーの栄養摂取状況を分析し、具体的で実行可能なアドバイスを提供してください。

重要なガイドライン：
1. 健康的でバランスの取れたアプローチを推奨
2. 極端な制限や不健康な方法は避ける
3. 日本のコンビニで入手可能な具体的な商品を提案（セブンイレブン、ファミマ、ローソンなど）
4. ポジティブで励みになるトーンを保つ
5. 達成できた部分も認める
6. 不足栄養素を補う即座のアクションを優先
7. 200文字以内で簡潔にまとめる

レスポンスは必ず以下の形式のJSONで返してください：
{
  "feedback": "全体的なフィードバック（100-150文字）",
  "suggestions": ["提案1（コンビニ商品名を含む）", "提案2", "提案3"],
  "actionItems": [
    {
      "priority": "high",
      "action": "具体的なアクション（商品名も含む）",
      "reason": "理由"
    }
  ]
}
`;

    // ユーザープロンプト
    const userPrompt = `
ユーザー情報：
- 目標: ${profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'}
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg, 性別: ${profile.gender}

今日の栄養摂取状況：
- カロリー: ${nutrition.calories}kcal / 目標${nutrition.targetCalories}kcal (${caloriesAchievement.toFixed(0)}%)
- タンパク質: ${nutrition.protein}g / 目標${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%) 不足${proteinGap}g
- 炭水化物: ${nutrition.carbs}g / 目標${nutrition.targetCarbs}g (${carbsAchievement.toFixed(0)}%)
- 脂質: ${nutrition.fat}g / 目標${nutrition.targetFat}g (${fatAchievement.toFixed(0)}%)

食事内容：
${nutrition.meals.map(m => `- ${m.name}: ${m.calories}kcal (P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`).join('\n')}

現在時刻は${new Date().getHours()}時です。残りの時間で不足栄養素を補う具体的で実行可能なアクションを提案してください。
特にタンパク質が不足している場合は最優先で対処法を提案してください。
`;

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
      feedback: parsedResponse.feedback || '栄養バランスを分析しました',
      suggestions: parsedResponse.suggestions || [],
      actionItems: parsedResponse.actionItems || []
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nutrition-feedback:', error);
    
    // フォールバック定型文（状況に応じた動的生成）
    const { nutrition } = await req.json().catch(() => ({ nutrition: null }));
    
    let fallbackFeedback = '栄養バランスを確認中です。記録を継続して目標達成を目指しましょう！';
    const fallbackSuggestions = [];
    const fallbackActions = [];

    if (nutrition) {
      const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);
      const calorieGap = Math.max(0, nutrition.targetCalories - nutrition.calories);

      if (proteinGap > 20) {
        fallbackFeedback = `タンパク質が約${Math.round(proteinGap)}g不足しています。プロテインやサラダチキンで補いましょう。`;
        fallbackSuggestions.push('セブンイレブンのサラダチキン（約20g）', 'ファミマのプロテインバー（約15g）');
        fallbackActions.push({
          priority: 'high' as const,
          action: 'プロテイン1杯またはサラダチキン1個を追加',
          reason: '筋肉の回復と成長をサポート'
        });
      } else if (calorieGap > 200) {
        fallbackFeedback = 'カロリーがやや不足気味です。バランスよく栄養補給しましょう。';
        fallbackSuggestions.push('おにぎり1個とプロテインドリンク', 'バナナとナッツ類');
      }
    }

    if (fallbackSuggestions.length === 0) {
      fallbackSuggestions.push(
        'プロテインを含む食品で栄養補給',
        '水分補給を忘れずに（1日2L目安）',
        '食事記録の継続が成功への第一歩'
      );
    }

    if (fallbackActions.length === 0) {
      fallbackActions.push({
        priority: 'medium' as const,
        action: '次の食事でタンパク質を意識',
        reason: '栄養バランスの改善'
      });
    }

    const fallbackResponse: FeedbackResponse = {
      success: false,
      feedback: fallbackFeedback,
      suggestions: fallbackSuggestions,
      actionItems: fallbackActions,
      error: 'AI分析が一時的に利用できません'
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // クライアント側でエラーハンドリング
    });
  }
});