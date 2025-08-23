# 要件定義

# FitMeal Partner — 要件定義（MVP→拡張）

---

## 0. 概要 / ポジショニング

- **目的**：筋トレユーザー向けに「食事ログ × 筋トレログ × AIフィードバック」を一体化。
- **差別化**：献立生成ではなく、**"不足栄養素の即指摘＋今すぐの解決アクション"** と **"次回のワークアウト具体提案"** に特化。
- **運用思想**：**端末内集計（端末内SQLite）** で高速・低コスト。AIは**短文助言の生成のみに限定**。

---

## 1. ペルソナ / 提供価値

- **対象**：20–40代、週2–5回の筋トレ、食事は自炊＋コンビニが中心、数字管理が好き。
- **課題**：
    
    -（A）食事記録が続かない → **バーコード/お気に入り/履歴で"ほぼワンタップ"**
    
    -（B）栄養不足に気づけない → **残P・残kcalメーター＋不足量の即指摘**
    
    -（C）トレの手応えが曖昧 → **部位/ボリューム達成率＋次アクション提案**

---

## 2. 機能スコープ（MVP）

### 2.1 食事ログ

- 検索 / バーコード読取（日本食品成分表＋Nutritionix UPC）
- お気に入り（クイック追加）・直近履歴から追加
- 100g基準に正規化、**P/F/C/kcalを即時計算**（端末内）

### 2.2 ワークアウトログ

- **Freeでも手入力可**（種目・セット・重量・レップ・RPE）
- 直近コピー、セット自動増分、部位別ボリューム集計
- HealthKit / Health Connect 同期（1日1回）。Proは高頻度（将来）

### 2.3 ダッシュボード & スコア

- **今日のスコア（Free）**：栄養・トレの総合指標
- **週/月スコア（Pro）**：グラフ・推移・ベスト更新
- 折れ線：**努力（トレ/摂取） × 成果（体重）** の関連可視化

### 2.4 AIフィードバック

- **食事AI**：不足/過剰の即指摘＋**具体策**（例：プロテイン1杯/コンビニ代替）
- **トレAI**：部位バランス、休養提案、**次回のセット/重量**提案
- **クロス洞察（Pro）**：食事×トレの相関コメント（例：糖質不足→パフォ低下）

### 2.5 通知 / 行動喚起

- 夜20時に**不足タンパク質**を通知 → 1タップで記録画面へ
- 連続達成（ストリーク）と簡易バッジ

---

## 3. プラン別機能（MVP）

| 機能 | Free | Pro（¥980/月） |
| --- | --- | --- |
| 食事ログ（検索/バーコード/お気に入り） | 1日5件まで | 無制限 |
| 履歴保存 | 30日（端末内） | 無制限 |
| ダッシュボード | 今日のみ | 週/月あり |
| AIフィードバック | 今日のみ（短文） | 週/月＋クロス洞察（リッチ） |
| 広告 | あり | なし |
| 同期頻度 | 1日1回 | 将来：高頻度（15分） |

---

## 4. オンボーディング（4画面）

1. 基本プロフィール：性別／生年／身長／体重
2. 目標設定：減量/増量/維持＋優先順位＋期間
3. トレ習慣：週頻度／環境（自宅/ジム）／経験レベル
4. 準備完了：**今日の目標** 表示 → 「食事を記録」「トレを記録」CTA

> 食事習慣/通知嗜好などは利用の文脈で後出し質問（離脱低減）

---

## 5. 技術スタック（React Native実装版）

### フロントエンド

- **React Native（Expo SDK 53）**：iOS/Android
- **TypeScript**：型安全性
- **react-i18next**：多言語対応
- **victory-native**：グラフ表示
- **Expo Updates**：OTA更新

### ナビゲーション・UI

- **@react-navigation/native**：ナビゲーション
- **@react-navigation/bottom-tabs**：タブナビゲーション
- **react-native-gesture-handler**：ジェスチャー処理
- **react-native-safe-area-context**：セーフエリア対応
- **@expo/vector-icons**：アイコン

### データ管理

- **expo-sqlite**：ローカルデータベース（SQLite）
- **@react-native-async-storage/async-storage**：設定値保存
- **zustand**：状態管理

### ネイティブ機能

- **expo-camera**：カメラアクセス
- **expo-barcode-scanner**：バーコード読取
- **expo-notifications**：プッシュ通知
- **expo-health**（将来）：HealthKit/Health Connect連携

