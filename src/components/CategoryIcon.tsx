import { Text, Image } from 'react-native';
import { AIZOME_CATEGORY_ICONS, hasAizomeCategoryIcon } from './AizomeCategoryIcons';

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
  /** カテゴリ名。デフォルトカテゴリ名に一致すると藍染の線画アイコンを描画する */
  name?: string | null;
};

/**
 * カテゴリアイコンを表示する共有コンポーネント。
 * 1) カテゴリ名が藍染アイコンに一致し、かつ画像でなければ和の線画SVGを描画
 * 2) 画像URI は <Image>
 * 3) それ以外（絵文字文字列）は <Text>
 */
export default function CategoryIcon({ icon, size = 22, name }: Props) {
  if (!isImageIcon(icon) && hasAizomeCategoryIcon(name)) {
    const Glyph = AIZOME_CATEGORY_ICONS[name as string];
    return <Glyph size={size} />;
  }
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
