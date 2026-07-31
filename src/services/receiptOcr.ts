import { callClaudeViaEdge } from './claudeApi';
import type { ParsedReceipt } from '../types';

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT =
  'あなたはレシートや給与明細を解析するAIです。画像から情報を抽出し、必ずJSON形式のみで返答してください。JSONのみ返してください。マークダウンや説明文は不要です。';

const USER_PROMPT = `この画像を解析してください。
レシート・領収書・給与明細・クレジットカード明細のどれかを判定し、以下のJSON形式で返してください：

{
  "type": "receipt" または "salary" または "invoice" または "unknown",
  "storeName": "店舗名または会社名（不明ならnull）",
  "date": "YYYY-MM-DD形式（不明ならnull）",
  "totalAmount": 「合計」ラベルの税込金額（円、不明ならnull）,
  "items": [{"name": "品目名", "amount": 金額}],
  "suggestedCategory": "支出なら 食費/交通費/日用品/外食/娯楽/医療/衣類/サブスク/税金/その他、収入なら 給与/副業/お年玉 のいずれか",
  "transactionType": "expense" または "income",
  "confidence": "high" または "medium" または "low"
}

totalAmount の決め方（最重要・必ず守る）：
1. 金額の隣にあるラベル文字を必ず読む。「合計」「税込合計」「お買上げ計」「ご請求額」とラベルされた金額だけを totalAmount にする。
2. 「お預かり」「お預り」「現金」「クレジット」「電子マネー」「○○ペイ」「ポイント」などの支払・受取額や、「お釣り」「釣銭」は totalAmount にしない（レシート下部にあり金額が大きいことが多いが無視する）。
3. items には購入品のみ。小計・消費税・合計・お預かり・お釣りの行は入れない。

例：「小計 1,580」「合計 1,580」「お預かり 2,000」「お釣り 420」とある場合
→ totalAmount は 1580（合計の額）。2000（お預かり）や 420（お釣り）は誤り。

給与明細の場合は totalAmount に手取り額（差引支給額）を入れてください。`;

export async function parseReceiptImage(base64: string): Promise<ParsedReceipt | null> {
  try {
    const mediaType = base64.startsWith('/9j') ? 'image/jpeg' : 'image/png';

    const text = await callClaudeViaEdge({
      action: 'ocr',
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      }],
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed: ParsedReceipt = JSON.parse(jsonMatch[0]);

    if (parsed.totalAmount == null) return null;

    return parsed;
  } catch (e) {
    console.error('Receipt OCR failed:', e);
    if (e instanceof SyntaxError) {
      return {
        type: 'unknown',
        storeName: null,
        date: null,
        totalAmount: null,
        items: [],
        suggestedCategory: 'その他',
        transactionType: 'expense',
        confidence: 'low',
      };
    }
    return null;
  }
}