### 課金・サブスク

- **RevenueCat React Native SDK**
    - iOS: StoreKit統合
    - Android: Google Play Billing統合
    - サブスクリプション管理

### バックエンド（最小構成）

- **Supabase**
    - Authentication（匿名→本登録）
    - PostgreSQL（ユーザーデータ同期）
    - Edge Functions（AI処理）
- **OpenAI API**：AIフィードバック生成

### 分析・モニタリング

- **Firebase Analytics**：イベント分析
- **Crashlytics**：クラッシュレポート
- **Sentry React Native**：エラー監視

---

## 6. AI I/O 仕様（固定スキーマ）

### 入力（サーバ/API）

```json
{
  "locale": "ja-JP",
  "profile": {"goal":"cut","bw_kg":72,"target_protein_g":140},
  "today": {
    "nutrition": {"kcal":1850,"target_kcal":2200,"p":112,"f":76,"c":180},
    "training": {"sets":24,"exercises":6,"days_in_a_row":3}
  },
  "weekly": null,
  "flags": {"protein_gap_g":28,"fat_over_g":12},
  "capabilities": {"weekly": false, "monthly": false}
}
```

### 出力（クライアント適用）

```json
{
  "scores": { "nutrition_today": 82, "training_today": 74, "total_today": 78 },
  "messages": [
    {
      "type": "nutrition",
      "text_key": "feedback.nutrition.protein_gap",
      "params": { "gap_g": 28 },
      "severity": "warning"
    },
    {
      "type": "training",
      "text_key": "feedback.training.lower_body_low",
      "params": { "suggest_sets": 1 }
    }
  ],
  "actions": [
    {
      "id": "log_protein",
      "action_type": "open_log_food",
      "label_key": "actions.log_protein",
      "params": { "default_amount_g": 25 }
    },
    {
      "id": "open_quick_buy",
      "action_type": "open_nearby_options",
      "label_key": "actions.supplement_nearby_quick",
      "params": { "channel": "convenience", "protein_target_g": 20 }
    }
  ],
  "context": {
    "locale": "ja-JP",
    "region": "JP",
    "unit": { "weight": "kg", "energy": "kcal" }
  }
}
```

> 注意：スコアはアプリ側で計算して値を渡す（LLMに採点させない）。

---

## 7. データモデル（Expo SQLite版）

### 食事記録テーブル

```sql
CREATE TABLE IF NOT EXISTS food_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  date TEXT NOT NULL,
  meal_type TEXT CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
  food_id TEXT,
  food_name TEXT,
  amount_g REAL NOT NULL,
  protein_g REAL,
  fat_g REAL,
  carb_g REAL,
  kcal REAL,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0
);
```

### 食品マスタテーブル（100g基準）

```sql
CREATE TABLE IF NOT EXISTS food_db (
  food_id TEXT PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT,
  barcode TEXT,
  brand TEXT,
  category TEXT,
  p100 REAL DEFAULT 0,
  f100 REAL DEFAULT 0,
  c100 REAL DEFAULT 0,
  kcal100 REAL DEFAULT 0,
  source TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_barcode ON food_db(barcode);
CREATE INDEX IF NOT EXISTS idx_food_favorite ON food_db(is_favorite);
CREATE INDEX IF NOT EXISTS idx_food_name ON food_db(name_ja);
```

### ワークアウト関連テーブル

```sql
CREATE TABLE IF NOT EXISTS workout_session (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  date TEXT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  notes TEXT,
  total_volume_kg REAL DEFAULT 0,
  synced BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_set (
  set_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  exercise_id INTEGER,
  set_number INTEGER,
  weight_kg REAL,
  reps INTEGER,
  rpe REAL,
  rest_seconds INTEGER,
  FOREIGN KEY (session_id) REFERENCES workout_session(session_id)
);

CREATE TABLE IF NOT EXISTS exercise_master (
  exercise_id INTEGER PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT,
  muscle_group TEXT,
  equipment TEXT,
  is_compound BOOLEAN DEFAULT 0
);
```

