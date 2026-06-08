import Svg, { Path, G, Circle, Rect, Ellipse, Text as SvgText } from 'react-native-svg';

/**
 * 藍染（Aizome）カテゴリアイコン — 絵文字を廃した和の家紋風線画。
 * 線の太さを揃え、真鍮（brass）の差し色を一点のみ添える「引き算」の意匠。
 * デザイン: claude.ai/design「カテゴリの紋」より。色は category-icons.html の固定パレット
 * （indigo + brass + cream）でカテゴリ色に依存しない。
 */
const INDIGO = '#15243F';
const BRASS = '#C9A55C';
const CREAM = '#FBF6E9';

// 図案は 0..100 座標系の内側 ~15..86 に描かれており周囲に余白がある。
// viewBox を内容ぎりぎりまで詰めて（全13図案のストローク端を内包する 12..88）
// 白枠いっぱいに大きく見せる。座標自体は変更しない（配置はそのまま拡大）。
const VIEW_BOX = '12 12 76 76';

type IconProps = { size?: number };

// 食費 — 茶碗 rice bowl
function FoodIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G fill="none" stroke={BRASS} strokeWidth={2.6} strokeLinecap="round">
        <Path d="M42 35 C38 31 38 26 42 22" />
        <Path d="M50 35 C46 31 46 26 50 22" />
        <Path d="M58 35 C54 31 54 26 58 22" />
      </G>
      <Path d="M26 50 Q50 58 74 50" fill="none" stroke={INDIGO} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M32 49 Q50 41 68 49" fill="none" stroke={BRASS} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M26 50 Q50 86 74 50" fill={CREAM} stroke={INDIGO} strokeWidth={2.6} strokeLinejoin="round" />
      <Path d="M44 69 L43 75 Q50 78 57 75 L56 69" fill="none" stroke={INDIGO} strokeWidth={2.6} strokeLinejoin="round" />
    </Svg>
  );
}

// 外食 — 握り寿司 nigiri
function DineIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M29 64 Q29 73 41 73 L59 73 Q71 73 71 64 Q71 59 59 60 L41 60 Q29 59 29 64 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Path
        d="M26 56 Q50 37 74 56 Q75 63 69 61 L69 60 Q50 52 31 60 L31 61 Q25 63 26 56 Z"
        fill={BRASS}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <G stroke="#9C7E40" strokeWidth={1.9} strokeLinecap="round" fill="none">
        <Path d="M38 50 Q50 45 62 50" />
        <Path d="M43 54 Q50 50.5 57 54" />
      </G>
    </Svg>
  );
}

// 交通費 — 新幹線 Shinkansen front
function TransitIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M50 18 C36 18 30 32 30 50 L30 72 Q30 78 36 78 L64 78 Q70 78 70 72 L70 50 C70 32 64 18 50 18 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Path
        d="M40 33 Q50 27 60 33 L58 44 Q50 40 42 44 Z"
        fill={BRASS}
        stroke={INDIGO}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path d="M31 54 L69 54" stroke={BRASS} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Circle cx={40} cy={64} r={3} fill={INDIGO} />
      <Circle cx={60} cy={64} r={3} fill={INDIGO} />
      <Path d="M44 78 L44 84 Q50 86 56 84 L56 78" fill="none" stroke={INDIGO} strokeWidth={2.6} strokeLinejoin="round" />
    </Svg>
  );
}

// 医療 — 瓢箪 medicine gourd
function MedicalIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M50 24 C45 24 42 28 42 33 C42 37 44 39 46 41 C41 44 35 50 35 60 C35 71 42 80 50 80 C58 80 65 71 65 60 C65 50 59 44 54 41 C56 39 58 37 58 33 C58 28 55 24 50 24 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Rect x={45} y={16} width={10} height={9} rx={2.5} fill={BRASS} stroke={INDIGO} strokeWidth={2.2} />
      <Path d="M40 41 Q50 46 60 41" stroke={BRASS} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// サブスク — 寛永通宝風コイン + 循環 recurring coin
function SubIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G fill="none" stroke={BRASS} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M24 40 A30 30 0 0 1 71 25" />
        <Path d="M62 22 L72 25 L69 35" />
        <Path d="M76 60 A30 30 0 0 1 29 75" />
        <Path d="M38 78 L28 75 L31 65" />
      </G>
      <Circle cx={50} cy={50} r={17} fill={CREAM} stroke={INDIGO} strokeWidth={2.6} />
      <Rect x={44.5} y={44.5} width={11} height={11} rx={1.5} fill="none" stroke={INDIGO} strokeWidth={2.4} />
    </Svg>
  );
}

// その他 — 鳥居 torii
function OtherIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G stroke={INDIGO} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M37 44 L34 80" />
        <Path d="M63 44 L66 80" />
        <Path d="M33 53 L67 53" />
        <Path d="M50 44 L50 53" />
      </G>
      <Path
        d="M22 41 Q26 32 34 34 L66 34 Q74 32 78 41 L74 44 Q50 41 26 44 Z"
        fill={BRASS}
        stroke={INDIGO}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 娯楽 — 扇子 folding fan
function FunIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M41.1 68.7 L18.7 35.6 A56 56 0 0 1 81.3 35.6 L58.9 68.7 A16 16 0 0 0 41.1 68.7 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <G stroke={INDIGO} strokeWidth={2.2} strokeLinecap="round" fill="none">
        <Path d="M45.3 66.7 L33.6 28.5" />
        <Path d="M50 66 L50 26" />
        <Path d="M54.7 66.7 L66.4 28.5" />
      </G>
      <Path d="M18.7 35.6 A56 56 0 0 1 81.3 35.6" fill="none" stroke={BRASS} strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={50} cy={82} r={3.6} fill={BRASS} stroke={INDIGO} strokeWidth={2} />
    </Svg>
  );
}

// 日用品 — 箒 broom
function DailyIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path d="M64 20 L47 53" stroke={INDIGO} strokeWidth={3} strokeLinecap="round" fill="none" />
      <G stroke={INDIGO} strokeWidth={2.2} strokeLinecap="round" fill="none">
        <Path d="M46 52 L34 80" />
        <Path d="M49 54 L42 82" />
        <Path d="M52 54 L51 83" />
        <Path d="M54 53 L60 82" />
        <Path d="M56 52 L67 79" />
      </G>
      <Path d="M34 80 Q51 86 67 79" fill="none" stroke={INDIGO} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
      <Path d="M42 50 L59 46" stroke={BRASS} strokeWidth={4.4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// 衣類 — 着物 kimono
function ClothIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M50 24 L40 30 L20 38 L24 56 L31 54 L30 80 L70 80 L69 54 L76 56 L80 38 L60 30 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Path d="M50 24 L43 51 M50 24 L57 51" fill="none" stroke={INDIGO} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M43 51 L50 48 L57 51" fill="none" stroke={INDIGO} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M31 61 L69 61" stroke={BRASS} strokeWidth={5} strokeLinecap="butt" fill="none" />
      <Rect x={45.5} y={57.5} width={9} height={7} rx={1} fill={BRASS} stroke={INDIGO} strokeWidth={1.6} />
    </Svg>
  );
}

// 税金 — 米俵 rice bale（年貢）
function TaxIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M30 34 Q30 28 50 28 Q70 28 70 34 L70 66 Q70 72 50 72 Q30 72 30 66 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Path d="M30 34 Q50 40 70 34" fill="none" stroke={INDIGO} strokeWidth={2.4} strokeLinecap="round" />
      <G stroke={INDIGO} strokeWidth={1.4} strokeLinecap="round" opacity={0.45} fill="none">
        <Path d="M38 40 L37 64" />
        <Path d="M50 41 L50 66" />
        <Path d="M62 40 L63 64" />
      </G>
      <Path d="M29 47 Q50 53 71 47" fill="none" stroke={BRASS} strokeWidth={3} strokeLinecap="round" />
      <Path d="M29 59 Q50 65 71 59" fill="none" stroke={BRASS} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

