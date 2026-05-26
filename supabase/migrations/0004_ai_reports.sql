-- AI振り返りレポートテーブル
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  target_date DATE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 同日・同種別の重複防止
CREATE UNIQUE INDEX idx_ai_reports_unique
  ON ai_reports(user_id, report_type, target_date);

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のレポートのみ閲覧可能
CREATE POLICY "users can read own reports"
  ON ai_reports FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のレポートを作成可能
CREATE POLICY "users can insert own reports"
  ON ai_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
