// カメラアイコン（レシート・明細スキャン用）
// claude.ai/design「camera-icon」由来。藍（indigo）の本体線＋真鍮（brass）のレンズ環。
// viewBox 0 0 100 80（5:4）を維持し、size で幅を指定する。
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { AI } from '../theme/aizome';

type Props = {
  size?: number; // 幅(px)。高さは 4:5 比率で自動算出
  bodyColor?: string; // 本体・シャッターの線色（既定: 藍）
  lensColor?: string; // レンズ環の色（既定: 真鍮）
};

export default function CameraIcon({
  size = 40,
  bodyColor = AI.indigo,
  lensColor = AI.brass,
}: Props) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
      <Rect x="8" y="22" width="84" height="50" rx="10" fill="none" stroke={bodyColor} strokeWidth="4" />
      <Path d="M34 22 L40 12 L60 12 L66 22" fill="none" stroke={bodyColor} strokeWidth="4" strokeLinejoin="round" />
      <Circle cx="50" cy="47" r="15" fill="none" stroke={lensColor} strokeWidth="4" />
      <Circle cx="50" cy="47" r="5" fill={bodyColor} />
    </Svg>
  );
}
