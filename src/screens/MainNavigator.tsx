import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from './HomeScreen';
import CalendarScreen from './CalendarScreen';
import AddTransactionScreen from './AddTransactionScreen';
import TransactionListScreen from './TransactionListScreen';
import ReportScreen from './ReportScreen';
import FamilySetupScreen from './FamilySetupScreen';
import ReceiptScanScreen from './ReceiptScanScreen';
import ReceiptConfirmScreen from './ReceiptConfirmScreen';
import CategoryManageScreen from './CategoryManageScreen';
import ProfileScreen from './ProfileScreen';
import { AI } from '../theme/aizome';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 藍染 漢字タブアイコン
function KanjiIcon({ kanji, label, focused }: { kanji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.kanjiWrap}>
      <View style={[styles.kanjiBox, focused && styles.kanjiBoxActive]}>
        <Text style={[styles.kanjiChar, focused && styles.kanjiCharActive]}>{kanji}</Text>
      </View>
      <Text style={[styles.kanjiLabel, focused && styles.kanjiLabelActive]}>{label}</Text>
    </View>
  );
}

// 入力タブ（真鍮アクセント）
function AddKanjiIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.kanjiWrap}>
      <View style={[styles.addKanjiBox, focused && styles.addKanjiBoxActive]}>
        <Text style={styles.addKanjiChar}>記</Text>
      </View>
      <Text style={[styles.kanjiLabel, { color: focused ? AI.brass : AI.textSoft }]}>記入</Text>
    </View>
  );
}

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AI.washi,
          borderTopColor: AI.rule,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <KanjiIcon kanji="家" label="ホーム" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => <KanjiIcon kanji="暦" label="暦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddTransactionScreen}
        options={{
          tabBarIcon: ({ focused }) => <AddKanjiIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={TransactionListScreen}
        options={{
          tabBarIcon: ({ focused }) => <KanjiIcon kanji="歴" label="履歴" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarIcon: ({ focused }) => <KanjiIcon kanji="析" label="分析" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen
        name="ReceiptScan"
        component={ReceiptScanScreen}
        options={{ headerShown: true, title: 'スキャン入力', headerBackTitle: '戻る' }}
      />
      <Stack.Screen
        name="ReceiptConfirm"
        component={ReceiptConfirmScreen}
        options={{ headerShown: true, title: '読み取り確認', headerBackTitle: '戻る' }}
      />
      <Stack.Screen
        name="Family"
        component={FamilySetupScreen}
        options={{ headerShown: true, title: '家族設定', headerBackTitle: '戻る' }}
      />
      <Stack.Screen
        name="CategoryManage"
        component={CategoryManageScreen}
        options={{ headerShown: true, title: 'カテゴリ管理', headerBackTitle: '戻る' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, title: 'プロフィール編集', headerBackTitle: '戻る' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  // 漢字アイコン共通
  kanjiWrap: { alignItems: 'center', justifyContent: 'center' },
  kanjiBox: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  kanjiBoxActive: {
    backgroundColor: AI.indigo,
  },
  kanjiChar: {
    fontSize: 18, fontWeight: '600', color: AI.indigo2,
  },
  kanjiCharActive: {
    color: AI.brass,
  },
  kanjiLabel: {
    fontSize: 9, color: AI.textSoft, marginTop: 2, letterSpacing: 1,
  },
  kanjiLabelActive: {
    color: AI.indigo,
  },
  // 記入ボタン（真鍮アクセント）
  addKanjiBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: AI.indigo,
    elevation: 4, shadowColor: AI.indigo,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6,
    marginBottom: 2,
  },
  addKanjiBoxActive: {
    backgroundColor: AI.indigoSoft,
  },
  addKanjiChar: {
    fontSize: 20, fontWeight: '700', color: AI.brass,
  },
});
