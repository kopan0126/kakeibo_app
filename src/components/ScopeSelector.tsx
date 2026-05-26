import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGroupStore } from '../stores/groupStore';
import { useViewStore } from '../stores/viewStore';
import { AI } from '../theme/aizome';

export default function ScopeSelector() {
  const { group } = useGroupStore();
  const { selectedScope, setScope } = useViewStore();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, selectedScope === 'personal' && styles.pillActive]}
        onPress={() => setScope('personal')}
      >
        <Text style={[styles.pillText, selectedScope === 'personal' && styles.pillTextActive]}>
          自分だけ
        </Text>
      </TouchableOpacity>
      {group && (
        <TouchableOpacity
          style={[styles.pill, selectedScope === group.id && styles.pillActive]}
          onPress={() => setScope(group.id)}
        >
          <Text style={[styles.pillText, selectedScope === group.id && styles.pillTextActive]}>
            {group.name}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
