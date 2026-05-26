// Claude API 呼び出し（Supabase Edge Function 経由のみ）
// APIキーはサーバー側（Edge Function）で管理

import { supabase } from './supabase';

type ClaudeMessage = {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
};

type CallClaudeParams = {
  action: 'report' | 'ocr';
  model: string;
  max_tokens: number;
  system?: string;
  messages: ClaudeMessage[];
};

const TIMEOUT_MS = 30000;

export async function callClaudeViaEdge(params: CallClaudeParams): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`[ClaudeAPI] Edge Function calling (action=${params.action})...`);

    const { data, error } = await supabase.functions.invoke('claude-proxy', {
      body: params,
    });

    console.log('[ClaudeAPI] Edge Function response:', error ? `error: ${error.message}` : 'ok');

    if (error) {
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Edge Function returned empty response');
    }

    if (data.error) {
      throw new Error(`Edge Function returned error: ${data.error}`);
    }

    if (!data.content?.[0]?.text) {
      console.error('[ClaudeAPI] Unexpected response shape:', JSON.stringify(data).slice(0, 200));
      throw new Error('Unexpected response format from Edge Function');
    }

    return data.content[0].text;
  } finally {
    clearTimeout(timeout);
  }
}
