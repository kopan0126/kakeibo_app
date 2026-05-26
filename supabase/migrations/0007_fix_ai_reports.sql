-- ============================================================
-- ai_reports テーブル再作成
-- 0001_init.sql の古いスキーマ（group_id, period_key）を
-- 正しいスキーマ（user_id, target_date, scope）に修正
-- ============================================================

-- 古いテーブルを削除（新規利用なので既存データなし想定）
DROP TABLE IF EXISTS public.ai_reports CASCADE;

-- 正しいスキーマで再作成
CREATE TABLE public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  target_date DATE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  scope TEXT NOT NULL DEFAULT 'personal',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ユニークインデックス（user + type + date + scope で一意）
CREATE UNIQUE INDEX idx_ai_reports_unique
  ON public.ai_reports(user_id, report_type, target_date, scope);

-- RLS 有効化
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分のレポートのみ閲覧
CREATE POLICY "reports_select_own" ON public.ai_reports
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: 自分のレポートを作成
CREATE POLICY "reports_insert_own" ON public.ai_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE: 自分のレポートを削除（再生成時に必要）
CREATE POLICY "reports_delete_own" ON public.ai_reports
  FOR DELETE USING (auth.uid() = user_id);
