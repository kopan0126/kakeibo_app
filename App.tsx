import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './src/stores/authStore';
import { getCurrentUser } from './src/services/auth';
import { supabase } from './src/services/supabase';
import { requestPermissions } from './src/services/notification';
import AuthScreen from './src/screens/AuthScreen';
import MainNavigator from './src/screens/MainNavigator';

export default function App() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

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

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C9A55C" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
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
