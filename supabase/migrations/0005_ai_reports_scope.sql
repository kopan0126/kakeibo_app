-- ai_reportsにscopeカラムを追加（個人 or グループID）
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'personal';

-- 既存のuniqueインデックスを削除してscope込みで再作成
DROP INDEX IF EXISTS idx_ai_reports_unique;

CREATE UNIQUE INDEX idx_ai_reports_unique
  ON ai_reports(user_id, report_type, target_date, scope);
