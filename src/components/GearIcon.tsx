// 歯車アイコン（カテゴリ管理ボタン用）
// claude.ai/design「gear-icon」由来。和紙色(chip)の本体＋藍(indigo)の輪郭、真鍮(brass)の細リングと軸心。
// 8枚の台形歯は 4枚 × 2レイヤー（片方を 45°回転）を重ねた構造。viewBox 0 0 100 100。
import Svg, { G, Path, Circle } from 'react-native-svg';
import { AI } from '../theme/aizome';

type Props = {
  size?: number; // 一辺(px)。1:1
  bodyColor?: string; // 本体の塗り（既定: 和紙クリーム chip）
  strokeColor?: string; // 輪郭の線色（既定: 藍）
  accentColor?: string; // 真鍮リング・軸心（既定: 真鍮）
};

// 4枚の台形歯（上下左右）。レイヤーで再利用する。
const TEETH = 'M44 14 L56 14 L57.5 26 L42.5 26 Z M44 86 L56 86 L57.5 74 L42.5 74 Z '
  + 'M14 44 L14 56 L26 57.5 L26 42.5 Z M86 44 L86 56 L74 57.5 L74 42.5 Z';

export default function GearIcon({
  size = 18,
  bodyColor = AI.chip,
  strokeColor = AI.indigo,
  accentColor = AI.brass,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* 8枚の台形歯（4枚 + 45°回転した4枚） */}
      <G fill={bodyColor} stroke={strokeColor} strokeWidth="4" strokeLinejoin="round">
        <Path d={TEETH} />
        <Path d={TEETH} transform="rotate(45 50 50)" />
      </G>
      {/* 本体 */}
      <Circle cx="50" cy="50" r="26" fill={bodyColor} stroke={strokeColor} strokeWidth="4" />
      {/* 真鍮の細リング */}
      <Circle cx="50" cy="50" r="14" fill="none" stroke={accentColor} strokeWidth="3.2" />
      {/* 真鍮の軸心 */}
      <Circle cx="50" cy="50" r="5" fill={accentColor} stroke={strokeColor} strokeWidth="2.4" />
    </Svg>
  );
}
