import { supabase } from './supabase';
import type { FamilyGroup, FamilyMember } from '../types';

export async function getMyGroups(userId: string): Promise<FamilyGroup[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('family_members')
    .select('group_id')
    .eq('user_id', userId);

  if (memberError) throw new Error('グループ情報の取得に失敗しました');
  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const { data: groups, error: groupError } = await supabase
    .from('family_groups')
    .select('*')
    .in('id', groupIds);

  if (groupError) throw new Error('グループ情報の取得に失敗しました');
  return groups ?? [];
}

export async function createGroup(name: string, ownerId: string): Promise<FamilyGroup> {
  // invite_code は DB の DEFAULT (gen_random_bytes) で自動生成される
  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .insert({ name, owner_id: ownerId })
    .select()
    .single();

  if (groupError) throw new Error(groupError.message);

  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ group_id: group.id, user_id: ownerId, role: 'owner' });

  if (memberError) throw new Error(memberError.message);

  return group;
}

export async function joinGroup(inviteCode: string, _userId: string): Promise<FamilyGroup> {
  // 招待コードの検証と参加はサーバー側の SECURITY DEFINER 関数で行う
  // （クライアントから group_id を直接指定して family_members に INSERT することは不可）
  const { data, error } = await supabase
    .rpc('join_group_by_invite', { p_invite_code: inviteCode });

  if (error) {
    if (error.message.includes('invalid_invite_code')) {
      throw new Error('招待コードが見つかりません');
    }
    if (error.message.includes('already_member:')) {
      const groupName = error.message.split('already_member:')[1] ?? '';
      throw new Error(`すでに「${groupName}」に参加しています`);
    }
    throw new Error(error.message);
  }

  return data as FamilyGroup;
}

export type MemberProfile = { display_name: string; avatar_url: string | null };

type ProfileRow = { id: string; display_name: string; avatar_url: string | null };

function toProfileMap(rows: ProfileRow[]): Record<string, MemberProfile> {
  const map: Record<string, MemberProfile> = {};
  for (const u of rows) {
    map[u.id] = { display_name: u.display_name, avatar_url: u.avatar_url };
  }
  return map;
}

// 取引の user_id 群から、表示用のプロフィール（名前・アバター）をまとめて取得する。
// 相手（同グループメンバー）の users 行は RLS の適用状態に依存して取れないことが
// あったため、RLS をバイパスする SECURITY DEFINER 関数 get_member_profiles を使う。
// 関数が未適用の環境でも壊れないよう、失敗時は従来の直接クエリにフォールバックする。
export async function getMemberProfiles(
  userIds: string[],
): Promise<Record<string, MemberProfile>> {
  const ids = Array.from(new Set(userIds));
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .rpc('get_member_profiles', { p_user_ids: ids });

  if (!error && data) {
    return toProfileMap(data as ProfileRow[]);
  }

  // フォールバック: 関数未適用などで RPC が失敗した場合は RLS 経由で直接取得
  const { data: rows, error: fbError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', ids);

  if (fbError) throw new Error(fbError.message);
  return toProfileMap((rows ?? []) as ProfileRow[]);
}

export async function getMembers(groupId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('group_id', groupId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
