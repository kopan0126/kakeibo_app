import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '../stores/authStore';
import { updateProfile, uploadAvatar, linkEmail } from '../services/auth';
import { AI } from '../theme/aizome';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null);
  // メール登録（匿名ユーザー向け）
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [linkPasswordInput, setLinkPasswordInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const isAnonymous = !user?.email || user.email === '';
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      <ScrollView contentContainerStyle={styles.content}>
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
});
