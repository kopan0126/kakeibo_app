// Supabase Edge Function: Claude API Proxy
// クライアントから直接APIキーを使わず、サーバー側で安全にClaude APIを呼ぶ

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// レート制限: ユーザーごとに1分あたり最大10回
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 環境変数チェック ──
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return jsonResponse({ error: 'サーバー設定エラー (API key missing)' }, 500);
    }

    // ── 認証チェック ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '認証が必要です' }, 401);
    }

    // JWTトークンを抽出
    const token = authHeader.replace('Bearer ', '');

    // Service Role Key で Supabase クライアントを作り、トークンからユーザー情報を取得
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth failed:', authError?.message ?? 'no user');
      return jsonResponse({ error: '認証に失敗しました' }, 401);
    }

    console.log(`Request from user=${user.id.slice(0, 8)}...`);

    // ── レート制限チェック ──
    if (!checkRateLimit(user.id)) {
      return jsonResponse({ error: 'リクエストが多すぎます。しばらくお待ちください。' }, 429);
    }

    // ── リクエストボディ解析 ──
    const body = await req.json();
    const { action, model, max_tokens, system, messages } = body;

    if (!model || !messages) {
      return jsonResponse({ error: 'model と messages は必須です' }, 400);
    }

    console.log(`Calling Claude: action=${action}, model=${model}`);

    // ── Claude API 呼び出し ──
    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: max_tokens ?? 512,
        system: system ?? undefined,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const errorText = await claudeRes.text();
      console.error(`Claude API error [${action}]:`, claudeRes.status, errorText);
      return jsonResponse({ error: `AI処理でエラーが発生しました (${claudeRes.status})` }, claudeRes.status);
    }

    const data = await claudeRes.json();
    console.log(`Claude response OK: action=${action}`);

    return jsonResponse(data, 200);
  } catch (err) {
    console.error('Edge Function error:', err);
    return jsonResponse({ error: `サーバーエラー: ${String(err)}` }, 500);
  }
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
