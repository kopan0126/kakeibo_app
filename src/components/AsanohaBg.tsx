// 麻の葉パターン背景コンポーネント
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export default function AsanohaBg({ opacity = 0.4, style }: Props) {
  return (
    <Svg
      style={[{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }, style]}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id="asanoha" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <Path
            d="M0 20 L20 0 L40 20 L20 40 Z"
            stroke="#C9A55C"
            strokeOpacity={opacity}
            fill="none"
            strokeWidth="0.5"
          />
          <Path
            d="M0 20 L20 20 M20 20 L20 0 M20 20 L40 20 M20 20 L20 40"
            stroke="#C9A55C"
            strokeOpacity={opacity}
            fill="none"
            strokeWidth="0.5"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#asanoha)" />
    </Svg>
  );
}
