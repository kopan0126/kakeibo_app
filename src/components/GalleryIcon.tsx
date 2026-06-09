// ギャラリーアイコン（レシート・明細スキャンの「ギャラリから選択」用）
// claude.ai/design「receipt-scan」由来。藍（indigo）の額縁＋山並み線に真鍮（brass）の太陽。
// viewBox 0 0 100 80（5:4）を維持し、size で幅を指定する。CameraIcon と線の太さ・パレットを揃える。
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { AI } from '../theme/aizome';

type Props = {
  size?: number; // 幅(px)。高さは 4:5 比率で自動算出
  bodyColor?: string; // 額縁・山並みの線色（既定: 藍）
  sunColor?: string; // 太陽の色（既定: 真鍮）
};

export default function GalleryIcon({
  size = 40,
  bodyColor = AI.indigo,
  sunColor = AI.brass,
}: Props) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
      <Rect x="10" y="12" width="80" height="56" rx="6" fill="none" stroke={bodyColor} strokeWidth="4" />
      <Circle cx="34" cy="30" r="6" fill="none" stroke={sunColor} strokeWidth="4" />
      <Path
        d="M14 60 L38 38 L56 52 L72 42 L86 60"
        fill="none"
        stroke={bodyColor}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
