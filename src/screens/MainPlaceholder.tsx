import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { signOut } from '../services/auth';
import { AI } from '../theme/aizome';

export default function MainPlaceholder() {
  const { user, setUser } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ようこそ！</Text>
      <Text style={styles.name}>{user?.display_name || user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>ログアウト</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AI.washi },
  title: { fontSize: 28, fontWeight: 'bold', color: AI.text, marginBottom: 8 },
  name: { fontSize: 18, color: AI.indigo, marginBottom: 24 },
  button: { backgroundColor: '#E53935', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
