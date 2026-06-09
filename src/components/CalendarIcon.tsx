// カレンダーアイコン（暦画面の見出し用）
// claude.ai/design「calendar-icon」由来。藍（indigo）の本体・綴じ環＋真鍮（brass）の表紙帯と今日の丸。
// viewBox 0 0 100 80（5:4）を維持し、size で幅を指定する。CameraIcon と線の太さ・パレットを揃える。
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';
import { AI } from '../theme/aizome';

type Props = {
  size?: number; // 幅(px)。高さは 4:5 比率で自動算出
  bodyColor?: string; // 本体・綴じ環・日付ドットの線色（既定: 藍）
  accentColor?: string; // 表紙帯・今日の丸の色（既定: 真鍮）
};

export default function CalendarIcon({
  size = 40,
  bodyColor = AI.indigo,
  accentColor = AI.brass,
}: Props) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
      {/* 本体 */}
      <Rect x="8" y="18" width="84" height="54" rx="6" fill="none" stroke={bodyColor} strokeWidth="4" />
      {/* 表紙帯（真鍮アクセント） */}
      <Path d="M8 32 L92 32" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
      {/* 綴じ環 */}
      <Path d="M28 10 L28 24" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
      <Path d="M72 10 L72 24" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
      {/* 日付ドット（3×3 グリッド） */}
      <G fill={bodyColor}>
        <Circle cx="28" cy="46" r="2.6" />
        <Circle cx="50" cy="46" r="2.6" />
        <Circle cx="72" cy="46" r="2.6" />
        <Circle cx="28" cy="58" r="2.6" />
        <Circle cx="72" cy="58" r="2.6" />
      </G>
      {/* 今日（真鍮の丸で強調） */}
      <Circle cx="50" cy="58" r="5.5" fill={accentColor} />
    </Svg>
  );
}
