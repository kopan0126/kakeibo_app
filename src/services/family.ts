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
