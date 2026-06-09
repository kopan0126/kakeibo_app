// カスタムカテゴリ追加フォーム用の和モダン線画アイコン
// claude.ai/design「add-category」由来。藍(indigo)＋真鍮(brass)＋和紙(chip)のパレットで統一。
//  - BillStackIcon : 支出（札束の重なり）
//  - PouchIcon     : 収入（巾着＝小判袋）
//  - TargetIcon    : プレビューのプレースホルダ（弓道の的＋矢）
import Svg, { Rect, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { AI } from '../theme/aizome';

type IconProps = {
  size?: number;
  inkColor?: string; // 主線（既定: 藍）
  brassColor?: string; // 差し色（既定: 真鍮）
  fillColor?: string; // 面の塗り（既定: 和紙クリーム）
};

// 支出 — 札束。面を和紙色で塗るため、トグル選択時（朱地）でも藍線のまま映えるので再着色しない。
export function BillStackIcon({
  size = 52,
  inkColor = AI.indigo,
  brassColor = AI.brass,
  fillColor = AI.chip,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform="rotate(-9 50 50)">
        <Rect x="16" y="20" width="68" height="40" rx="3" fill={fillColor} stroke={inkColor} strokeWidth="3.6" strokeLinejoin="round" />
      </G>
      <Rect x="12" y="40" width="76" height="42" rx="3" fill={fillColor} stroke={inkColor} strokeWidth="3.6" strokeLinejoin="round" />
      <Circle cx="50" cy="61" r="11" fill="none" stroke={brassColor} strokeWidth="3" />
      <SvgText x="50" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill={inkColor}>¥</SvgText>
      <Path d="M20 47 L28 47" stroke={brassColor} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M72 75 L80 75" stroke={brassColor} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

// 収入 — 巾着。輪郭線のみなので、選択時（朱地）は線をクリーム＋淡金へ反転させて視認性を保つ。
export function PouchIcon({
  size = 52,
  inkColor = AI.indigo,
  brassColor = AI.brass,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M30 46 Q30 38 38 35 L62 35 Q70 38 70 46 L74 72 Q74 82 64 82 L36 82 Q26 82 26 72 Z"
        fill="none" stroke={inkColor} strokeWidth="3.6" strokeLinejoin="round"
      />
      <Path d="M30 42 L70 42" stroke={inkColor} strokeWidth="3" strokeLinecap="round" />
      <Path d="M44 26 Q50 22 56 26 Q53 30 50 30 Q47 30 44 26 Z" fill="none" stroke={brassColor} strokeWidth="3" strokeLinejoin="round" />
      <Path d="M50 30 L50 35" stroke={brassColor} strokeWidth="3" strokeLinecap="round" />
      <SvgText x="50" y="68" textAnchor="middle" fontSize="20" fontWeight="700" fill={brassColor}>¥</SvgText>
    </Svg>
  );
}

// プレビューのプレースホルダ — 的＋矢
export function TargetIcon({
  size = 42,
  inkColor = AI.indigo,
  brassColor = AI.brass,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="28" fill="none" stroke={inkColor} strokeWidth="3.6" />
      <Circle cx="50" cy="50" r="18" fill="none" stroke={inkColor} strokeWidth="3" />
      <Circle cx="50" cy="50" r="8" fill={brassColor} stroke={inkColor} strokeWidth="2.4" />
      <Path d="M70 30 L48 52" stroke={inkColor} strokeWidth="3.4" strokeLinecap="round" />
      <Path d="M70 30 L76 26 L74 34 Z" fill={brassColor} stroke={inkColor} strokeWidth="2" />
      <Path d="M70 30 L66 24 L74 26 Z" fill={brassColor} stroke={inkColor} strokeWidth="2" />
    </Svg>
  );
}
