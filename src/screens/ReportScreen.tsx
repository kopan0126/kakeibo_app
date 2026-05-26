import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import {
  subMonths, format, startOfMonth, endOfMonth,
  getDaysInMonth, startOfWeek, endOfWeek,
  parseISO, getDate, getYear, getMonth,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useViewStore } from '../stores/viewStore';
import { getTransactionsByMonth, getCategories } from '../services/transactions';
import {
  formatCurrency, formatMonth,
  prevMonth, nextMonth, currentMonthISO,
} from '../utils/format';
import ScopeSelector from '../components/ScopeSelector';
import AdBanner from '../components/AdBanner';
import AsanohaBg from '../components/AsanohaBg';
import { AI } from '../theme/aizome';
import type { Transaction, Category } from '../types';

// ─── Types ────────────────────────────────────────────────────
type TabKey = 'category' | 'trend';
type Period = '今週' | '今月' | '3ヶ月';

interface CatTotal {
  id: string; name: string; icon: string; color: string; amount: number;
}

// ─── Constants ────────────────────────────────────────────────
const DONUT_PALETTE = [
  AI.brass, '#D9BC85', '#A8845A', '#8a9d6a', '#7e8aa3', '#5a6b87', '#384d75',
];

// ─── Helpers ──────────────────────────────────────────────────
function arcPath(
  cx: number, cy: number, rO: number, rI: number,
  startA: number, endA: number,
): string {
  const span = Math.min(endA - startA, 359.99);
  const a1 = (startA - 90) * Math.PI / 180;
  const a2 = (startA + span - 90) * Math.PI / 180;
  const large = span > 180 ? 1 : 0;
  const x1 = cx + rO * Math.cos(a1), y1 = cy + rO * Math.sin(a1);
  const x2 = cx + rO * Math.cos(a2), y2 = cy + rO * Math.sin(a2);
  const x3 = cx + rI * Math.cos(a2), y3 = cy + rI * Math.sin(a2);
  const x4 = cx + rI * Math.cos(a1), y4 = cy + rI * Math.sin(a1);
  return `M ${x1} ${y1} A ${rO} ${rO} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rI} ${rI} 0 ${large} 0 ${x4} ${y4} Z`;
}

