import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
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
    getCurrentUser().then((profile) => {
      setUser(profile);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setUser(null);
          setLoading(false);
          return;
        }
        const profile = await getCurrentUser();
        setUser(profile);
        setLoading(false);
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

  // ユーザーが確定したら RevenueCat を初期化してプレミアム状態を同期
  useEffect(() => {
    if (!user) {
      setPremium(false);
      return;
    }
    initializePurchases(user.id)
      .then(() => checkPremiumStatus())
      .then(setPremium)
      .catch(console.error);
  }, [user?.id, setPremium]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C9A55C" />
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
    backgroundColor: '#F1E8D3',
  },
});
