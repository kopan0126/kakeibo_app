import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { signIn, signUp, signInAnonymously } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import AsanohaBg from '../components/AsanohaBg';
import { AI } from '../theme/aizome';

// ATTリクエスト（iOS のみ・一度だけ表示される）
async function requestATT() {
  if (Platform.OS !== 'ios') return;
  try {
    await requestTrackingPermissionsAsync();
  } catch {
    // Expo Go など ATT 非対応環境では無視
  }
}

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);

  function validate(): string | null {
    if (!email.trim()) return 'メールアドレスを入力してください';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '正しいメールアドレスを入力してください';
    if (password.length < 6) return 'パスワードは6文字以上で入力してください';
    if (mode === 'signup' && !displayName.trim()) return '表示名を入力してください';
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      Alert.alert('入力エラー', validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const { user, error } = await signIn(email.trim(), password);
        if (error) { Alert.alert('ログインエラー', error.message); return; }
        await requestATT();
        setUser(user);
      } else {
        const { user, error } = await signUp(email.trim(), password, displayName.trim());
        if (error) { Alert.alert('登録エラー', error.message); return; }
        if (user) {
          await requestATT();
          Alert.alert('確認メールを送信しました', 'メールのリンクをクリックしてアカウントを有効化してください。');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuest() {
    setIsGuest(true);
    try {
      const { user, error } = await signInAnonymously();
      if (error) { Alert.alert('エラー', error.message); return; }
      await requestATT();
      setUser(user);
    } finally {
      setIsGuest(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 藍色ヒーロー部分 */}
      <View style={styles.hero}>
        <AsanohaBg opacity={0.35} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>家計簿</Text>
          <Text style={styles.heroSub}>賢く記録、豊かな暮らしへ</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          {/* モード切替タブ */}
          <View style={styles.tabRow}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'ログイン' : '新規登録'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="表示名"
              placeholderTextColor={AI.textSoft}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="none"
              returnKeyType="next"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            placeholderTextColor={AI.textSoft}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード（6文字以上）"
            placeholderTextColor={AI.textSoft}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity
            style={[styles.mainBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color={AI.brass} />
              : <Text style={styles.mainBtnText}>{mode === 'login' ? 'ログイン' : '登録する'}</Text>}
          </TouchableOpacity>

          {/* 区切り */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ゲストとして始めるボタン */}
          <TouchableOpacity
            style={[styles.guestBtn, isGuest && { opacity: 0.6 }]}
            onPress={handleGuest}
            disabled={isGuest}
          >
            {isGuest
              ? <ActivityIndicator color={AI.indigo} />
              : (
                <>
                  <Text style={styles.guestBtnText}>登録なしで始める</Text>
                  <Text style={styles.guestBtnSub}>後からプロフィールで登録できます</Text>
                </>
              )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AI.washi },
  flex: { flex: 1 },

  // ヒーロー
  hero: {
    backgroundColor: AI.indigo, paddingTop: 48, paddingBottom: 36,
    paddingHorizontal: 24, overflow: 'hidden',
  },
  heroContent: { position: 'relative' },
  heroTitle: {
    fontSize: 40, fontWeight: '700', color: AI.washi,
    letterSpacing: 4, marginBottom: 6,
  },
  heroSub: { fontSize: 13, color: AI.brassSoft, letterSpacing: 2 },

  // カード
  card: {
    flex: 1, backgroundColor: AI.washi,
    marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingTop: 28,
  },

  // タブ
  tabRow: {
    flexDirection: 'row', marginBottom: 24,
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: AI.rule,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: AI.washi2 },
  tabActive: { backgroundColor: AI.indigo },
  tabText: { fontSize: 14, fontWeight: '600', color: AI.textSoft },
  tabTextActive: { color: AI.brass },

  // 入力
  input: {
    backgroundColor: AI.washi2,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 12, color: AI.text,
    borderWidth: 1, borderColor: AI.rule,
  },

  // メインボタン
  mainBtn: {
    backgroundColor: AI.indigo, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  mainBtnText: { color: AI.brass, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // 区切り
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: AI.rule },
  dividerText: { paddingHorizontal: 12, fontSize: 12, color: AI.textSoft },

  // ゲストボタン
  guestBtn: {
    backgroundColor: AI.washi2, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: AI.rule,
  },
  guestBtnText: { color: AI.indigo, fontSize: 15, fontWeight: '600' },
  guestBtnSub: { color: AI.textSoft, fontSize: 11, marginTop: 3 },
});
