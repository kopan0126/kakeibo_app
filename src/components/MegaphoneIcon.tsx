// メガホンアイコン（レシートスキャン画面の広告通知ピル用）
// claude.ai/design「receipt-scan」由来。藍（indigo）のホーン本体＋真鍮（brass）の音波。
// viewBox 0 0 100 80（5:4）を維持し、size で幅を指定する。
import Svg, { Rect, Path } from 'react-native-svg';
import { AI } from '../theme/aizome';

type Props = {
  size?: number; // 幅(px)。高さは 4:5 比率で自動算出
  bodyColor?: string; // ホーン本体の線色（既定: 藍）
  waveColor?: string; // 音波の色（既定: 真鍮）
};

export default function MegaphoneIcon({
  size = 22,
  bodyColor = AI.indigo,
  waveColor = AI.brass,
}: Props) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
      <Path d="M14 40 L62 18 L62 62 Z" fill="none" stroke={bodyColor} strokeWidth="4" strokeLinejoin="round" />
      <Rect x="62" y="32" width="14" height="16" rx="2" fill="none" stroke={bodyColor} strokeWidth="4" />
      <Path d="M82 30 Q90 40 82 50" fill="none" stroke={waveColor} strokeWidth="4" strokeLinecap="round" />
      <Path d="M30 49 L34 66" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}
