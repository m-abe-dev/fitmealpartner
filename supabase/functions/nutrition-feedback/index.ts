import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateAIResponse } from '../_shared/openai-client.ts';
import {
  NutritionData,
  UserProfile,
  FeedbackResponse,
} from '../_shared/types.ts';
import { 
  getNutritionPrompts, 
  getSupportedNutritionLanguage,
  getResponseFormat 
} from '../_shared/prompts/nutrition-prompts.ts';

// システムプロンプト生成
const getSystemPrompt = (language: string, context: any) => {
  const prompts = getNutritionPrompts(language);
  const { mealCount, hasYesterdayData, yesterdayAchievement, mealTypeData } = context;

  // 食事タイプ戦略の選択
  let mealStrategy = prompts.mealTypeStrategies.noMeals;
  if (mealTypeData) {
    if (!mealTypeData.hasBreakfast) {
      mealStrategy = prompts.mealTypeStrategies.noMeals;
    } else if (mealTypeData.hasBreakfast && !mealTypeData.hasLunch) {
      mealStrategy = prompts.mealTypeStrategies.breakfastOnly;
    } else if (mealTypeData.hasBreakfast && mealTypeData.hasLunch && !mealTypeData.hasDinner) {
      mealStrategy = prompts.mealTypeStrategies.breakfastLunch;
    } else {
      mealStrategy = prompts.mealTypeStrategies.allMeals;
    }
  }

  return `
${prompts.systemBase}

${prompts.contextMessages.mealCountPrefix}: ${mealCount}
${prompts.contextMessages.yesterdayPrefix}: ${hasYesterdayData ? `${yesterdayAchievement}%` : prompts.contextMessages.noYesterdayData}

${mealStrategy}

${prompts.feedbackStructure}

${getResponseFormat(language)}

食材の提案例：
- タンパク質源：${prompts.foodSuggestions.protein.join(', ')}
- 炭水化物源：${prompts.foodSuggestions.carbs.join(', ')}
- 健康的な脂質：${prompts.foodSuggestions.fats.join(', ')}
`;
};

