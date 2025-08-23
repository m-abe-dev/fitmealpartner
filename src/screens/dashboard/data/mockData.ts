import { ScoreData, PeriodData, PeriodAIData } from '../types/dashboard.types';

export const scoreData: ScoreData[] = [
  {
    period: '今日',
    nutrition_score: 82,
    training_score: 74,
    total_score: 78,
    details: {
      nutrition: '栄養スコア',
      training: 'トレーニング'
    }
  },
  {
    period: '今週',
    nutrition_score: 78,
    training_score: 82,
    total_score: 80,
    details: {
      nutrition: '週平均栄養',
      training: '週平均トレ'
    }
  },
  {
    period: '今月',
    nutrition_score: 85,
    training_score: 79,
    total_score: 82,
    details: {
      nutrition: '月平均栄養',
      training: '月平均トレ'
    }
  }
];

export const periodData: PeriodData[] = [
  // 日別データ
  {
    period: '日',
    weightData: [
      { x: '1日', y: 70.2, volume: 800, calories: 1850 },
      { x: '2日', y: 70.1, volume: 900, calories: 2100 },
      { x: '3日', y: 70.0, volume: 1100, calories: 1950 },
      { x: '4日', y: 70.0, volume: 950, calories: 2250 },
      { x: '5日', y: 69.9, volume: 1200, calories: 1800 },
      { x: '6日', y: 69.8, volume: 1300, calories: 2050 },
      { x: '7日', y: 69.9, volume: 1050, calories: 1900 },
    ],
    caloriesData: [
      { x: '1日', y: 1850 },
      { x: '2日', y: 2100 },
      { x: '3日', y: 1950 },
      { x: '4日', y: 2250 },
      { x: '5日', y: 1800 },
      { x: '6日', y: 2050 },
      { x: '7日', y: 1900 },
    ],
    volumeData: [
      { x: '1日', y: 800 },
      { x: '2日', y: 900 },
      { x: '3日', y: 1100 },
      { x: '4日', y: 950 },
      { x: '5日', y: 1200 },
      { x: '6日', y: 1300 },
      { x: '7日', y: 1050 },
    ],
    stats: {
      weightChange: '-0.3kg',
      weightTrend: '-0.4%',
      trendType: 'success',
      avgVolume: '1,040kg',
      volumeTrend: '+12%',
      workoutCount: '5回',
      workoutTarget: '週7回',
      avgScore: '78点',
      scoreTrend: '+3pt',
      avgCalories: '1,986',
      caloriesTrend: '-14kcal',
      avgProtein: '138g',
      proteinTrend: '+8g',
      avgFoodCount: '11',
      foodTrend: '+1品',
    }
  },
  // 週別データ
  {
    period: '週',
    weightData: [
      { x: '1週', y: 70.5, volume: 3400, calories: 1980 },
      { x: '2週', y: 70.2, volume: 3650, calories: 2020 },
      { x: '3週', y: 69.8, volume: 3900, calories: 1950 },
      { x: '4週', y: 69.5, volume: 3750, calories: 2100 },
    ],
    caloriesData: [
      { x: '1週', y: 1980 },
      { x: '2週', y: 2020 },
      { x: '3週', y: 1950 },
      { x: '4週', y: 2100 },
    ],
    volumeData: [
      { x: '1週', y: 3400 },
      { x: '2週', y: 3650 },
      { x: '3週', y: 3900 },
      { x: '4週', y: 3750 },
    ],
    stats: {
      weightChange: '-1.0kg',
      weightTrend: '-1.4%',
      trendType: 'success',
      avgVolume: '3,675kg',
      volumeTrend: '+8%',
      workoutCount: '15回',
      workoutTarget: '月16回',
      avgScore: '80点',
      scoreTrend: '+2pt',
      avgCalories: '2,013',
      caloriesTrend: '+13kcal',
      avgProtein: '142g',
      proteinTrend: '+4g',
      avgFoodCount: '12',
      foodTrend: '+1品',
    }
  },
  // 月別データ
  {
    period: '月',
    weightData: [
      { x: '1月', y: 71.2, volume: 3200, calories: 2050 },
      { x: '2月', y: 70.5, volume: 3450, calories: 1980 },
      { x: '3月', y: 69.8, volume: 3650, calories: 1920 },
      { x: '4月', y: 69.2, volume: 3550, calories: 2000 },
      { x: '5月', y: 68.8, volume: 3800, calories: 1950 },
      { x: '6月', y: 68.5, volume: 3900, calories: 2080 },
    ],
    caloriesData: [
      { x: '1月', y: 2050 },
      { x: '2月', y: 1980 },
      { x: '3月', y: 1920 },
      { x: '4月', y: 2000 },
      { x: '5月', y: 1950 },
      { x: '6月', y: 2080 },
    ],
    volumeData: [
      { x: '1月', y: 3200 },
      { x: '2月', y: 3450 },
      { x: '3月', y: 3650 },
      { x: '4月', y: 3550 },
      { x: '5月', y: 3800 },
      { x: '6月', y: 3900 },
    ],
    stats: {
      weightChange: '-2.7kg',
      weightTrend: '-3.8%',
      trendType: 'success',
      avgVolume: '3,590kg',
      volumeTrend: '+22%',
      workoutCount: '78回',
      workoutTarget: '年100回',
      avgScore: '82点',
      scoreTrend: '+7pt',
      avgCalories: '1,997',
      caloriesTrend: '+30kcal',
      avgProtein: '145g',
      proteinTrend: '+15g',
      avgFoodCount: '13',
      foodTrend: '+3品',
    }
  }
];

