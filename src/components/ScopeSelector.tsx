import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useGroupStore } from '../stores/groupStore';
import { useViewStore } from '../stores/viewStore';
import { AI } from '../theme/aizome';

export default function ScopeSelector() {
  const { user } = useAuthStore();
  const { groups } = useGroupStore();
  const { selectedScope, setScope } = useViewStore();

  const personalLabel = user?.display_name || '自分だけ';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, selectedScope === 'personal' && styles.pillActive]}
        onPress={() => setScope('personal')}
      >
        <Text style={[styles.pillText, selectedScope === 'personal' && styles.pillTextActive]}>
          {personalLabel}
        </Text>
      </TouchableOpacity>
      {groups.map((g) => (
        <TouchableOpacity
          key={g.id}
          style={[styles.pill, selectedScope === g.id && styles.pillActive]}
          onPress={() => setScope(g.id)}
        >
          <Text style={[styles.pillText, selectedScope === g.id && styles.pillTextActive]}>
            {g.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AI.washi2,
    borderWidth: 1,
    borderColor: AI.rule,
  },
  pillActive: {
    backgroundColor: AI.indigo,
    borderColor: AI.indigo,
  },
  pillText: { fontSize: 13, color: AI.textSoft, fontWeight: '500' },
  pillTextActive: { color: AI.brass, fontWeight: 'bold' },
});