// ユーザープロンプト生成
const getUserPrompt = (
  nutrition: NutritionData,
  profile: UserProfile,
  context: any,
  language: string
) => {
  const prompts = getNutritionPrompts(language);
  const { mealCount, yesterdayData, mealTypeData } = context;
  const proteinAchievement = (nutrition.protein / nutrition.targetProtein) * 100;
  const proteinGap = Math.max(0, nutrition.targetProtein - nutrition.protein);

  // 言語別のゴール表現
  const goalText = {
    ja: {
      cut: '減量',
      bulk: '増量',
      maintain: '維持'
    },
    en: {
      cut: 'cut',
      bulk: 'bulk',
      maintain: 'maintain'
    },
    es: {
      cut: 'pérdida de peso',
      bulk: 'ganancia muscular',
      maintain: 'mantenimiento'
    },
    fr: {
      cut: 'perte de poids',
      bulk: 'prise de masse',
      maintain: 'maintien'
    }
  };

  const goal = goalText[language]?.[profile.goal] || profile.goal;

  // 言語別のテキスト
  const texts = {
    ja: {
      userInfo: 'ユーザー情報：',
      goal: '目標',
      age: '年齢',
      weight: '体重',
      currentStatus: '現在の状況：',
      mealsLogged: '記録済み食事回数',
      protein: 'タンパク質',
      remaining: '残り必要量',
      yesterdayComparison: '昨日との比較：',
      improvement: '改善！',
      behind: '遅れ、でもリカバリー可能',
      samePace: '昨日と同じペース',
      perfectExecution: '昨日は完璧な達成！',
      yesterdayGap: '昨日の不足分',
      todayMeals: '今日の食事分析：',
      noMeals: '食事記録なし - 最適な栄養摂取のチャンス！',
      mealTypes: {
        breakfast: '朝食',
        lunch: '昼食',
        dinner: '夕食',
        snack: '間食'
      },
      good: '✓ 良好！',
      ok: '- 普通',
      low: '- 少なめ',
      notRecorded: '未記録',
      mealTypeAnalysis: '食事タイプ別分析：',
      feedbackContext: 'フィードバック文脈：',
      noMealsLogged: '食事未記録: 動機付け、基礎作り、食事タイプ別の具体的提案に焦点。',
      oneMealLogged: '1食記録済み: 記録済み食事の質を分析、成功を祝い、残り食事タイプへの提案。',
      twoMealsLogged: '2食記録済み: 食事配分を分析、残り必要量を計算、未記録食事タイプへの提案。',
      multipleMealsLogged: '複数食記録済み: 包括的な日次分析、食事タイプ別配分の評価、改善提案。'
    },
    en: {
      userInfo: 'User Information:',
      goal: 'Goal',
      age: 'Age',
      weight: 'Weight',
      currentStatus: 'Current Status:',
      mealsLogged: 'Meals logged',
      protein: 'Protein',
      remaining: 'Remaining needed',
      yesterdayComparison: 'Yesterday\'s Comparison:',
      improvement: 'improvement!',
      behind: 'behind, but recoverable',
      samePace: 'Same pace as yesterday',
      perfectExecution: 'Perfect execution yesterday!',
      yesterdayGap: 'Yesterday\'s gap',
      todayMeals: 'Today\'s Meals Analysis:',
      noMeals: 'No meals logged yet - clean slate for optimal nutrition!',
      mealTypes: {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
        snack: 'Snack'
      },
      good: '✓ Good!',
      ok: '- OK',
      low: '- Low',
      notRecorded: 'Not recorded',
      mealTypeAnalysis: 'Meal Type Analysis:',
      feedbackContext: 'Feedback Context:',
      noMealsLogged: 'NO MEALS LOGGED: Focus on motivation, foundation-setting, and meal type specific suggestions.',
      oneMealLogged: 'ONE MEAL LOGGED: Analyze the logged meal quality, celebrate successes, suggest for remaining meal types.',
      twoMealsLogged: 'TWO MEALS LOGGED: Analyze meal distribution, calculate remaining requirements, suggest for unlogged meal types.',
      multipleMealsLogged: 'MULTIPLE MEALS LOGGED: Comprehensive daily analysis, evaluate meal type distribution, suggest improvements.'
    },
    es: {
      userInfo: 'Información del Usuario:',
      goal: 'Objetivo',
      age: 'Edad',
      weight: 'Peso',
      currentStatus: 'Estado Actual:',
      mealsLogged: 'Comidas registradas',
      protein: 'Proteína',
      remaining: 'Restante necesario',
      yesterdayComparison: 'Comparación con Ayer:',
      improvement: '¡mejora!',
      behind: 'atrás, pero recuperable',
      samePace: 'Mismo ritmo que ayer',
      perfectExecution: '¡Ejecución perfecta ayer!',
      yesterdayGap: 'Déficit de ayer',
      todayMeals: 'Análisis de Comidas de Hoy:',
      noMeals: '¡Aún no hay comidas registradas - pizarra limpia para nutrición óptima!',
      mealTypes: {
        breakfast: 'Desayuno',
        lunch: 'Almuerzo',
        dinner: 'Cena',
        snack: 'Refrigerio'
      },
      good: '✓ ¡Bien!',
      ok: '- OK',
      low: '- Bajo',
      notRecorded: 'No registrado',
      mealTypeAnalysis: 'Análisis por Tipo de Comida:',
      feedbackContext: 'Contexto de Retroalimentación:',
      noMealsLogged: 'SIN COMIDAS REGISTRADAS: Enfocarse en motivación, establecimiento de bases y sugerencias específicas por tipo de comida.',
      oneMealLogged: 'UNA COMIDA REGISTRADA: Analizar calidad de la comida registrada, celebrar éxitos, sugerir para tipos de comidas restantes.',
      twoMealsLogged: 'DOS COMIDAS REGISTRADAS: Analizar distribución de comidas, calcular requisitos restantes, sugerir para tipos de comidas no registradas.',
      multipleMealsLogged: 'MÚLTIPLES COMIDAS REGISTRADAS: Análisis diario integral, evaluar distribución por tipo de comida, sugerir mejoras.'
    },
    fr: {
      userInfo: 'Informations Utilisateur:',
      goal: 'Objectif',
      age: 'Âge',
      weight: 'Poids',
      currentStatus: 'État Actuel:',
      mealsLogged: 'Repas enregistrés',
      protein: 'Protéines',
      remaining: 'Restant nécessaire',
      yesterdayComparison: 'Comparaison d\'Hier:',
      improvement: 'amélioration!',
      behind: 'en retard, mais récupérable',
      samePace: 'Même rythme qu\'hier',
      perfectExecution: 'Exécution parfaite hier!',
      yesterdayGap: 'Écart d\'hier',
      todayMeals: 'Analyse des Repas d\'Aujourd\'hui:',
      noMeals: 'Aucun repas enregistré encore - ardoise vierge pour une nutrition optimale!',
      mealTypes: {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner',
        dinner: 'Dîner',
        snack: 'Collation'
      },
      good: '✓ Bien!',
      ok: '- OK',
      low: '- Faible',
      notRecorded: 'Non enregistré',
      mealTypeAnalysis: 'Analyse par Type de Repas:',
      feedbackContext: 'Contexte de Retour:',
      noMealsLogged: 'AUCUN REPAS ENREGISTRÉ: Se concentrer sur la motivation, l\'établissement de fondations et les suggestions spécifiques par type de repas.',
      oneMealLogged: 'UN REPAS ENREGISTRÉ: Analyser la qualité du repas enregistré, célébrer les succès, suggérer pour les types de repas restants.',
      twoMealsLogged: 'DEUX REPAS ENREGISTRÉS: Analyser la distribution des repas, calculer les besoins restants, suggérer pour les types de repas non enregistrés.',
      multipleMealsLogged: 'PLUSIEURS REPAS ENREGISTRÉS: Analyse quotidienne complète, évaluer la distribution par type de repas, suggérer des améliorations.'
    }
  };

  const text = texts[language] || texts.en;

  return `
${text.userInfo}
- ${text.goal}: ${goal}
- ${text.age}: ${profile.age}, ${text.weight}: ${profile.weight}kg

${text.currentStatus}
- ${text.mealsLogged}: ${mealCount} ${mealCount === 0 ? `(${text.noMeals})` : ''}
- ${text.protein}: ${nutrition.protein}g / ${nutrition.targetProtein}g (${proteinAchievement.toFixed(0)}%)
- ${text.remaining}: ${proteinGap}g

${
  yesterdayData
    ? `
${text.yesterdayComparison}
- ${text.protein}: ${yesterdayData.protein}g / ${yesterdayData.targetProtein}g (${yesterdayData.achievement}%)
- ${
        nutrition.protein > yesterdayData.protein
          ? `+${Math.round(nutrition.protein - yesterdayData.protein)}g ${text.improvement}`
          : nutrition.protein < yesterdayData.protein
          ? `${Math.round(yesterdayData.protein - nutrition.protein)}g ${text.behind}`
          : text.samePace
      }
- ${
        yesterdayData.achievement > 95
          ? text.perfectExecution
          : `${text.yesterdayGap}: ${yesterdayData.gap}g`
      }
`
    : ''
}

${text.todayMeals}
${
  nutrition.meals.length > 0
    ? nutrition.meals
        .map(
          (m: any, index: number) =>
            `- ${text.mealTypes[m.mealType] || m.mealType || 'Meal'} ${index + 1}: ${m.name} (P:${m.protein}g${
              m.protein >= 20
                ? ` ${text.good}`
                : m.protein >= 10
                ? ` ${text.ok}`
                : ` ${text.low}`
            }) ${m.calories}kcal`
        )
        .join('\n')
    : text.noMeals
}

${text.mealTypeAnalysis}
${mealTypeData ? `
- ${text.mealTypes.breakfast}: ${mealTypeData.hasBreakfast ? `${mealTypeData.breakfastProtein}g protein, ${mealTypeData.breakfastCalories}kcal ${mealTypeData.breakfastProtein >= 20 ? text.good : '⚠️ Low'}` : text.notRecorded}
- ${text.mealTypes.lunch}: ${mealTypeData.hasLunch ? `${mealTypeData.lunchProtein}g protein, ${mealTypeData.lunchCalories}kcal ${mealTypeData.lunchProtein >= 30 ? text.good : '⚠️ Low'}` : text.notRecorded}
- ${text.mealTypes.dinner}: ${mealTypeData.hasDinner ? `${mealTypeData.dinnerProtein}g protein, ${mealTypeData.dinnerCalories}kcal` : text.notRecorded}
- ${text.mealTypes.snack}: ${mealTypeData.hasSnack ? `${mealTypeData.snackProtein}g protein, ${mealTypeData.snackCalories}kcal` : text.notRecorded}
` : 'Meal type data not available.'}

${text.feedbackContext}
${
  mealCount === 0
    ? text.noMealsLogged
    : mealCount === 1
    ? text.oneMealLogged
    : mealCount === 2
    ? text.twoMealsLogged
    : text.multipleMealsLogged
}
`;
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      nutrition,
      profile,
      language = 'ja',
      yesterdayData,
      mealCount = 0,
      mealTypeData,
    }: {
      nutrition: NutritionData;
      profile: UserProfile;
      language?: string;
      yesterdayData?: any;
      mealCount?: number;
      mealTypeData?: any;
    } = body;

    // 言語サポートの確認
    const supportedLanguage = getSupportedNutritionLanguage(language);
    
    console.log('=== Nutrition Feedback Language Debug ===');
    console.log('Received language:', language);
    console.log('Supported language:', supportedLanguage);
    console.log('========================================');

    const context = {
      mealCount,
      yesterdayData,
      mealTypeData,
      hasYesterdayData: !!yesterdayData,
      yesterdayAchievement: yesterdayData?.achievement || 0,
    };

    const systemPrompt = getSystemPrompt(supportedLanguage, context);
    const userPrompt = getUserPrompt(nutrition, profile, context, supportedLanguage);

    const aiResponse = await generateAIResponse(systemPrompt, userPrompt, 600);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    const response: FeedbackResponse = {
      success: true,
      feedback: parsedResponse.feedback || getFallbackFeedback(supportedLanguage),
      suggestions: parsedResponse.suggestions || [],
      actionItems: parsedResponse.actionItems || [],
      context: {
        timeOfDay: 'any',
        mealCount: context.mealCount,
        hasYesterdayData: context.hasYesterdayData,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in nutrition-feedback:', error);
    
    // エラー時のフォールバック処理
    const { language = 'ja' } = await req.json().catch(() => ({ language: 'ja' }));
    const supportedLanguage = getSupportedNutritionLanguage(language);
    
    const fallbackResponse = getNutritionFallback(supportedLanguage);
    
    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});

