import { supabase } from './supabase';
import type { UserProfile } from '../types';

export type AuthError = { message: string };

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: UserProfile | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) return { user: null, error: { message: error.message } };
  if (!data.user) return { user: null, error: { message: 'ユーザー作成に失敗しました' } };

  const profile: UserProfile = {
    id: data.user.id,
    email: data.user.email ?? email,
    display_name: displayName,
    avatar_url: null,
    created_at: data.user.created_at,
  };

  return { user: profile, error: null };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: UserProfile | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { user: null, error: { message: error.message } };
  if (!data.user) return { user: null, error: { message: 'ログインに失敗しました' } };

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    user: profile ?? {
      id: data.user.id,
      email: data.user.email ?? email,
      display_name: '',
      avatar_url: null,
      created_at: data.user.created_at,
    },
    error: null,
  };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? { message: error.message } : null };
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile ?? null;
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; avatar_url?: string | null },
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) return { error: { message: error.message } };
  return { error: null };
}

// 匿名サインイン（メール登録なしで始める）
export async function signInAnonymously(): Promise<{ user: UserProfile | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return { user: null, error: { message: error.message } };
  if (!data.user) return { user: null, error: { message: '匿名サインインに失敗しました' } };

  // public.users に行が存在しない場合は作成
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    await supabase.from('users').insert({
      id: data.user.id,
      email: '',
      display_name: 'ゲスト',
      avatar_url: null,
    });
  }

  return {
    user: profile ?? {
      id: data.user.id,
      email: '',
      display_name: 'ゲスト',
      avatar_url: null,
      created_at: data.user.created_at,
    },
    error: null,
  };
}

// 匿名ユーザーにメール・パスワードを紐付けてアカウント昇格
export async function linkEmail(
  email: string,
  password: string,
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) return { error: { message: error.message } };

  // DB のメールアドレスも更新
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('users').update({ email }).eq('id', user.id);
  }
  return { error: null };
}

export async function uploadAvatar(
  userId: string,
  base64: string,
): Promise<{ url: string | null; error: AuthError | null }> {
  try {
    const fileName = `${userId}/avatar.jpg`;

    // base64 → Blob に変換
    const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, byteArray, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) return { url: null, error: { message: uploadError.message } };

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // キャッシュ破棄用にタイムスタンプ追加
    const url = `${data.publicUrl}?t=${Date.now()}`;
    return { url, error: null };
  } catch (e) {
    return { url: null, error: { message: String(e) } };
  }
}
