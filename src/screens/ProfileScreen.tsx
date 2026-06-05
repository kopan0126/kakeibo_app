import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '../stores/authStore';
import { updateProfile, uploadAvatar, linkEmail, signOut } from '../services/auth';
import { purchaseMonthly, restorePurchases } from '../services/purchases';
import { supabase } from '../services/supabase';
import { AI } from '../theme/aizome';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, setUser, isPremium, setPremium } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null);
  // メール登録（匿名ユーザー向け）
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [linkPasswordInput, setLinkPasswordInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const isAnonymous = !user?.email || user.email === '';
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要', '写真ライブラリへのアクセスを許可してください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0].uri) return;

    setIsUploading(true);
    try {
      // 200x200にリサイズ
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (!manipulated.base64 || !user) throw new Error('画像の変換に失敗');

      const { url, error } = await uploadAvatar(user.id, manipulated.base64);
      if (error) {
        Alert.alert('エラー', error.message);
        return;
      }

      if (url) {
        setAvatarUrl(url);
        // DBも更新
        await updateProfile(user.id, { avatar_url: url });
        setUser({ ...user, avatar_url: url });
      }
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('入力エラー', 'ニックネームを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateProfile(user.id, {
        display_name: displayName.trim(),
      });

      if (error) {
        Alert.alert('エラー', error.message);
        return;
      }

      setUser({ ...user, display_name: displayName.trim() });
      Alert.alert('保存完了', 'プロフィールを更新しました', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
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

  async function handlePurchase() {
    setIsPurchasing(true);
    try {
      const success = await purchaseMonthly();
      if (success) {
        setPremium(true);
        Alert.alert('登録完了', 'プレミアムプランへようこそ！広告が非表示になりました。');
      }
    } catch (e: any) {
      // ユーザーが購入をキャンセルした場合は無視
      if (!e?.userCancelled) {
        Alert.alert('エラー', e?.message ?? '購入処理に失敗しました。');
      }
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestore() {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        setPremium(true);
        Alert.alert('復元完了', 'プレミアムプランが復元されました。');
      } else {
        Alert.alert('復元結果', '有効なサブスクリプションが見つかりませんでした。');
      }
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? '復元に失敗しました。');
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleLinkEmail() {
    if (!linkEmailInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkEmailInput)) {
      Alert.alert('入力エラー', '正しいメールアドレスを入力してください');
      return;
    }
    if (linkPasswordInput.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上で入力してください');
      return;
    }
    setIsLinking(true);
    try {
      const { error } = await linkEmail(linkEmailInput.trim(), linkPasswordInput);
      if (error) { Alert.alert('エラー', error.message); return; }
      setUser({ ...user!, email: linkEmailInput.trim() });
      Alert.alert('登録完了', 'メールアドレスを登録しました。確認メールをご確認ください。', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* アバター */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isUploading}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {displayName?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            {isUploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>タップして変更</Text>
        </View>

        {/* ニックネーム入力 */}
        <View style={styles.field}>
          <Text style={styles.label}>ニックネーム</Text>
          <TextInput
            style={styles.fieldInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="表示名を入力"
            maxLength={20}
            returnKeyType="done"
          />
          <Text style={styles.hint}>{displayName.length}/20文字</Text>
        </View>

        {/* メールアドレス */}
        <View style={styles.field}>
          <Text style={styles.label}>メールアドレス</Text>
          {isAnonymous
            ? <Text style={styles.guestBadge}>📧 未登録（ゲスト）</Text>
            : <Text style={styles.readOnly}>{user?.email}</Text>}
        </View>

        {/* 保存ボタン */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color={AI.brass} /> : <Text style={styles.saveBtnText}>保存する</Text>}
        </TouchableOpacity>

        {/* メール登録セクション（匿名ユーザーのみ） */}
        {isAnonymous && (
          <View style={styles.linkSection}>
            <View style={styles.linkHeader}>
              <Text style={styles.linkTitle}>メールアドレスを登録する</Text>
              <Text style={styles.linkSubtitle}>登録するとデータを安全に保存・引き継ぎできます</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor={AI.textSoft}
              value={linkEmailInput}
              onChangeText={setLinkEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="パスワード（6文字以上）"
              placeholderTextColor={AI.textSoft}
              value={linkPasswordInput}
              onChangeText={setLinkPasswordInput}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.linkBtn, isLinking && { opacity: 0.6 }]}
              onPress={handleLinkEmail}
              disabled={isLinking}
            >
              {isLinking
                ? <ActivityIndicator color={AI.brass} />
                : <Text style={styles.linkBtnText}>登録する</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* プレミアムプランセクション */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>
              {isPremium ? '★ プレミアムプラン' : 'プレミアムプラン'}
            </Text>
            <View style={[styles.premiumBadge, isPremium && styles.premiumBadgeActive]}>
              <Text style={[styles.premiumBadgeText, isPremium && styles.premiumBadgeTextActive]}>
                {isPremium ? '有効' : '無料'}
              </Text>
            </View>
          </View>

          {isPremium ? (
            <>
              <Text style={styles.premiumDesc}>
                すべての広告が非表示になっています{'\n'}
                ・レシートスキャンの広告をスキップ{'\n'}
                ・バナー広告を非表示
              </Text>
              <Text style={styles.premiumManageHint}>
                解約はApp Store / Google Playのサブスクリプション管理から行えます
              </Text>
            </>
          ) : (
            <>
              <View style={styles.premiumPriceRow}>
                <Text style={styles.premiumPrice}>¥480</Text>
                <Text style={styles.premiumPricePer}> / 月（税込）</Text>
              </View>
              <Text style={styles.premiumDesc}>
                ・レシートスキャンの広告をスキップ{'\n'}
                ・バナー広告を非表示{'\n'}
                ・いつでも解約可能
              </Text>
              <TouchableOpacity
                style={[styles.premiumUpgradeBtn, isPurchasing && { opacity: 0.6 }]}
                onPress={handlePurchase}
                disabled={isPurchasing}
              >
                {isPurchasing
                  ? <ActivityIndicator color={AI.brass} />
                  : <Text style={styles.premiumUpgradeText}>プレミアムプランに登録する →</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.premiumRestoreBtn, isRestoring && { opacity: 0.6 }]}
                onPress={handleRestore}
                disabled={isRestoring}
              >
                {isRestoring
                  ? <ActivityIndicator color={AI.textSoft} size="small" />
                  : <Text style={styles.premiumRestoreText}>購入を復元する</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* アプリ情報セクション */}
        <View style={styles.infoSection}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => Linking.openURL('https://kopan0126.github.io/kakeibo_app/privacy-policy.html')}
          >
            <Text style={styles.infoRowText}>プライバシーポリシー</Text>
            <Text style={styles.infoRowArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => Linking.openURL('https://kopan0126.github.io/kakeibo_app/terms-of-service.html')}
          >
            <Text style={styles.infoRowText}>利用規約</Text>
            <Text style={styles.infoRowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>家計簿 v1.0.0</Text>

        {/* アカウント削除 */}
        <TouchableOpacity
          style={[styles.deleteAccountBtn, isDeleting && { opacity: 0.6 }]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting
            ? <ActivityIndicator color={AI.danger} />
            : <Text style={styles.deleteAccountText}>アカウントを削除する</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { padding: 24 },

  // アバター
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: AI.indigo, justifyContent: 'center', alignItems: 'center',
  },
  avatarPlaceholderText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: AI.washi, justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  editBadgeText: { fontSize: 16 },
  avatarHint: { fontSize: 12, color: '#9E9E9E', marginTop: 8 },

  // フィールド
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: AI.textSoft, marginBottom: 6, fontWeight: '600' },
  fieldInput: {
    backgroundColor: AI.washi2, borderRadius: 12, padding: 14,
    fontSize: 16, color: AI.text,
    borderWidth: 1, borderColor: AI.rule,
  },
  hint: { fontSize: 11, color: '#9E9E9E', textAlign: 'right', marginTop: 4 },
  readOnly: {
    backgroundColor: AI.washi2, borderRadius: 12, padding: 14,
    fontSize: 15, color: AI.textSoft,
    borderWidth: 1, borderColor: AI.rule,
  },

  guestBadge: {
    fontSize: 14, color: AI.textSoft, fontStyle: 'italic',
    backgroundColor: AI.washi2, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: AI.rule,
  },

  // 保存ボタン
  saveBtn: {
    backgroundColor: AI.indigo, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { color: AI.brass, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // メール登録セクション
  linkSection: {
    marginTop: 28, borderTopWidth: 1, borderTopColor: AI.rule, paddingTop: 24,
  },
  linkHeader: { marginBottom: 16 },
  linkTitle: { fontSize: 15, fontWeight: 'bold', color: AI.indigo, marginBottom: 4 },
  linkSubtitle: { fontSize: 12, color: AI.textSoft },
  input: {
    backgroundColor: AI.washi2, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: AI.text,
    borderWidth: 1, borderColor: AI.rule, marginBottom: 12,
  },
  linkBtn: {
    backgroundColor: AI.indigo, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  linkBtnText: { color: AI.brass, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },

  // プレミアムプラン
  premiumSection: {
    marginTop: 28, borderTopWidth: 1, borderTopColor: AI.rule, paddingTop: 24,
  },
  premiumHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  premiumTitle: { fontSize: 16, fontWeight: 'bold', color: AI.indigo },
  premiumBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: AI.washi2, borderWidth: 1, borderColor: AI.rule,
  },
  premiumBadgeActive: { backgroundColor: AI.brass, borderColor: AI.brass },
  premiumBadgeText: { fontSize: 12, color: AI.textSoft, fontWeight: '600' },
  premiumBadgeTextActive: { color: AI.indigo },
  premiumDesc: {
    fontSize: 13, color: AI.textSoft, lineHeight: 20, marginBottom: 16,
  },
  premiumPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  premiumPrice: { fontSize: 28, fontWeight: 'bold', color: AI.indigo },
  premiumPricePer: { fontSize: 14, color: AI.textSoft },
  premiumUpgradeBtn: {
    backgroundColor: AI.indigo, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    marginTop: 4,
  },
  premiumUpgradeText: { color: AI.brass, fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
  premiumRestoreBtn: {
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  premiumRestoreText: { color: AI.textSoft, fontSize: 13 },
  premiumManageHint: {
    fontSize: 12, color: AI.textSoft, lineHeight: 18,
    backgroundColor: AI.washi2, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: AI.rule, marginTop: 4,
  },

  // アプリ情報
  infoSection: {
    marginTop: 28, borderTopWidth: 1, borderTopColor: AI.rule, paddingTop: 8,
    backgroundColor: AI.washi2, borderRadius: 12,
    borderWidth: 1, borderColor: AI.rule,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  infoRowText: { fontSize: 15, color: AI.text },
  infoRowArrow: { fontSize: 20, color: AI.textSoft },
  infoDivider: { height: 1, backgroundColor: AI.rule, marginHorizontal: 16 },
  versionText: {
    textAlign: 'center', fontSize: 12, color: AI.textSoft,
    marginTop: 24, marginBottom: 8,
  },

  // アカウント削除
  deleteAccountBtn: {
    marginTop: 32, marginBottom: 16,
    borderWidth: 1, borderColor: AI.danger, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  deleteAccountText: { color: AI.danger, fontSize: 14, fontWeight: '600' },
});