// 給与 — 給料袋 pay envelope
function SalaryIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Rect x={39} y={20} width={22} height={18} rx={2} fill={CREAM} stroke={INDIGO} strokeWidth={2.2} />
      <Path d="M44 29 L56 29" stroke={BRASS} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path
        d="M28 36 Q28 32 32 32 L68 32 Q72 32 72 36 L72 72 Q72 76 68 76 L32 76 Q28 76 28 72 Z"
        fill={CREAM}
        stroke={INDIGO}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <Path d="M28 41 L72 41" stroke={INDIGO} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Circle cx={50} cy={59} r={9.5} fill="none" stroke={BRASS} strokeWidth={2.6} />
      <SvgText x={50} y={63.5} textAnchor="middle" fontSize={14} fontWeight="700" fill={INDIGO}>
        ¥
      </SvgText>
    </Svg>
  );
}

// 副業 — 二足の草鞋 two waraji sandals
function SideIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G rotation={-10} originX={38} originY={50}>
        <Ellipse cx={38} cy={50} rx={11} ry={22} fill={CREAM} stroke={INDIGO} strokeWidth={2.5} />
        <G stroke={BRASS} strokeWidth={2.2} fill="none" strokeLinecap="round">
          <Path d="M38 35 L31 46 M38 35 L45 46 M30 52 L46 52 M31 60 L45 60" />
        </G>
      </G>
      <G rotation={10} originX={64} originY={52}>
        <Ellipse cx={64} cy={52} rx={11} ry={22} fill={CREAM} stroke={INDIGO} strokeWidth={2.5} />
        <G stroke={BRASS} strokeWidth={2.2} fill="none" strokeLinecap="round">
          <Path d="M64 37 L57 48 M64 37 L71 48 M56 54 L72 54 M57 62 L71 62" />
        </G>
      </G>
    </Svg>
  );
}

// お年玉 — ぽち袋 + 水引 money envelope
function OtoshidamaIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Rect x={33} y={22} width={34} height={56} rx={4} fill={CREAM} stroke={INDIGO} strokeWidth={2.6} />
      <Path d="M33 44 L67 44" stroke={INDIGO} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <G stroke={BRASS} strokeWidth={2.2} fill="none" strokeLinecap="round">
        <Ellipse cx={43} cy={36} rx={6} ry={4.2} />
        <Ellipse cx={57} cy={36} rx={6} ry={4.2} />
        <Path d="M48 38 L46 46" />
        <Path d="M52 38 L54 46" />
      </G>
      <Circle cx={50} cy={36} r={1.8} fill={BRASS} />
    </Svg>
  );
}

type IconComponent = (props: IconProps) => React.ReactElement;

/**
 * カテゴリ名 → 藍染アイコンコンポーネントの対応表。
 * デフォルトカテゴリ名に一致する場合のみ線画アイコンを描画する。
 */
export const AIZOME_CATEGORY_ICONS: Record<string, IconComponent> = {
  // 支出
  '食費': FoodIcon,
  '外食': DineIcon,
  '交通費': TransitIcon,
  '医療': MedicalIcon,
  'サブスク': SubIcon,
  'その他': OtherIcon,
  '娯楽': FunIcon,
  '日用品': DailyIcon,
  '衣類': ClothIcon,
  '税金': TaxIcon,
  // 収入
  '給与': SalaryIcon,
  '副業': SideIcon,
  'お年玉': OtoshidamaIcon,
};

/** 指定カテゴリ名に対応する藍染アイコンがあるか判定 */
export function hasAizomeCategoryIcon(name?: string | null): boolean {
  return !!name && name in AIZOME_CATEGORY_ICONS;
}