export const periodAIData: PeriodAIData[] = [
  {
    period: '今日',
    feedback: [
      {
        type: 'nutrition',
        message: 'タンパク質があと28g不足しています。プロテインバー1本で補完できます。',
        severity: 'warning',
        action: '食材を追加'
      },
      {
        type: 'training',
        message: '下半身のトレーニングが不足気味です。明日はレッグデイをお勧めします。',
        severity: 'info',
        action: 'ワークアウト記録を確認'
      },
      {
        type: 'general',
        message: '今日のトータルスコアは78点。栄養面でもう少し改善の余地があります。',
        severity: 'info'
      }
    ],
    actions: [
      {
        icon: 'target',
        title: 'プロテイン20gを追加',
        subtitle: '目標達成まで28g不足',
        action: 'add_protein'
      },
      {
        icon: 'activity',
        title: '下半身ワークアウト',
        subtitle: '3日間実施していません',
        action: 'plan_workout'
      }
    ]
  },
  {
    period: '今週',
    feedback: [
      {
        type: 'training',
        message: '今週は筋トレの継続性が素晴らしいです！特に上半身のボリュームが向上しています。',
        severity: 'success',
        action: 'ワークアウト記録を確認'
      },
      {
        type: 'nutrition',
        message: '平日の栄養管理は優秀ですが、週末にカロリーオーバーが見られます。',
        severity: 'warning',
        action: '食事計画を見直し'
      },
      {
        type: 'general',
        message: '今週のスコアは80点で安定しています。継続できている点が素晴らしいです。',
        severity: 'success'
      }
    ],
    actions: [
      {
        icon: 'calendar',
        title: '週末の食事プラン作成',
        subtitle: '週末のカロリー管理改善',
        action: 'plan_weekend_meals'
      },
      {
        icon: 'trending-up',
        title: 'トレーニング強度アップ',
        subtitle: '来週は重量を5%増加',
        action: 'increase_intensity'
      }
    ]
  },
  {
    period: '今月',
    feedback: [
      {
        type: 'general',
        message: '今月のスコアは82点で非常に優秀！継続的な改善が見られています。',
        severity: 'success'
      },
      {
        type: 'nutrition',
        message: '月間を通してタンパク質摂取が安定しており、理想的な栄養バランスです。',
        severity: 'success',
        action: '栄養データを確認'
      },
      {
        type: 'training',
        message: '来月は新しい種目の導入で更なる成長が期待できます。',
        severity: 'info',
        action: 'トレーニングプラン更新'
      }
    ],
    actions: [
      {
        icon: 'award',
        title: '新しいトレーニング種目',
        subtitle: '停滞期防止のための変化',
        action: 'add_new_exercises'
      },
      {
        icon: 'target',
        title: '来月の目標設定',
        subtitle: '体重-1kg、筋力+10%',
        action: 'set_monthly_goals'
      }
    ]
  }
];