import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useGroupStore } from '../stores/groupStore';
import { useViewStore } from '../stores/viewStore';
import { signOut } from '../services/auth';
import { createGroup, joinGroup, getMyGroup } from '../services/family';
import { AI } from '../theme/aizome';

export default function FamilySetupScreen() {
  const { user, setUser } = useAuthStore();
  const { group, setGroup } = useGroupStore();
  const { selectedScope, setScope } = useViewStore();
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyGroup(user.id)
      .then((g) => {
        setGroup(g);
      })
      .finally(() => setIsChecking(false));
  }, [user]);

  async function handleCreate() {
    if (!groupName.trim() || !user) return;
    setIsLoading(true);
    try {
      const g = await createGroup(groupName.trim(), user.id);
      setGroup(g);
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
      setGroup(g);
      setInviteCode('');
      Alert.alert('参加完了', `「${g.name}」に参加しました`);
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setGroup(null);  }

  if (isChecking) {
    return <View style={styles.center}><ActivityIndicator color={AI.indigo} size="large" /></View>;
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
          <TouchableOpacity
            style={[styles.modeBtn, group && selectedScope === group.id && styles.modeBtnActiveGroup, !group && { opacity: 0.4 }]}
            onPress={() => { if (group) setScope(group.id); }}
            disabled={!group}
          >
            <Text style={styles.modeEmoji}>👨‍👩‍👧</Text>
            <Text style={[styles.modeBtnText, group && selectedScope === group.id && styles.modeBtnTextActive]}>
              {group ? group.name : 'グループ未参加'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* グループ情報 */}
      {group ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>グループ情報</Text>
          <Text style={styles.groupName}>👨‍👩‍👧 {group.name}</Text>
          <Text style={styles.label}>招待コード</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{group.invite_code}</Text>
          </View>
          <Text style={styles.hint}>このコードを家族に共有すると同じグループに参加できます</Text>
        </View>
      ) : (
        <>
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
        </>
      )}

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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: AI.washi2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: AI.rule,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: AI.text, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
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
    backgroundColor: AI.indigo, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 8,
  },
  code: { fontSize: 28, fontWeight: 'bold', letterSpacing: 4, color: AI.brass },
  hint: { fontSize: 12, color: AI.textSoft, textAlign: 'center' },
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
    borderWidth: 1, borderColor: '#E53935', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  signOutText: { color: '#E53935', fontWeight: 'bold', fontSize: 15 },
});
