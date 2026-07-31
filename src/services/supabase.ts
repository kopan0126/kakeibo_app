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
//   ストールしても reject されず固まる事象への保険。タイムアウトで AbortError にする）
//
// ただし auth/DB と同じ短いタイムアウトを Edge Function / Storage にも一律に掛けると、
// レシートOCR（Claude Vision・画像送信）やアカウント削除（サーバ側の連鎖削除）など
// 本来10秒を超える処理まで途中で中断してしまう。エンドポイント種別でタイムアウトを分ける。
const TIMEOUT_MS = 10000; // auth / REST（DB）向けの短いタイムアウト
const LONG_TIMEOUT_MS = 60000; // Edge Function / Storage 向けの長いタイムアウト

function timeoutFor(input: RequestInfo | URL, init: RequestInit): number {
  const url =
    typeof input === 'string' ? input
    : input instanceof URL ? input.href
    : input.url;
  // Edge Function（claude-proxy の OCR / delete-account）と Storage（画像アップロード）は長め
  if (url.includes('/functions/v1/') || url.includes('/storage/v1/')) {
    return LONG_TIMEOUT_MS;
  }
  // REST（DB）への書き込みは途中で abort してもサーバ側のコミットは取り消せない。
  // 短いタイムアウトだと「クライアントはエラー表示・サーバは保存済み」となり、
  // ユーザーのリトライで取引が二重登録される。書き込み（非 GET/HEAD）は
  // ストール保険として長いタイムアウトのみ掛け、短い abort は読み取り専用にする。
  const method = (init.method ?? 'GET').toUpperCase();
  if (url.includes('/rest/v1/') && method !== 'GET' && method !== 'HEAD') {
    return LONG_TIMEOUT_MS;
  }
  return TIMEOUT_MS;
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  // 呼び出し元が既に signal を渡している場合はそれを尊重し、二重に abort しない
  if (init.signal) {
    return fetch(input, init);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutFor(input, init));
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
