// shared.jsx — Mock data + density context shared by all five variations.

const DensityCtx = React.createContext('regular');
const useDensity = () => React.useContext(DensityCtx);

// Density scales — applied per variation as needed.
const DENSITY_SCALES = {
  comfy:    { pad: 1.18, gap: 1.22, fs: 1.04, rowH: 1.18, hide: ['secondary'] },
  regular:  { pad: 1.00, gap: 1.00, fs: 1.00, rowH: 1.00, hide: [] },
  dense:    { pad: 0.78, gap: 0.74, fs: 0.94, rowH: 0.82, hide: [] },
};
function useScale() {
  const d = useDensity();
  return DENSITY_SCALES[d] || DENSITY_SCALES.regular;
}

// Formatted yen — fixed width-ish using narrow no-break space as thousand sep.
function yen(n, sign = false) {
  const s = Math.abs(n).toLocaleString('en-US');
  if (sign && n > 0) return '+¥' + s;
  if (sign && n < 0) return '−¥' + s;
  return '¥' + s;
}

// ─── Mock budget data ────────────────────────────────────────────────
const MOCK = {
  todayWa:   '令和七年 霜月十五日',
  todayShort:'2025.11.15 土',
  monthLabel:'霜月',
  monthEN:   'November',
  budget:    280000,
  spent:     187432,
  remaining: 92568,
  daysLeft:  15,
  todaySpent: 5247,
  // Traditional kakeibo: 4 buckets
  kakeibo: [
    { key: 'needs',  ja: '必要費',  en: 'Needs',    sub: '生活に欠かせない',     spent: 92410, budget: 140000 },
    { key: 'wants',  ja: '娯楽費',  en: 'Wants',    sub: 'なくても困らない',     spent: 41280, budget:  60000 },
    { key: 'culture',ja: '文化費',  en: 'Culture',  sub: '心を豊かにする',       spent: 28920, budget:  40000 },
    { key: 'extra',  ja: '予備費',  en: 'Reserve',  sub: '想定外の出費',         spent: 24822, budget:  40000 },
  ],
  // Modern categories
  categories: [
    { key: 'food',    ja: '食費',  icon: '食', spent: 48230, budget: 60000 },
    { key: 'house',   ja: '住居',  icon: '住', spent: 72000, budget: 72000 },
    { key: 'utility', ja: '光熱',  icon: '光', spent: 18420, budget: 22000 },
    { key: 'transit', ja: '交通',  icon: '交', spent:  9840, budget: 15000 },
    { key: 'leisure', ja: '娯楽',  icon: '楽', spent: 14200, budget: 20000 },
    { key: 'clothes', ja: '衣服',  icon: '衣', spent:  8400, budget: 15000 },
    { key: 'health',  ja: '医療',  icon: '医', spent:  3420, budget: 10000 },
    { key: 'culture', ja: '教養',  icon: '本', spent:  6800, budget: 12000 },
    { key: 'misc',    ja: '雑費',  icon: '他', spent:  6122, budget: 14000 },
  ],
  // Family
  family: [
    { name: '父',   color: '#3a4d6b', spent: 78420 },
    { name: '母',   color: '#a44231', spent: 64810 },
    { name: '太郎', color: '#6b7f4a', spent: 28640 },
    { name: 'さくら', color: '#b88a8a', spent: 15562 },
  ],
  // Recent transactions
  recent: [
    { t: '08:14', cat: '食',  who: '母',   memo: 'スーパー成城',     amt: 3840 },
    { t: '11:02', cat: '交',  who: '父',   memo: 'JR 東京→新宿',     amt:  320 },
    { t: '12:48', cat: '食',  who: '太郎', memo: '社員食堂',         amt:  680 },
    { t: '15:30', cat: '本',  who: '父',   memo: '丸善 / 文庫×2',    amt: 1650 },
    { t: '17:21', cat: '衣',  who: 'さくら', memo: 'ユニクロ',        amt: 4280 },
    { t: '19:05', cat: '食',  who: '母',   memo: 'セブン-イレブン',  amt:  482 },
  ],
  // Daily expenses for sparkline / heatmap (¥ per day for 30 days)
  daily: [
    8200, 4100,  6300, 12400, 5800,  3200, 14800,
    6100, 2800, 11200,  4400, 7900,  5100,  8800,
    5247, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

// Helpers for screen frames
const PHONE_W = 320;
const PHONE_H = 692;

Object.assign(window, { DensityCtx, useDensity, useScale, DENSITY_SCALES, yen, MOCK, PHONE_W, PHONE_H });
