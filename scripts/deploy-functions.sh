#!/bin/bash

# Supabase Edge Functions デプロイスクリプト

echo "🚀 Supabase Edge Functions をデプロイしています..."

# Supabase CLIがインストールされているかチェック
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLIがインストールされていません"
    echo "📦 インストール: npm install -g supabase"
    exit 1
fi

# ログイン確認
echo "🔐 Supabaseにログインしています..."
supabase auth status

# 関数をデプロイ
echo "📤 nutrition-feedback 関数をデプロイ中..."
supabase functions deploy nutrition-feedback

echo "📤 workout-suggestion 関数をデプロイ中..."
supabase functions deploy workout-suggestion

# 環境変数の設定（OpenAI API Key）
echo "🔧 環境変数を設定中..."
echo "⚠️  OpenAI API Keyを設定してください:"
echo "supabase secrets set OPENAI_API_KEY=your-api-key"

echo "✅ デプロイ完了！"
echo "🔍 関数の状態確認: supabase functions list"
echo "📋 ログ確認: supabase functions logs"