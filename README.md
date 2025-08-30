# FitMealPartner

**筋トレユーザー向け食事・ワークアウト統合管理アプリ**

FitMealPartner は、筋力トレーニングを行うユーザーのために設計された、食事記録とワークアウト記録を一体化したモバイルアプリケーションです。栄養管理とトレーニング管理をスムーズに連携させ、効率的な体づくりをサポートします。

## 🚀 主な機能

### 📊 ダッシュボード

- **今日のスコア**: 栄養摂取とワークアウトの総合評価
- **進捗グラフ**: 日々の成果を視覚的に表示
- **AI フィードバック**: パーソナライズされたアドバイス
- **統計カード**: 主要指標の一覧表示

### 🍽️ 栄養管理

- **食事記録**: 朝食・昼食・夕食・間食の詳細記録
- **検索機能**: 豊富な食品データベースから検索
- **お気に入り**: よく食べる食品をワンタップで追加
- **栄養分析**: PFC（タンパク質・脂質・炭水化物）とカロリーの自動計算
- **進捗トラッキング**: 目標に対する達成度を円形プログレスで表示

### 💪 ワークアウト管理

- **セット記録**: 重量・回数・RPE の詳細記録
- **エクササイズ管理**: 豊富な種目データベース
- **プレビュー機能**: ワークアウト開始前の計画確認
- **履歴追跡**: 過去のパフォーマンス比較
- **部位別分析**: 筋肉グループごとのボリューム管理

### 📱 ユーザビリティ

- **直感的な UI**: 使いやすいデザインシステム
- **高速検索**: 食品・エクササイズの素早い検索
- **オフライン対応**: ネットワークなしでも基本機能が利用可能
- **データ同期**: クラウドバックアップ（将来実装予定）

## 🛠️ 技術スタック

### フロントエンド

- **React Native** (0.79.5) - クロスプラットフォーム開発
- **Expo SDK** (~53.0.22) - 開発・デプロイメント
- **TypeScript** (~5.8.3) - 型安全性
- **React Navigation** (^6.1.17) - ナビゲーション
- **Zustand** (^4.5.0) - 状態管理

### UI/UX

- **Lucide React Native** (^0.460.0) - アイコンライブラリ
- **Victory Native** (^36.8.6) - チャート・グラフ
- **React Native Gesture Handler** (~2.24.0) - ジェスチャー処理
- **React Native Safe Area Context** (5.4.0) - セーフエリア対応

### データ管理

- **Expo SQLite** (^15.2.14) - ローカルデータベース
- **AsyncStorage** (2.1.2) - 設定値保存
- **Date-fns** (^3.0.0) - 日付処理

### 国際化・多言語対応

- **i18next** (^23.7.0) - 国際化フレームワーク
- **react-i18next** (^13.5.0) - React 統合

## 📁 プロジェクト構造

```
src/
├── components/           # 再利用可能なコンポーネント
│   └── common/          # 共通UIコンポーネント
├── design-system/       # デザインシステム
│   ├── colors.ts        # カラーパレット
│   ├── typography.ts    # フォント設定
│   ├── spacing.ts       # スペーシング定義
│   └── shadows.ts       # シャドウ効果
├── screens/             # スクリーンコンポーネント
│   ├── dashboard/       # ダッシュボード画面
│   ├── nutrition/       # 栄養管理画面
│   ├── workout/         # ワークアウト画面
│   └── profile/         # プロフィール画面
├── hooks/               # カスタムフック
├── services/            # サービス層
│   └── database/        # データベース関連
├── stores/              # 状態管理
├── navigation/          # ナビゲーション設定
└── utils/               # ユーティリティ関数
```

## 🚀 セットアップ

### 必要な環境

- Node.js (16.0.0 以上)
- npm または yarn
- Expo CLI
- iOS Simulator (iOS 開発の場合)
- Android Studio (Android 開発の場合)

### インストール

1. リポジトリをクローン

```bash
git clone [repository-url]
cd fitmealpartner
```

2. 依存関係をインストール

```bash
npm install
```

3. 開発サーバーを起動

```bash
npm start
```

### 利用可能なスクリプト

```bash
npm start          # Expo開発サーバーを起動
npm run android    # Android版を起動
npm run ios        # iOS版を起動
npm run web        # Web版を起動
npm test           # テストを実行
npm run lint       # ESLintによるコード解析
```

## 🎨 デザインシステム

### カラーパレット

- **プライマリー**: 青系統のブランドカラー
- **栄養素別カラー**:
  - タンパク質: 緑 (#10B981)
  - 脂質: 薄いピンク (#F472B6)
  - 炭水化物: オレンジ (#FF9800)
  - カロリー: 青 (#3B82F6)

### タイポグラフィ

- システムフォントを基調とした読みやすい設計
- 階層的なフォントサイズ設定
- 重要度に応じたフォントウェイト

### コンポーネント設計

- **アトミックデザイン**を基にした階層構造
- **一貫性**のある UI/UX
- **再利用性**を重視したコンポーネント設計

## 📱 対応プラットフォーム

- **iOS** 12.0 以上
- **Android** API Level 21 以上
- **Web** (PWA 対応予定)

## 🔮 今後の機能拡張予定

### Near Term (3 ヶ月以内)

- [ ] バーコードスキャナー機能
- [ ] AI フィードバック機能の強化
- [ ] HealthKit/Health Connect 連携
- [ ] プッシュ通知機能

### Long Term (6 ヶ月〜1 年)

- [ ] サブスクリプション機能 (RevenueCat)
- [ ] クラウド同期・バックアップ (Supabase)
- [ ] ソーシャル機能・友達追加
- [ ] 栄養士・トレーナー連携機能
- [ ] Apple Watch / Wear OS 対応

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 📧 お問い合わせ

プロジェクトに関するお問い合わせは、Issue または直接連絡ください。

---

**FitMealPartner** - あなたの理想的な体づくりをサポートします 💪🥗
