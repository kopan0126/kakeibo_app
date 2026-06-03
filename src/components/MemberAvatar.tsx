import { View, Text, Image, StyleSheet } from 'react-native';
import { AI } from '../theme/aizome';

type Props = {
  name: string;
  avatarUrl: string | null;
  size?: number;
};

/**
 * グループメンバーのアバターを表示する共通コンポーネント。
 * avatar_url があれば画像を、無ければ表示名の頭文字を藍色の丸で描画する。
 */
export default function MemberAvatar({ name, avatarUrl, size = 28 }: Props) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  // 表示名があれば頭文字、無ければ人型アイコン（「?」は出さない）
  const initial = (name ?? '').trim().charAt(0);
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * (initial ? 0.45 : 0.5) }]}>
        {initial || '👤'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: AI.indigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: { color: AI.brass, fontWeight: 'bold' },
});