function compactYen(yen: number): string {
  const abs = Math.abs(yen);
  const sign = yen < 0 ? '-' : '';
  if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(abs >= 100000 ? 0 : 1)}万`;
  if (abs >= 1000) return `${sign}¥${Math.floor(abs / 1000)}千`;
  return `${sign}¥${abs}`;
}

function buildDailyExpense(
  txs: Transaction[], cats: Category[], year: number, month: number,
): number[] {
  const days = getDaysInMonth(new Date(year, month - 1));
  const arr = new Array<number>(days).fill(0);
  for (const tx of txs) {
    const d = parseISO(tx.transaction_date);
    if (getYear(d) !== year || getMonth(d) + 1 !== month) continue;
    const cat = cats.find((c) => c.id === tx.category_id);
    if (!cat || cat.type === 'income') continue;
    arr[getDate(d) - 1] += tx.amount_cents;
  }
  return arr;
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ReportScreen() {
  const { user } = useAuthStore();
  const { categories, setCategories } = useTransactionStore();
  const { selectedScope } = useViewStore();

  const [currentMonth, setCurrentMonth] = useState(currentMonthISO());
  const [activeTab, setActiveTab] = useState<TabKey>('trend');
  const [period, setPeriod] = useState<Period>('今月');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (categories.length === 0) getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    if (!user || categories.length === 0) return;
    setIsLoading(true);
    try {
      // Load current + previous month for trend comparison
      const prevM = prevMonth(currentMonth);
      const from = format(startOfMonth(parseISO(prevM)), 'yyyy-MM-dd');
      const to = format(endOfMonth(parseISO(currentMonth)), 'yyyy-MM-dd');
      const showPersonal = selectedScope === 'personal';
      const groupId = selectedScope !== 'personal' ? selectedScope : null;
      const txs = await getTransactionsByMonth(user.id, from, to, showPersonal, groupId);
      setTransactions(txs);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [user, categories, selectedScope, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Category tab data ──────────────────────────────────────
  const { catTotals, totalExpense } = useMemo(() => {
    const today = new Date();
    const curDate = parseISO(currentMonth);
    let fromStr: string, toStr: string;

    if (period === '今週') {
      fromStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      toStr = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else if (period === '3ヶ月') {
      fromStr = format(startOfMonth(subMonths(curDate, 2)), 'yyyy-MM-dd');
      toStr = format(endOfMonth(curDate), 'yyyy-MM-dd');
    } else {
      fromStr = format(startOfMonth(curDate), 'yyyy-MM-dd');
      toStr = format(endOfMonth(curDate), 'yyyy-MM-dd');
    }

    const cm: Record<string, number> = {};
    let total = 0;
    for (const tx of transactions) {
      if (tx.transaction_date < fromStr || tx.transaction_date > toStr) continue;
      const cat = categories.find((c) => c.id === tx.category_id);
      if (!cat || cat.type === 'income') continue;
      cm[tx.category_id] = (cm[tx.category_id] ?? 0) + tx.amount_cents;
      total += tx.amount_cents;
    }

    const totals: CatTotal[] = Object.entries(cm)
      .map(([id, amount]) => {
        const cat = categories.find((c) => c.id === id);
        return {
          id, amount,
          name: cat?.name ?? '不明',
          icon: cat?.icon ?? '📦',
          color: cat?.color ?? '#9E9E9E',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { catTotals: totals, totalExpense: total };
  }, [transactions, categories, period, currentMonth]);

  // ── Trend tab data ─────────────────────────────────────────
  const trendData = useMemo(() => {
    const curDate = parseISO(currentMonth);
    const curYear = getYear(curDate);
    const curMon = getMonth(curDate) + 1;
    const prevDate = parseISO(prevMonth(currentMonth));
    const prevYear = getYear(prevDate);
    const prevMon = getMonth(prevDate) + 1;

    const today = new Date();
    const isCurrentMonth = curYear === getYear(today) && curMon === getMonth(today) + 1;
    const totalDays = getDaysInMonth(curDate);
    const daysElapsed = isCurrentMonth ? Math.min(getDate(today), totalDays) : totalDays;

    const curDaily = buildDailyExpense(transactions, categories, curYear, curMon);
    const prevDaily = buildDailyExpense(transactions, categories, prevYear, prevMon);

    let acc = 0;
    const curCum = curDaily.slice(0, daysElapsed).map((v) => (acc += v));
    acc = 0;
    const prevCum = prevDaily.map((v) => (acc += v));

    const totalExp = curCum[curCum.length - 1] ?? 0;
    const prevAtSame = prevCum[daysElapsed - 1] ?? 0;
    const diff = totalExp - prevAtSame;

    let maxDayAmt = 0, maxDayNum = 1;
    for (let i = 0; i < daysElapsed; i++) {
      if (curDaily[i] > maxDayAmt) { maxDayAmt = curDaily[i]; maxDayNum = i + 1; }
    }
    const avgDaily = daysElapsed > 0 ? Math.round(totalExp / daysElapsed) : 0;
    const projected = daysElapsed > 0 ? Math.round((totalExp / daysElapsed) * totalDays) : 0;

    return { curCum, prevCum, totalExpense: totalExp, diff, avgDaily, maxDayAmt, maxDayNum, projected, daysElapsed, totalDays };
  }, [transactions, categories, currentMonth]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScopeSelector />

      {/* Month switcher */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => setCurrentMonth(prevMonth(currentMonth))}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonth(currentMonth)}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(nextMonth(currentMonth))}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Tab row */}
      <View style={styles.tabRow}>
        {(['trend', 'category'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'trend' ? '支出推移' : 'カテゴリ分析'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={AI.brass} size="large" />
      ) : activeTab === 'trend' ? (
        <TrendTab data={trendData} />
      ) : (
        <CategoryTab
          totals={catTotals}
          totalExpense={totalExpense}
          period={period}
          setPeriod={setPeriod}
        />
      )}

      <View style={styles.adWrap}><AdBanner /></View>
    </ScrollView>
  );
}

// ─── Category Tab ─────────────────────────────────────────────
const PERIODS: Period[] = ['今週', '今月', '3ヶ月'];

function CategoryTab({
  totals, totalExpense, period, setPeriod,
}: {
  totals: CatTotal[];
  totalExpense: number;
  period: Period;
  setPeriod: (p: Period) => void;
}) {
  const top7 = totals.slice(0, 7);
  let acc = 0;
  const segments = top7.map((c, i) => {
    const start = totalExpense > 0 ? (acc / totalExpense) * 360 : 0;
    acc += c.amount;
    const end = totalExpense > 0 ? (acc / totalExpense) * 360 : 0;
    return { start, end, color: DONUT_PALETTE[i] ?? DONUT_PALETTE[6], cat: c };
  });

  const totalLabel = totalExpense >= 10000
    ? `¥${(totalExpense / 10000).toFixed(totalExpense >= 1000000 ? 0 : 1)}万`
    : `¥${totalExpense.toLocaleString()}`;

  return (
    <View style={styles.tabContent}>
      {/* Period tabs */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Donut hero card */}
      <View style={styles.heroCard}>
        <AsanohaBg opacity={0.35} />
        <View style={{ alignItems: 'center', position: 'relative' }}>
          {totalExpense === 0 ? (
            <View style={styles.donutEmpty}>
              <Text style={styles.donutEmptyText}>データなし</Text>
            </View>
          ) : (
            <Svg width={180} height={180} viewBox="0 0 180 180">
              {segments.map((seg, i) => (
                <Path
                  key={i}
                  d={arcPath(90, 90, 78, 52, seg.start, seg.end)}
                  fill={seg.color}
                  stroke={AI.indigo}
                  strokeWidth={1.5}
                />
              ))}
              <SvgText x="90" y="80" textAnchor="middle" fontSize={9} fill={AI.brassSoft}>
                {'TOTAL'}
              </SvgText>
              <SvgText x="90" y="102" textAnchor="middle" fontSize={22} fill={AI.washi} fontWeight="600">
                {totalLabel}
              </SvgText>
              <SvgText x="90" y="118" textAnchor="middle" fontSize={9} fill={AI.brassSoft}>
                {`${top7.length}分類`}
              </SvgText>
            </Svg>
          )}
        </View>
      </View>

      {/* Ranked list */}
      <View style={styles.rankList}>
        {totals.length === 0 ? (
          <Text style={styles.emptyText}>この期間の支出データがありません</Text>
        ) : (
          totals.slice(0, 7).map((cat, i) => {
            const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
            return (
              <View key={cat.id} style={styles.rankRow}>
                <Text style={styles.rankNum}>{i < 9 ? `0${i + 1}` : `${i + 1}`}</Text>
                <View style={[styles.rankSquare, { backgroundColor: DONUT_PALETTE[i] ?? DONUT_PALETTE[6] }]} />
                <Text style={styles.rankName} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.rankAmt}>{formatCurrency(cat.amount)}</Text>
                <Text style={styles.rankPct}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Trend Tab ────────────────────────────────────────────────
interface TrendDataProps {
  curCum: number[];
  prevCum: number[];
  totalExpense: number;
  diff: number;
  avgDaily: number;
  maxDayAmt: number;
  maxDayNum: number;
  projected: number;
  daysElapsed: number;
  totalDays: number;
}

function TrendTab({ data }: { data: TrendDataProps }) {
  const {
    curCum, prevCum, totalExpense, diff, avgDaily,
    maxDayAmt, maxDayNum, projected, daysElapsed, totalDays,
  } = data;

  // SVG chart config
  const W = 264, H = 130, PAD = 6;
  const maxY = Math.max(...curCum, ...prevCum.slice(0, daysElapsed), 1);
  const scale = maxY * 1.2;

  const xAt = (i: number, total: number) => PAD + (i / Math.max(total - 1, 1)) * (W - PAD * 2);
  const yAt = (v: number) => H - PAD - (v / scale) * (H - PAD * 2);

  const prevPath = prevCum.length > 1
    ? prevCum.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i, prevCum.length)} ${yAt(v)}`).join(' ')
    : null;

  const curPath = curCum.length > 1
    ? curCum.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i, totalDays)} ${yAt(v)}`).join(' ')
    : null;

  const curArea = curPath && curCum.length > 1
    ? `${curPath} L ${xAt(curCum.length - 1, totalDays)} ${H - PAD} L ${xAt(0, totalDays)} ${H - PAD} Z`
    : null;

  const lastX = curCum.length > 0 ? xAt(curCum.length - 1, totalDays) : PAD;
  const lastY = curCum.length > 0 ? yAt(curCum[curCum.length - 1]) : H - PAD;

  const diffAbs = Math.abs(diff);
  const diffSign = diff >= 0 ? '+' : '−';
  const xLabels = [...new Set([1, 8, 15, 22, totalDays])];

  return (
    <View style={styles.tabContent}>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <AsanohaBg opacity={0.35} />
        <View style={{ position: 'relative' }}>

          {/* Amount header */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>{`累計支出 · ${daysElapsed}日時点`}</Text>
              <View style={styles.heroAmtRow}>
                <Text style={styles.heroYen}>¥</Text>
                <Text style={styles.heroAmt}>{totalExpense.toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroDiff}>{`${diffSign}¥${diffAbs.toLocaleString()}`}</Text>
              <Text style={styles.heroDiffLabel}>{`前月比 ${diff >= 0 ? '↑' : '↓'}`}</Text>
            </View>
          </View>

          {/* SVG line chart */}
          {curCum.length > 1 ? (
            <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={styles.chartSvg}>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <Line
                  key={f}
                  x1={PAD} x2={W - PAD}
                  y1={yAt(scale * f)} y2={yAt(scale * f)}
                  stroke="rgba(241,232,211,0.1)"
                  strokeWidth={0.5}
                />
              ))}
              {/* Previous month dashed */}
              {prevPath ? (
                <Path
                  d={prevPath}
                  stroke="rgba(241,232,211,0.35)"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray={[2, 2]}
                />
              ) : null}
              {/* Current month area fill */}
              {curArea ? (
                <Path d={curArea} fill={AI.brass} fillOpacity={0.12} />
              ) : null}
              {/* Current month line */}
              {curPath ? (
                <Path
                  d={curPath}
                  stroke={AI.brass}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {/* Last point dot */}
              {curCum.length > 0 && (
                <>
                  <Circle cx={lastX} cy={lastY} r={4} fill={AI.brass} />
                  <Circle cx={lastX} cy={lastY} r={2} fill={AI.indigo} />
                </>
              )}
              {/* X-axis labels */}
              {xLabels.map((d) => (
                <SvgText
                  key={d}
                  x={xAt(d - 1, totalDays)}
                  y={H - 1}
                  textAnchor="middle"
                  fontSize={8.5}
                  fill={AI.brassSoft}
                >
                  {String(d)}
                </SvgText>
              ))}
            </Svg>
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>データなし</Text>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: AI.brass }]} />
              <Text style={styles.legendText}>今月</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, styles.legendLineDashed]} />
              <Text style={[styles.legendText, { color: AI.brassSoft }]}>前月</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {([
          ['日 平 均', formatCurrency(avgDaily)],
          ['最 大 日', compactYen(maxDayAmt)],
          ['記 録 日', `${maxDayNum}日`],
        ] as [string, string][]).map(([label, value], i) => (
          <View key={label} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Pace prediction card */}
      <View style={styles.paceCard}>
        <View style={styles.paceBadge}>
          <Text style={styles.paceBadgeText}>AI</Text>
        </View>
        <Text style={styles.paceText}>
          {'このペースなら月末 '}
          <Text style={styles.paceHighlight}>{formatCurrency(projected)}</Text>
          {' になる見込みです。'}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { paddingBottom: 40 },

  // Month switcher
  monthRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 12, backgroundColor: AI.washi2,
    borderBottomWidth: 1, borderBottomColor: AI.rule,
  },
  arrow: { fontSize: 28, color: AI.indigo, paddingHorizontal: 20 },
  monthLabel: { fontSize: 17, fontWeight: 'bold', color: AI.text },

  // Tab row
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: AI.rule,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: AI.washi2 },
  tabActive: { backgroundColor: AI.indigo },
  tabText: { fontSize: 13, fontWeight: '600', color: AI.textSoft },
  tabTextActive: { color: AI.brass, letterSpacing: 1 },

  tabContent: { paddingHorizontal: 16, paddingTop: 14 },
  adWrap: { marginHorizontal: 16, marginTop: 8 },

  // Period tabs
  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  periodBtn: {
    flex: 1, paddingVertical: 7, alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: AI.rule,
    backgroundColor: 'transparent',
  },
  periodBtnActive: { backgroundColor: AI.indigo, borderColor: AI.indigo },
  periodBtnText: { fontSize: 11, fontWeight: '600', color: AI.textSoft },
  periodBtnTextActive: { color: AI.brass },

  // Hero card (indigo background)
  heroCard: {
    backgroundColor: AI.indigo, borderRadius: 18,
    padding: 18, marginBottom: 12,
    overflow: 'hidden', position: 'relative',
  },

  // Donut empty state
  donutEmpty: {
    width: 180, height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  donutEmptyText: { color: AI.brassSoft, fontSize: 13 },

  // Ranked list card
  rankList: {
    backgroundColor: AI.washi2, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: AI.rule,
    marginBottom: 12,
  },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, gap: 10,
    borderBottomWidth: 1, borderBottomColor: AI.rule,
  },
  rankNum: { fontVariant: ['tabular-nums'], fontSize: 10, color: AI.textSoft, width: 18 },
  rankSquare: { width: 10, height: 10, borderRadius: 2 },
  rankName: { flex: 1, fontSize: 13, color: AI.indigo },
  rankAmt: { fontSize: 13, color: AI.indigo, fontWeight: '600' },
  rankPct: { fontSize: 10, color: AI.brass, width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  emptyText: { color: AI.textSoft, fontSize: 13, textAlign: 'center', paddingVertical: 24 },

  // Trend hero internals
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  heroLabel: { fontSize: 9, color: AI.brassSoft, letterSpacing: 2 },
  heroAmtRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 },
  heroYen: { fontSize: 14, color: AI.brass, fontWeight: '600' },
  heroAmt: { fontSize: 30, color: AI.washi, fontWeight: '500', letterSpacing: -0.5 },
  heroDiff: { fontSize: 12, color: AI.brass, fontVariant: ['tabular-nums'], fontWeight: '600' },
  heroDiffLabel: { fontSize: 9, color: AI.brassSoft },

  chartSvg: { marginTop: 4 },
  chartEmpty: {
    height: 120, alignItems: 'center', justifyContent: 'center',
  },
  chartEmptyText: { color: AI.brassSoft, fontSize: 12 },

  legendRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine: { width: 14, height: 2 },
  legendLineDashed: { backgroundColor: AI.brassSoft, opacity: 0.6 },
  legendText: { fontSize: 10, color: AI.brass, fontWeight: '600' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: AI.washi2, borderRadius: 12,
    borderWidth: 1, borderColor: AI.rule,
    paddingVertical: 14, marginBottom: 10,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: AI.rule },
  statLabel: { fontSize: 9, color: AI.textSoft, letterSpacing: 2, marginBottom: 3 },
  statValue: { fontSize: 15, color: AI.indigo, fontWeight: '600' },

  // Pace card
  paceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: AI.washi2, borderRadius: 12,
    borderWidth: 1, borderColor: AI.rule,
    padding: 12, marginBottom: 12,
  },
  paceBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: AI.brass, justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  paceBadgeText: { fontSize: 11, fontWeight: '700', color: AI.indigo },
  paceText: { flex: 1, fontSize: 12, color: AI.text, lineHeight: 18 },
  paceHighlight: { color: AI.indigo, fontWeight: '700' },
});
