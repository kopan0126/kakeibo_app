import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './src/stores/authStore';
import { useGroupStore } from './src/stores/groupStore';
import { getCurrentUser } from './src/services/auth';
import { supabase } from './src/services/supabase';
import { joinGroup, getMyGroups } from './src/services/family';
import { requestPermissions } from './src/services/notification';
import { initializePurchases, checkPremiumStatus } from './src/services/purchases';
import { trackScreen } from './src/services/analytics';
import AuthScreen from './src/screens/AuthScreen';
import MainNavigator from './src/screens/MainNavigator';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from './src/types';
import * as AI from './src/theme/aizome';

// プロフィール取得に失敗してもセッションが有効ならアプリへ進めるための最小プロフィール
function fallbackProfile(authUser: User): UserProfile {
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    display_name: '',
    avatar_url: null,
    hidden_category_ids: [],
    created_at: authUser.created_at,
  };
}

function extractInviteCode(url: string): string | null {
  try {
    const parsed = Linking.parse(url);

    // ?code=XXXX 形式
    if (parsed.queryParams?.code) {
      return String(parsed.queryParams.code).trim() || null;
    }

    const segments = (parsed.path ?? '').split('/').filter(Boolean);

    // path に join/XXXX を含む（Expo Go: exp://.../--/join/XXXX → path='join/XXXX'）
    const joinIdx = segments.indexOf('join');
    if (joinIdx >= 0 && segments[joinIdx + 1]) {
      return segments[joinIdx + 1].trim() || null;
    }

    // standalone ビルド: kakeibo://join/XXXX → hostname='join', path='XXXX'
    if (parsed.hostname === 'join' && segments[0]) {
      return segments[0].trim() || null;
    }
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  const { user, isLoading, setUser, setLoading, setPremium } = useAuthStore();
  const { addGroup, setGroups } = useGroupStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  const pendingInviteRef = useRef<string | null>(null);
  const pendingNavigateRef = useRef<string | null>(null);
  const navReadyRef = useRef(false);

  async function handleInviteCode(code: string) {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      pendingInviteRef.current = code;
      return;
    }
    try {
      const g = await joinGroup(code, currentUser.id);
      addGroup(g);
      Alert.alert('参加完了', `「${g.name}」に参加しました`);
      if (navReadyRef.current) {
        navigationRef.current?.navigate('Family' as never);
      } else {
        pendingNavigateRef.current = 'Family';
      }
    } catch (e) {
      Alert.alert('参加エラー', String(e));
    }
  }

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        const code = extractInviteCode(url);
        if (code) handleInviteCode(code);
      }
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      const code = extractInviteCode(url);
      if (code) handleInviteCode(code);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    // 二重取得を解消: 直接の getCurrentUser() は廃止し、起動直後に必ず発火する
    // onAuthStateChange の INITIAL_SESSION に一本化する。
    // セッションがある場合はその user.id を渡し、getCurrentUser 内の冗長な
    // auth.getUser()（サーバ検証の往復）を省いてプロフィール取得だけにする。
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // TOKEN_REFRESHED はセッション更新のみで、ユーザー状態に変化なし。
        // ここで処理するとオブジェクト参照が変わり → setUser → 再レンダリング → 無限ループになる。
        if (event === 'TOKEN_REFRESHED') return;

        if (!session) {
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const profile = await getCurrentUser(session.user.id);
          if (profile) {
            setUser(profile);
          } else if (!useAuthStore.getState().user) {
            // users 行は 0010 のトリガーで必ず作成されるため、有効なセッションが
            // あるのに profile が取れないのはほぼ通信エラー。ここで null のまま
            // AuthScreen に落とすと「登録なしで始める」で新規匿名アカウントが
            // 作られ、既存アカウントのデータが永久に孤立する。セッション由来の
            // 最小プロフィールでアプリへ進め、表示名等は次回取得時に補完する。
            setUser(fallbackProfile(session.user));
          }
        } catch (e) {
          // プロフィール取得失敗（通信エラー等）でもローディングで固まらないようにする
          console.error('getCurrentUser failed:', e);
          if (!useAuthStore.getState().user) {
            setUser(fallbackProfile(session.user));
          }
        } finally {
          setLoading(false);
        }
      },
    );

    requestPermissions().catch(console.error);

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  // ログイン後にグループ一覧を取得 → 保留中の招待コードを順序保証で処理
  useEffect(() => {
    if (!user) {
      setGroups([]);
      return;
    }
    (async () => {
      try {
        const groups = await getMyGroups(user.id);
        setGroups(groups);
      } catch (e) {
        console.error(e);
        Alert.alert('読み込みエラー', 'グループ情報の取得に失敗しました。通信環境を確認してください。');
      }
      if (pendingInviteRef.current) {
        const code = pendingInviteRef.current;
        pendingInviteRef.current = null;
        await handleInviteCode(code);
      }
    })();
  }, [user?.id]);

  // AdMob 初期化：ATT許諾（iOS）→ SDK初期化（Expo Go ではスキップ）
  useEffect(() => {
    if (Constants.executionEnvironment === 'storeClient') return;
    (async () => {
      try {
        if (Platform.OS === 'ios') {
          await requestTrackingPermissionsAsync();
        }
        const { default: mobileAds } = require('react-native-google-mobile-ads') as {
          default: () => { initialize(): Promise<unknown> };
        };
        await mobileAds().initialize();
      } catch (e) {
        console.error('AdMob init failed:', e);
      }
    })();
  }, []);

  // ユーザーが確定したら RevenueCat を初期化してプレミアム状態を同期
  useEffect(() => {
    if (!user) {
      setPremium(false);
      return;
    }
    (async () => {
      try {
        await initializePurchases(user.id);
        const premium = await checkPremiumStatus();
        setPremium(premium);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user?.id, setPremium]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={AI.brass} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        linking={{
          prefixes: [Linking.createURL('/'), 'kakeibo://'],
          config: {
            screens: {
              Tabs: { screens: { Home: 'home' } },
              Family: 'join/:code',
            },
          },
        }}
        onReady={() => {
          navReadyRef.current = true;
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
          if (pendingNavigateRef.current) {
            navigationRef.current?.navigate(pendingNavigateRef.current as never);
            pendingNavigateRef.current = null;
          }
        }}
        onStateChange={() => {
          const current = navigationRef.current?.getCurrentRoute()?.name;
          if (current && current !== routeNameRef.current) {
            trackScreen(current);
            routeNameRef.current = current;
          }
        }}
      >
        <StatusBar style="auto" />
        {user ? <MainNavigator /> : <AuthScreen />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AI.washi,
  },
});
