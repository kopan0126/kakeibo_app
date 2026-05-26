-- ============================================================
-- ai_reports の report_type に新タイプ追加
-- savings (節約チャレンジ), category (カテゴリ分析), family (家族比較)
-- ============================================================

-- 既存の CHECK 制約を削除して再作成
ALTER TABLE public.ai_reports
  DROP CONSTRAINT IF EXISTS ai_reports_report_type_check;

ALTER TABLE public.ai_reports
  ADD CONSTRAINT ai_reports_report_type_check
  CHECK (report_type IN ('daily', 'weekly', 'monthly', 'savings', 'category', 'family'));
