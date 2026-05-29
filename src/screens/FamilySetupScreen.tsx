import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Share,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../stores/authStore';
import { useGroupStore } from '../stores/groupStore';
import { useViewStore } from '../stores/viewStore';
import { signOut } from '../services/auth';
import { createGroup, joinGroup, leaveGroup } from '../services/family';
import { AI } from '../theme/aizome';
import type { FamilyGroup } from '../types';

export default function FamilySetupScreen() {
  const { user, setUser } = useAuthStore();
  const { groups, setGroups, addGroup, removeGroup } = useGroupStore();
  const { selectedScope, setScope } = useViewStore();
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!groupName.trim() || !user) return;
    setIsLoading(true);
    try {
      const g = await createGroup(groupName.trim(), user.id);
      addGroup(g);
      setGroupName('');
      Alert.alert('グループ作成完了', `「${g.name}」を作成しました。\n\n招待コード: ${g.invite_code}\n\nこのコードを家族に共有してください。`);
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim() || !user) return;
    setIsLoading(true);
    try {
      const g = await joinGroup(inviteCode.trim(), user.id);
      addGroup(g);
      setInviteCode('');
      Alert.alert('参加完了', `「${g.name}」に参加しました`);
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsLoading(false);
    }
  }

  function handleLeave(g: FamilyGroup) {
    if (!user) return;
    const isOwner = g.owner_id === user.id;
    Alert.alert(
      'グループを退出',
      isOwner
        ? `「${g.name}」のオーナーです。退出するとグループが残りますが、管理者がいなくなります。本当に退出しますか？`
        : `「${g.name}」から退出しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '退出する',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(g.id, user.id);
              removeGroup(g.id);
              if (selectedScope === g.id) setScope('personal');
              Alert.alert('退出しました', `「${g.name}」から退出しました`);
            } catch (e) {
              Alert.alert('エラー', String(e));
            }
          },
        },
      ],
    );
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setGroups([]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 表示スコープ */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>表示スコープ</Text>
        <Text style={styles.filterHint}>ホーム・履歴・カレンダーに反映されます。</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, selectedScope === 'personal' && styles.modeBtnActive]}
            onPress={() => setScope('personal')}
          >
            <Text style={styles.modeEmoji}>👤</Text>
            <Text style={[styles.modeBtnText, selectedScope === 'personal' && styles.modeBtnTextActive]}>自分だけ</Text>
          </TouchableOpacity>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.modeBtn, selectedScope === g.id && styles.modeBtnActiveGroup]}
              onPress={() => setScope(g.id)}
            >
              <Text style={styles.modeEmoji}>👨‍👩‍👧</Text>
              <Text style={[styles.modeBtnText, selectedScope === g.id && styles.modeBtnTextActive]}>
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 所属グループ一覧 */}
      {groups.map((g) => (
        <View key={g.id} style={styles.card}>
          <Text style={styles.sectionTitle}>グループ情報</Text>
          <Text style={styles.groupName}>👨‍👩‍👧 {g.name}</Text>
          <Text style={styles.label}>招待コード</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{g.invite_code}</Text>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => {
              const link = Linking.createURL(`join/${g.invite_code}`);
              Share.share({
                message: `家計簿アプリで一緒に家計を管理しませんか？\n\n下のリンクからアプリを開いて自動参加できます👇\n${link}`,
              });
            }}
          >
            <Text style={styles.shareBtnText}>招待リンクを送る</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>リンクを受け取った人はアプリを開くだけで自動参加できます</Text>
          <TouchableOpacity style={styles.leaveBtn} onPress={() => handleLeave(g)}>
            <Text style={styles.leaveBtnText}>このグループから退出</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* グループ作成 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>グループを作成する</Text>
        <TextInput
          style={styles.input}
          placeholder="グループ名（例：田中家）"
          value={groupName}
          onChangeText={setGroupName}
        />
        <TouchableOpacity
          style={[styles.btn, styles.btnGreen, (!groupName.trim() || isLoading) && { opacity: 0.5 }]}
          onPress={handleCreate}
          disabled={!groupName.trim() || isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>作成する</Text>}
        </TouchableOpacity>
      </View>

      {/* 招待コードで参加 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>招待コードで参加する</Text>
        <TextInput
          style={styles.input}
          placeholder="6文字の招待コード"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.btn, styles.btnBlue, (!inviteCode.trim() || isLoading) && { opacity: 0.5 }]}
          onPress={handleJoin}
          disabled={!inviteCode.trim() || isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>参加する</Text>}
        </TouchableOpacity>
      </View>

      {/* アカウント */}
      <View style={styles.card}>
        <Text style={styles.accountLabel}>ログイン中: {user?.email}</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: AI.washi2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: AI.rule,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: AI.text, marginBottom: 12 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modeBtn: {
    flex: 1, minWidth: '40%', alignItems: 'center', paddingVertical: 16,
    borderRadius: 12, borderWidth: 2, borderColor: AI.rule, backgroundColor: AI.washi,
  },
  modeBtnActive: { borderColor: AI.indigo, backgroundColor: AI.indigo + '14' },
  modeBtnActiveGroup: { borderColor: AI.brass, backgroundColor: AI.brass + '14' },
  filterHint: { fontSize: 12, color: AI.textSoft, marginBottom: 12 },
  modeEmoji: { fontSize: 28, marginBottom: 6 },
  modeBtnText: { fontSize: 13, color: AI.textSoft, fontWeight: '500' },
  modeBtnTextActive: { color: AI.indigo, fontWeight: 'bold' },
  groupName: { fontSize: 20, fontWeight: 'bold', color: AI.text, marginBottom: 12 },
  label: { fontSize: 11, color: AI.textSoft, marginBottom: 8, fontWeight: '600', letterSpacing: 2 },
  codeBox: {
    backgroundColor: AI.indigo, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10,
  },
  code: { fontSize: 28, fontWeight: 'bold', letterSpacing: 4, color: AI.brass },
  shareBtn: {
    backgroundColor: AI.brass, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginBottom: 10,
  },
  shareBtnText: { color: AI.indigo, fontWeight: 'bold', fontSize: 15 },
  hint: { fontSize: 12, color: AI.textSoft, textAlign: 'center', marginBottom: 12 },
  leaveBtn: {
    borderWidth: 1, borderColor: AI.danger, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  leaveBtnText: { color: AI.danger, fontWeight: '600', fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: AI.rule, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12,
    backgroundColor: AI.washi, color: AI.text,
  },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnGreen: { backgroundColor: AI.indigo },
  btnBlue: { backgroundColor: AI.indigo },
  btnText: { color: AI.brass, fontWeight: 'bold', fontSize: 15 },
  accountLabel: { fontSize: 14, color: AI.textSoft, marginBottom: 12 },
  signOutBtn: {
    borderWidth: 1, borderColor: AI.danger, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  signOutText: { color: AI.danger, fontWeight: 'bold', fontSize: 15 },
});
