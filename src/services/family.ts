import { supabase } from './supabase';
import type { FamilyGroup, FamilyMember } from '../types';

export async function getMyGroup(userId: string): Promise<FamilyGroup | null> {
  const { data } = await supabase
    .from('family_members')
    .select('group_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (!data) return null;

  const { data: group } = await supabase
    .from('family_groups')
    .select('*')
    .eq('id', data.group_id)
    .single();

  return group ?? null;
}

export async function createGroup(name: string, ownerId: string): Promise<FamilyGroup> {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .insert({ name, owner_id: ownerId, invite_code: inviteCode })
    .select()
    .single();

  if (groupError) throw new Error(groupError.message);

  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ group_id: group.id, user_id: ownerId, role: 'owner' });

  if (memberError) throw new Error(memberError.message);

  return group;
}

export async function joinGroup(inviteCode: string, userId: string): Promise<FamilyGroup> {
  const { data: group, error } = await supabase
    .from('family_groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (error || !group) throw new Error('招待コードが見つかりません');

  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ group_id: group.id, user_id: userId, role: 'member' });

  if (memberError) throw new Error(memberError.message);

  return group;
}

export async function getMembers(groupId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('group_id', groupId);

  if (error) throw new Error(error.message);
  return data ?? [];
}
