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

    // システムプロンプト（日本語で応答するように指示）
    const systemPrompt = `
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

    // ユーザープロンプト（日本語）
    const userPrompt = `
ユーザー情報：
- 目標: ${profile.goal === 'cut' ? '減量' : profile.goal === 'bulk' ? '増量' : '維持'}
- 年齢: ${profile.age}歳, 体重: ${profile.weight}kg, 性別: ${profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : 'その他'}

今日の栄養摂取状況：
- カロリー: ${nutrition.calories}kcal / 目標${nutrition.targetCalories}kcal (${caloriesAchievement.toFixed(0)}%)
- タンパク質: ${nutrition.protein}g / 目標${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%) 不足${proteinGap}g
- 炭水化物: ${nutrition.carbs}g / 目標${nutrition.targetCarbs}g (${carbsAchievement.toFixed(0)}%)
- 脂質: ${nutrition.fat}g / 目標${nutrition.targetFat}g (${fatAchievement.toFixed(0)}%)

食事内容：
${nutrition.meals.map(m => `- ${m.name}: ${m.calories}kcal (P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`).join('\n')}

現在時刻は${new Date().getHours()}時です。

残りの時間で不足栄養素を補うための実用的な提案をしてください。
世界中で入手可能な一般的な食材を使った提案を心がけてください。
タンパク質が大幅に不足（20g以上）している場合は、タンパク質豊富な食材を優先してください。
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
    
    // フォールバック定型文（日本語）
    const { nutrition } = await req.json().catch(() => ({ nutrition: null }));
    
    let fallbackFeedback = '栄養バランスを確認中です。記録を継続して目標達成を目指しましょう！';
    
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
        fallbackFeedback = `タンパク質が約${Math.round(proteinGap)}g不足しています。高タンパク食材で補いましょう。`;
        fallbackSuggestions.push(
          '鶏胸肉を追加（100gあたり約25gのタンパク質）',
          'プロテインシェイクまたはギリシャヨーグルト（15-20g）',
          '卵や豆腐を活用（10-15gのタンパク質）'
        );
        fallbackActions.push({
          priority: 'high',
          action: 'タンパク質豊富な食材を次の食事に追加',
          reason: '筋肉の回復と成長をサポート'
        });
      } else if (calorieGap > 200) {
        fallbackFeedback = 'カロリーがやや不足気味です。バランスよく栄養補給しましょう。';
        fallbackSuggestions.push(
          'バナナとナッツバター',
          '全粒粉パンとアボカド',
          'ミックスナッツとドライフルーツ'
        );
      }
    }

    if (fallbackSuggestions.length === 0) {
      fallbackSuggestions.push(
        'タンパク質を含む食品で栄養補給',
        '水分補給を忘れずに（1日2L目安）',
        '食事記録の継続が成功への第一歩'
      );
    }

    if (fallbackActions.length === 0) {
      fallbackActions.push({
        priority: 'medium',
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