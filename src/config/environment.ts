interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  isDevelopment: boolean;
}

const DEV_CONFIG: EnvironmentConfig = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  isDevelopment: true,
};

const PROD_CONFIG: EnvironmentConfig = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  isDevelopment: false,
};

export const ENV = __DEV__ ? DEV_CONFIG : PROD_CONFIG;

// 環境変数が設定されているか確認
if (!ENV.supabase.url || !ENV.supabase.anonKey) {
  console.warn('⚠️ Supabase環境変数が設定されていません。.envファイルを確認してください。');
}