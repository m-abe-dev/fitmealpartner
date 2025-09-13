// フォールバック用のメッセージとエクササイズ定義

export interface FallbackMessages {
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    notes: string;
  }>;
  feedback: string;
  error: string;
  successFeedback: string;
}

export const fallbackMessages: Record<string, FallbackMessages> = {
  ja: {
    exercises: [
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
    ],
    feedback: 'AI提案が利用できないため、基本的なトレーニングプランを提案します。',
    error: 'ワークアウト提案機能が一時的に利用できません',
    successFeedback: 'バランスの取れたワークアウトプランを作成しました',
  },

  en: {
    exercises: [
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
    ],
    feedback: 'AI suggestion unavailable. Suggesting basic training plan.',
    error: 'Workout suggestion feature temporarily unavailable',
    successFeedback: 'Created a balanced workout plan with progress-focused exercises',
  },

  es: {
    exercises: [
      {
        name: 'Flexiones',
        sets: 3,
        reps: '8-15',
        notes: 'Ejercicio de peso corporal para tren superior',
      },
      {
        name: 'Sentadillas',
        sets: 3,
        reps: '10-15',
        notes: 'Ejercicio de peso corporal para piernas',
      },
      {
        name: 'Plancha',
        sets: 3,
        reps: '30-60 seg',
        notes: 'Ejercicio de estabilidad del core',
      },
      {
        name: 'Dominadas',
        sets: 3,
        reps: '5-10',
        notes: 'Ejercicio de tracción para tren superior',
      },
      {
        name: 'Zancadas',
        sets: 3,
        reps: '10-12 cada pierna',
        notes: 'Ejercicio unilateral de piernas',
      },
      {
        name: 'Press de Banca',
        sets: 3,
        reps: '8-12',
        notes: 'Mantén los omóplatos juntos, pecho arriba',
      },
      {
        name: 'Press de Hombros',
        sets: 3,
        reps: '10-15',
        notes: 'Enfócate en la movilidad del hombro, ve despacio',
      },
    ],
    feedback: 'Sugerencia de IA no disponible. Sugiriendo plan de entrenamiento básico.',
    error: 'Función de sugerencia de entrenamiento temporalmente no disponible',
    successFeedback: 'Se creó un plan de entrenamiento balanceado con ejercicios enfocados en el progreso',
  },

  fr: {
    exercises: [
      {
        name: 'Pompes',
        sets: 3,
        reps: '8-15',
        notes: 'Exercice au poids du corps pour le haut du corps',
      },
      {
        name: 'Squats',
        sets: 3,
        reps: '10-15',
        notes: 'Exercice au poids du corps pour les jambes',
      },
      {
        name: 'Planche',
        sets: 3,
        reps: '30-60 sec',
        notes: 'Exercice de stabilité du core',
      },
      {
        name: 'Tractions',
        sets: 3,
        reps: '5-10',
        notes: 'Exercice de traction pour le haut du corps',
      },
      {
        name: 'Fentes',
        sets: 3,
        reps: '10-12 chaque jambe',
        notes: 'Exercice unilatéral des jambes',
      },
      {
        name: 'Développé Couché',
        sets: 3,
        reps: '8-12',
        notes: 'Gardez les omoplates serrées, poitrine haute',
      },
      {
        name: 'Développé Épaules',
        sets: 3,
        reps: '10-15',
        notes: 'Concentrez-vous sur la mobilité des épaules, allez doucement',
      },
    ],
    feedback: 'Suggestion IA indisponible. Proposition de plan d\'entraînement de base.',
    error: 'Fonction de suggestion d\'entraînement temporairement indisponible',
    successFeedback: 'Plan d\'entraînement équilibré créé avec des exercices axés sur la progression',
  },
};

export const getFallbackMessages = (language: string): FallbackMessages => {
  const supportedLanguages = ['ja', 'en', 'es', 'fr'];
  const supportedLang = supportedLanguages.includes(language) ? language : 'en';
  return fallbackMessages[supportedLang] || fallbackMessages['en'];
};