// フォールバック用関数
function getFallbackFeedback(language: string): string {
  const messages = {
    ja: '栄養バランスを分析しました',
    en: 'Analyzed nutrition balance',
    es: 'Balance nutricional analizado',
    fr: 'Équilibre nutritionnel analysé'
  };
  return messages[language] || messages.en;
}

function getNutritionFallback(language: string): FeedbackResponse {
  const fallbacks = {
    ja: {
      feedback: '栄養バランスを確認中です。記録を継続して目標達成を目指しましょう！',
      suggestions: [
        'タンパク質を含む食品で栄養補給',
        '水分補給を忘れずに（1日2L目安）',
        '食事記録の継続が成功への第一歩'
      ],
      actionItems: [{
        priority: 'medium' as const,
        action: '次の食事でタンパク質を意識',
        reason: '栄養バランスの改善'
      }]
    },
    en: {
      feedback: 'Checking nutrition balance. Keep tracking to achieve your goals!',
      suggestions: [
        'Focus on protein-rich foods for nutrition',
        'Stay hydrated (aim for 2L daily)',
        'Consistent tracking is key to success'
      ],
      actionItems: [{
        priority: 'medium' as const,
        action: 'Focus on protein in your next meal',
        reason: 'Improve nutrition balance'
      }]
    },
    es: {
      feedback: 'Verificando el balance nutricional. ¡Sigue registrando para alcanzar tus objetivos!',
      suggestions: [
        'Enfócate en alimentos ricos en proteínas',
        'Mantente hidratado (2L diarios)',
        'El registro consistente es clave para el éxito'
      ],
      actionItems: [{
        priority: 'medium' as const,
        action: 'Concéntrate en las proteínas en tu próxima comida',
        reason: 'Mejorar el balance nutricional'
      }]
    },
    fr: {
      feedback: 'Vérification de l\'équilibre nutritionnel. Continuez à enregistrer pour atteindre vos objectifs!',
      suggestions: [
        'Concentrez-vous sur les aliments riches en protéines',
        'Restez hydraté (2L par jour)',
        'L\'enregistrement cohérent est la clé du succès'
      ],
      actionItems: [{
        priority: 'medium' as const,
        action: 'Concentrez-vous sur les protéines dans votre prochain repas',
        reason: 'Améliorer l\'équilibre nutritionnel'
      }]
    }
  };
  
  const fallback = fallbacks[language] || fallbacks.en;
  
  return {
    success: false,
    ...fallback,
    error: 'AI analysis temporarily unavailable'
  };
}