### ユーザー設定・同期管理テーブル

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  goal TEXT CHECK(goal IN ('cut','bulk','maintain')),
  target_kcal INTEGER,
  target_protein_g INTEGER,
  target_fat_g INTEGER,
  target_carb_g INTEGER,
  weight_kg REAL,
  height_cm REAL,
  birth_year INTEGER,
  gender TEXT,
  activity_level TEXT,
  preferred_unit TEXT DEFAULT 'metric',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT,
  operation TEXT,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0
);
```

---

## 8. 実装アーキテクチャ

### ディレクトリ構造

```
/src
├── screens/
│   ├── onboarding/
│   ├── nutrition/
│   ├── workout/
│   ├── dashboard/
│   └── settings/
├── components/
│   ├── common/
│   ├── nutrition/
│   └── workout/
├── navigation/
├── services/
│   ├── database/
│   │   ├── DatabaseService.ts
│   │   ├── migrations/
│   │   └── repositories/
│   ├── sync/
│   └── api/
├── stores/
│   ├── authStore.ts
│   ├── nutritionStore.ts
│   ├── workoutStore.ts
│   └── settingsStore.ts
├── hooks/
├── utils/
├── types/
└── locales/
    ├── ja/
    └── en/
```

### データ層実装

- **DatabaseService.ts**：SQLite初期化・管理
- **FoodRepository.ts**：食事CRUD操作
- **WorkoutRepository.ts**：トレーニングCRUD操作
- **UserRepository.ts**：ユーザー設定管理
- **SyncService.ts**：オフライン同期
- **QueueManager.ts**：同期キュー管理

---

## 9. 主要イベント（GA4）

- `login`
- `onboarding_complete`
- `log_food`
- `add_favorite_food`
- `scan_barcode_success`
- `food_limit_hit`
- `log_workout_set`
- `copy_last_set`
- `add_exercise`
- `view_dashboard`
- `tap_upgrade`
- `purchase_success`
- `ai_feedback_shown`
- `ai_action_clicked`
- `push_opened`
- `streak_day_completed`

---

## 10. 非機能要件

**応答**：主要操作 ≤ 300ms（SQLiteローカル処理）
**オフライン**：完全オフライン動作対応、ネットワーク復帰時に自動同期
**データサイズ**：SQLiteデータベース最大100MB想定
**同時実行**：SQLiteトランザクション管理で整合性保証
**多言語**：ja / en（次は ko）。単位とPaywallコピーも切替

---

## 11. セキュリティ / 法務

- PHI/要配慮情報は最小収集・暗号化。利用目的の明示
- 医療類似表現NG：「一般的な栄養ガイドライン」「提案」トーンに統一
- プライバシーポリシー、利用規約、特商法表記整備

---

## 12. リリース計画（目安）

**Phase 1（2週）**：基本UI、SQLiteセットアップ、食事ログ基本機能
**Phase 2（2週）**：トレーニングログ、ダッシュボード
**Phase 3（2週）**：AIフィードバック統合、スコア計算
**Phase 4（2週）**：RevenueCat統合、Pro機能
**Phase 5（2週）**：バーコード、通知、最適化
**Phase 6（2週）**：テスト、バグ修正、ストア申請

---

## 13. KPI（初期目標）

- WAU/MAU ≥ 55%
- D7 継続率 ≥ 40%
- Free→Pro 転換 ≥ 5%
- Pro 510人で月商 ≈ 100万円（手数料除く前）

---

## 14. MVP実装順序

1. **Expo SQLiteセットアップ**
    - データベース初期化
    - マイグレーション管理
    - 基本CRUD実装
2. **食事ログUI**
    - 検索機能（SQLite全文検索）
    - お気に入り管理
    - 履歴表示
3. **栄養計算ロジック**
    - 100g基準→実量変換
    - PFC/カロリー集計
    - 目標との差分計算
4. **トレーニングログ**
    - セット記録
    - ボリューム計算
    - 前回記録コピー
5. **ダッシュボード**
    - 今日のスコア表示
    - 進捗グラフ（victory-native）
    - 統計表示
6. **AIフィードバック**
    - Supabase Edge Functions経由
    - OpenAI API連携
    - フォールバック処理
7. **課金システム**
    - RevenueCat SDK統合
    - Paywall実装
    - Pro機能ゲート
8. **通知・同期**
    - ローカル通知
    - バックグラウンド同期
    - オフライン対応

---

## 15. 既知の非採用 / 後回し

- AI献立生成、ミールキット連携（当面やらない）
- ガーミン/フィットビット高頻度同期（MAU増後に）
- Next.js（PWA/LP/管理画面）は公開直前〜運用で導入
