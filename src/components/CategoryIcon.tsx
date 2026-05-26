import { Text, Image } from 'react-native';

/** icon が画像URI（data:image / http / file）かどうかを判定 */
export function isImageIcon(icon: string): boolean {
  return (
    icon.startsWith('data:image') ||
    icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    icon.startsWith('file://')
  );
}

type Props = {
  icon: string;
  size?: number;
};

/**
 * カテゴリアイコンを表示する共有コンポーネント。
 * 絵文字文字列は <Text>、画像URI は <Image> で描画する。
 */
export default function CategoryIcon({ icon, size = 22 }: Props) {
  if (isImageIcon(icon)) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  return <Text style={{ fontSize: size, lineHeight: size + 4 }}>{icon}</Text>;
}
