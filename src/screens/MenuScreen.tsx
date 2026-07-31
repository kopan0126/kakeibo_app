import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../utils/links';
import { AI } from '../theme/aizome';

type RowProps = {
  label: string;
  sublabel?: string;
  badge?: { text: string; active?: boolean };
  onPress: () => void;
  danger?: boolean;
};

function MenuRow({ label, sublabel, badge, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.rowMain}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.badge, badge.active && styles.badgeActive]}>
          <Text style={[styles.badgeText, badge.active && styles.badgeTextActive]}>{badge.text}</Text>
        </View>
      ) : null}
      <Text style={[styles.rowArrow, danger && styles.rowLabelDanger]}>›</Text>
    </TouchableOpacity>
  );
}

export default function MenuScreen({ navigation }: { navigation: any }) {
  const { user, setUser, isPremium } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const isAnonymous = !user?.email || user.email === '';

  function handleSignOut() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setUser(null);
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'アカウントを削除',
      'すべての家計データ・カテゴリ・グループ情報が完全に削除されます。この操作は取り消せません。本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              await signOut();
              setUser(null);
            } catch (e) {
              Alert.alert('エラー', 'アカウントの削除に失敗しました。しばらく待ってから再試行してください。');
              console.error('delete-account error:', e);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ユーザーカード */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>
                {user?.display_name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.display_name || 'ゲスト'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {isAnonymous ? '📧 メール未登録（ゲスト）' : user?.email}
            </Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        {/* アカウント */}
        <Text style={styles.sectionLabel}>アカウント</Text>
        <View style={styles.group}>
          <MenuRow label="プロフィール編集" onPress={() => navigation.navigate('Profile')} />
          <View style={styles.divider} />
          <MenuRow
            label="プレミアムプラン"
            sublabel={isPremium ? '広告非表示が有効です' : '広告を非表示にする'}
            badge={{ text: isPremium ? '有効' : '無料', active: isPremium }}
            onPress={() => navigation.navigate('Premium')}
          />
        </View>

        {/* データ */}
        <Text style={styles.sectionLabel}>データ</Text>
        <View style={styles.group}>
          <MenuRow label="家族設定" onPress={() => navigation.navigate('Family')} />
          <View style={styles.divider} />
          <MenuRow label="カテゴリ管理" onPress={() => navigation.navigate('CategoryManage')} />
        </View>

        {/* 情報 */}
        <Text style={styles.sectionLabel}>情報</Text>
        <View style={styles.group}>
          <MenuRow
            label="プライバシーポリシー"
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          />
          <View style={styles.divider} />
          <MenuRow
            label="利用規約"
            onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          />
        </View>

        {/* ログアウト・削除 */}
        <View style={styles.group}>
          <MenuRow label="ログアウト" onPress={handleSignOut} danger />
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, isDeleting && { opacity: 0.6 }]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting
            ? <ActivityIndicator color={AI.danger} />
            : <Text style={styles.deleteText}>アカウントを削除する</Text>}
        </TouchableOpacity>

        <Text style={styles.versionText}>家計簿 v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { padding: 20 },

  // ユーザーカード
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: AI.indigo, borderRadius: 16, padding: 16,
    marginBottom: 24,
  },
  userAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: AI.washi2 },
  userAvatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: AI.indigoSoft, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { fontSize: 24, color: AI.brass, fontWeight: 'bold' },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 17, fontWeight: 'bold', color: AI.washi },
  userEmail: { fontSize: 12, color: AI.brassSoft, marginTop: 4 },

  // セクション
  sectionLabel: {
    fontSize: 11, color: AI.textSoft, letterSpacing: 2,
    marginLeft: 4, marginBottom: 8, fontWeight: '600',
  },
  group: {
    backgroundColor: AI.washi2, borderRadius: 12,
    borderWidth: 1, borderColor: AI.rule,
    marginBottom: 24, overflow: 'hidden',
  },

  // 行
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
  },
  rowMain: { flex: 1 },
  rowLabel: { fontSize: 15, color: AI.text, fontWeight: '500' },
  rowLabelDanger: { color: AI.danger },
  rowSublabel: { fontSize: 11, color: AI.textSoft, marginTop: 3 },
  rowArrow: { fontSize: 22, color: AI.textSoft, marginLeft: 8 },
  divider: { height: 1, backgroundColor: AI.rule, marginHorizontal: 16 },

  // バッジ
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: AI.washi, borderWidth: 1, borderColor: AI.rule,
  },
  badgeActive: { backgroundColor: AI.brass, borderColor: AI.brass },
  badgeText: { fontSize: 11, color: AI.textSoft, fontWeight: '600' },
  badgeTextActive: { color: AI.indigo },

  // 削除
  deleteBtn: {
    borderWidth: 1, borderColor: AI.danger, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  deleteText: { color: AI.danger, fontSize: 14, fontWeight: '600' },

  versionText: {
    textAlign: 'center', fontSize: 12, color: AI.textSoft, marginTop: 24,
  },
});
