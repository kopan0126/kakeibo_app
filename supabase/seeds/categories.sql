-- デフォルトカテゴリ（group_id=NULL, is_default=TRUE）
INSERT INTO public.categories (name, icon, color, type, group_id, is_default) VALUES
  -- 支出
  ('食費',     '🍚', '#4CAF50', 'expense', NULL, true),
  ('交通費',   '🚃', '#2196F3', 'expense', NULL, true),
  ('日用品',   '🛒', '#FF9800', 'expense', NULL, true),
  ('外食',     '🍜', '#F44336', 'expense', NULL, true),
  ('娯楽',     '🎮', '#9C27B0', 'expense', NULL, true),
  ('医療',     '💊', '#E91E63', 'expense', NULL, true),
  ('衣類',     '👕', '#00BCD4', 'expense', NULL, true),
  ('その他',   '📦', '#9E9E9E', 'expense', NULL, true),
  -- 収入
  ('給与',     '💰', '#FFC107', 'income',  NULL, true),
  ('副業',     '💻', '#4CAF50', 'income',  NULL, true),
  ('その他収入','🎁', '#2196F3', 'income',  NULL, true)
ON CONFLICT DO NOTHING;
