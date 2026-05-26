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
  "totalAmount": 合計金額の数値（税込み、円、不明ならnull）,
  "items": [{"name": "品目名", "amount": 金額}],
  "suggestedCategory": "食費/交通費/日用品/外食/娯楽/医療/衣類/給与/その他 のいずれか",
  "transactionType": "expense" または "income",
  "confidence": "high" または "medium" または "low",
  "rawText": "画像から読み取れたテキスト全文"
}

給与明細の場合は totalAmount に手取り額（差引支給額）を入れてください。`;

export async function parseReceiptImage(base64: string): Promise<ParsedReceipt | null> {
  try {
    const mediaType = base64.startsWith('/9j') ? 'image/jpeg' : 'image/png';

    const text = await callClaudeViaEdge({
      action: 'ocr',
      model: MODEL,
      max_tokens: 512,
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
        rawText: '',
      };
    }
    return null;
  }
}
