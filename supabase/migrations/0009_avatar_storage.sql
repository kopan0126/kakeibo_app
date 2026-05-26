-- ============================================================
-- アバター画像用 Storage バケット
-- Supabase ダッシュボード → Storage → New Bucket でも作成可能
-- ============================================================

-- バケット作成（public で誰でも閲覧可、アップロードは認証ユーザーのみ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- アップロードポリシー：自分のフォルダのみ
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 更新ポリシー：自分のファイルのみ上書き可
CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 削除ポリシー：自分のファイルのみ削除可
CREATE POLICY "avatar_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 閲覧ポリシー：public バケットなので全員閲覧可
CREATE POLICY "avatar_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');
