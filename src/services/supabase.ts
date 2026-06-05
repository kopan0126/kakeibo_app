import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or anon key is not set. Check your .env file.');
}

// ストール対策：通信が固まっても確実に reject させ、無限スピナーを防ぐ。
// （iOS スタンドアロンで数時間放置後、期限切れトークンのリフレッシュ通信が
//   ストールしても reject されず固まる事象への保険。10秒で AbortError にする）
const TIMEOUT_MS = 10000;
function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // React Native ではブラウザの Web Locks API が無いため、processLock を指定しないと
    // バックグラウンド→復帰時のトークンリフレッシュでロックが解放されずデッドロックする。
    // （iOS スタンドアロン/TestFlight で「数時間後に無限スピナー、完全終了で復活」する事象の根治）
    lock: processLock,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

// 前面/背面でトークン自動更新を制御する。背面で更新タイマーが空回りして
// 内部状態が壊れるのを防ぐ（Supabase 公式が RN で推奨する定石）。
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
