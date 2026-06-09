import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Line, Rect, Text as SvgText } from 'react-native-svg';
import {
  subMonths, subWeeks, addDays, format, startOfMonth, endOfMonth,
  getDaysInMonth, startOfWeek, endOfWeek,
  parseISO, getDate, getDay, getYear, getMonth,
} from 'date-fns';

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
import { trackReportTabChanged, trackReportPeriodChanged } from '../services/analytics';
import type { Transaction, Category } from '../types';

// ─── Types ────────────────────────────────────────────────────
type TabKey = 'category' | 'trend';
type Period = '今週' | '今月' | '3ヶ月';
type CatType = 'expense' | 'income';
type BarUnit = 'day' | 'week' | 'month';

interface CatTotal {
  id: string; name: string; icon: string; color: string; amount: number;
}

interface Bar {
  label: string; amount: number; current: boolean;
}

// 収支残高カード（選択中の日/週/月の期間に対応）
interface BalanceInfo {
  label: string; income: number; expense: number; balance: number;
  showBudget: boolean; daysRemaining: number;
}

// ─── Constants ────────────────────────────────────────────────
const DONUT_PALETTE = [
  AI.brass, '#D9BC85', '#A8845A', '#8a9d6a', '#7e8aa3', '#5a6b87', '#384d75',
];

// getDay(): 0=日 .. 6=土
const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

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

// 指定期間（yyyy-MM-dd 文字列で内包）の収支（収入 − 支出）を集計する
function sumNetInRange(
  txs: Transaction[], cats: Category[], fromStr: string, toStr: string,
): number {
  let net = 0;
  for (const tx of txs) {
    if (tx.transaction_date < fromStr || tx.transaction_date > toStr) continue;
    const cat = cats.find((c) => c.id === tx.category_id);
    if (!cat) continue;
    net += cat.type === 'income' ? tx.amount_cents : -tx.amount_cents;
  }
  return net;
}

// 指定期間の収入・支出を分けて集計する
function sumIncomeExpenseInRange(
  txs: Transaction[], cats: Category[], fromStr: string, toStr: string,
): { income: number; expense: number } {
  let income = 0, expense = 0;
  for (const tx of txs) {
    if (tx.transaction_date < fromStr || tx.transaction_date > toStr) continue;
    const cat = cats.find((c) => c.id === tx.category_id);
    if (!cat) continue;
    if (cat.type === 'income') income += tx.amount_cents;
    else expense += tx.amount_cents;
  }
  return { income, expense };
}

// 月内の日別収支（収入 − 支出）配列を構築する
function buildDailyNet(
  txs: Transaction[], cats: Category[], year: number, month: number,
): number[] {
  const days = getDaysInMonth(new Date(year, month - 1));
  const arr = new Array<number>(days).fill(0);
  for (const tx of txs) {
    const d = parseISO(tx.transaction_date);
    if (getYear(d) !== year || getMonth(d) + 1 !== month) continue;
    const cat = cats.find((c) => c.id === tx.category_id);
    if (!cat) continue;
    arr[getDate(d) - 1] += cat.type === 'income' ? tx.amount_cents : -tx.amount_cents;
  }
  return arr;
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ReportScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();
  const { categories, setCategories } = useTransactionStore();
  const { selectedScope } = useViewStore();

  const [currentMonth, setCurrentMonth] = useState(currentMonthISO());
  const [activeTab, setActiveTab] = useState<TabKey>('trend');
  const [period, setPeriod] = useState<Period>('今月');
  const [catType, setCatType] = useState<CatType>('expense');
  const [barUnit, setBarUnit] = useState<BarUnit>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (categories.length === 0) getCategories().then(setCategories).catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    if (!user || categories.length === 0) return;
    setIsLoading(true);
    try {
      // 折れ線（前月比）と棒グラフ（月単位=直近6ヶ月）の両方を賄うため過去6ヶ月分を読み込む
      const from = format(startOfMonth(subMonths(parseISO(currentMonth), 5)), 'yyyy-MM-dd');
      const to = format(endOfMonth(parseISO(currentMonth)), 'yyyy-MM-dd');
      const showPersonal = selectedScope === 'personal';
      const groupId = selectedScope !== 'personal' ? selectedScope : null;
      const txs = await getTransactionsByMonth(user.id, from, to, showPersonal, groupId);
      setTransactions(txs);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [user, categories, selectedScope, currentMonth]);

  // 画面フォーカス時（記録入力後に戻った時など）に再読み込みして即時反映する
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // ── Category tab data（支出・収入を同時に集計） ───────────────
  const { expenseTotals, incomeTotals, totalExpenseSum, totalIncomeSum } = useMemo(() => {
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

    const expMap: Record<string, number> = {};
    const incMap: Record<string, number> = {};
    let expTotal = 0, incTotal = 0;
    for (const tx of transactions) {
      if (tx.transaction_date < fromStr || tx.transaction_date > toStr) continue;
      const cat = categories.find((c) => c.id === tx.category_id);
      if (!cat) continue;
      if (cat.type === 'income') {
        incMap[tx.category_id] = (incMap[tx.category_id] ?? 0) + tx.amount_cents;
        incTotal += tx.amount_cents;
      } else {
        expMap[tx.category_id] = (expMap[tx.category_id] ?? 0) + tx.amount_cents;
        expTotal += tx.amount_cents;
      }
    }

    const buildTotals = (m: Record<string, number>): CatTotal[] =>
      Object.entries(m)
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

    return {
      expenseTotals: buildTotals(expMap),
      incomeTotals: buildTotals(incMap),
      totalExpenseSum: expTotal,
      totalIncomeSum: incTotal,
    };
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
    const daysRemaining = isCurrentMonth ? totalDays - getDate(today) : 0;

    // 今月の収入合計
    const curMonStart = format(startOfMonth(curDate), 'yyyy-MM-dd');
    const curMonEnd = format(endOfMonth(curDate), 'yyyy-MM-dd');
    let totalIncome = 0;
    for (const tx of transactions) {
      if (tx.transaction_date < curMonStart || tx.transaction_date > curMonEnd) continue;
      const cat = categories.find((c) => c.id === tx.category_id);
      if (cat?.type === 'income') totalIncome += tx.amount_cents;
    }

    const curDaily = buildDailyExpense(transactions, categories, curYear, curMon);
    let acc = 0;
    const curCum = curDaily.slice(0, daysElapsed).map((v) => (acc += v));
    const totalExp = curCum[curCum.length - 1] ?? 0;

    // 前月同日までの累計収支（前月比較用）
    const prevDailyNet = buildDailyNet(transactions, categories, prevYear, prevMon);
    acc = 0;
    const prevNetCum = prevDailyNet.map((v) => (acc += v));
    const prevNetAtSame = prevNetCum[daysElapsed - 1] ?? 0;

    const netBalance = totalIncome - totalExp;            // 今月の収支（黒字+/赤字−）
    const netDiff = netBalance - prevNetAtSame;           // 前月同日比
    const avgNetDaily = daysElapsed > 0 ? Math.round(netBalance / daysElapsed) : 0;

    let maxDayAmt = 0, maxDayNum = 1;
    for (let i = 0; i < daysElapsed; i++) {
      if (curDaily[i] > maxDayAmt) { maxDayAmt = curDaily[i]; maxDayNum = i + 1; }
    }

    return {
      totalExpense: totalExp, totalIncome,
      netBalance, netDiff, avgNetDaily,
      maxDayAmt, maxDayNum,
      daysElapsed, daysRemaining, totalDays,
    };
  }, [transactions, categories, currentMonth]);

  // ── Bar chart data（日/週/月 切替の収支推移） ─────────────────
  const barChartData = useMemo<Bar[]>(() => {
    const curDate = parseISO(currentMonth);
    const today = new Date();
    const isCurrentMonth = getYear(curDate) === getYear(today) && getMonth(curDate) === getMonth(today);

    if (barUnit === 'month') {
      // 直近6ヶ月（currentMonth を右端に）
      const bars: Bar[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(curDate, i);
        const fromStr = format(startOfMonth(m), 'yyyy-MM-dd');
        const toStr = format(endOfMonth(m), 'yyyy-MM-dd');
        bars.push({
          label: `${getMonth(m) + 1}月`,
          amount: sumNetInRange(transactions, categories, fromStr, toStr),
          current: i === 0,
        });
      }
      return bars;
    }

    if (barUnit === 'week') {
      // 直近8週（月曜始まり）。今月表示中は今日、それ以外は月末を起点にする
      const anchor = isCurrentMonth ? today : endOfMonth(curDate);
      const bars: Bar[] = [];
      for (let i = 7; i >= 0; i--) {
        const ws = startOfWeek(subWeeks(anchor, i), { weekStartsOn: 1 });
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        const fromStr = format(ws, 'yyyy-MM-dd');
        const toStr = format(we, 'yyyy-MM-dd');
        bars.push({
          label: format(ws, 'M/d'),
          amount: sumNetInRange(transactions, categories, fromStr, toStr),
          current: i === 0,
        });
      }
      return bars;
    }

    // 日単位：月曜始まりの1週間（7日分）の収支。今月表示中は今日、それ以外は月末を含む週
    const anchor = isCurrentMonth ? today : endOfMonth(curDate);
    const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
    const todayStr = format(today, 'yyyy-MM-dd');
    const bars: Bar[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const dStr = format(d, 'yyyy-MM-dd');
      bars.push({
        label: `${getDate(d)}（${WEEKDAY_JP[getDay(d)]}）`,
        amount: sumNetInRange(transactions, categories, dStr, dStr),
        current: dStr === todayStr,
      });
    }
    return bars;
  }, [transactions, categories, currentMonth, barUnit]);

  // ── 収支残高カードのデータ（日/週/月ボタンと一対一対応） ─────────
  const balanceCardData = useMemo<BalanceInfo>(() => {
    const curDate = parseISO(currentMonth);
    const today = new Date();
    const isCurMonth = getYear(curDate) === getYear(today) && getMonth(curDate) === getMonth(today);

    let fromStr: string, toStr: string, label: string;
    let showBudget = false, daysRemaining = 0;

    if (barUnit === 'month') {
      fromStr = format(startOfMonth(curDate), 'yyyy-MM-dd');
      toStr = format(endOfMonth(curDate), 'yyyy-MM-dd');
      label = isCurMonth ? '今月の収支残高' : `${getMonth(curDate) + 1}月の収支残高`;
      showBudget = isCurMonth;
      daysRemaining = isCurMonth ? getDaysInMonth(curDate) - getDate(today) : 0;
    } else if (barUnit === 'week') {
      const anchor = isCurMonth ? today : endOfMonth(curDate);
      const ws = startOfWeek(anchor, { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      fromStr = format(ws, 'yyyy-MM-dd');
      toStr = format(we, 'yyyy-MM-dd');
      label = isCurMonth ? '今週の収支残高' : `${format(ws, 'M/d')}週の収支残高`;
    } else {
      const anchor = isCurMonth ? today : endOfMonth(curDate);
      fromStr = toStr = format(anchor, 'yyyy-MM-dd');
      label = isCurMonth ? '今日の収支残高' : `${format(anchor, 'M/d')}の収支残高`;
    }

    const { income, expense } = sumIncomeExpenseInRange(transactions, categories, fromStr, toStr);
    return { label, income, expense, balance: income - expense, showBudget, daysRemaining };
  }, [transactions, categories, currentMonth, barUnit]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scopeRow}>
        <View style={styles.scopeSelectorWrap}>
          <ScopeSelector />
        </View>
        <TouchableOpacity
          style={styles.familyBtn}
          onPress={() => navigation.navigate('Family')}
        >
          <Text style={styles.familyBtnText}>家族設定</Text>
        </TouchableOpacity>
      </View>

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
            onPress={() => { setActiveTab(tab); trackReportTabChanged(tab); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'trend' ? '収支推移' : 'カテゴリ分析'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={AI.brass} size="large" />
      ) : activeTab === 'trend' ? (
        <TrendTab data={trendData} bars={barChartData} balanceInfo={balanceCardData} barUnit={barUnit} setBarUnit={setBarUnit} />
      ) : (
        <CategoryTab
          totals={catType === 'income' ? incomeTotals : expenseTotals}
          total={catType === 'income' ? totalIncomeSum : totalExpenseSum}
          catType={catType}
          setCatType={setCatType}
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
  totals, total, catType, setCatType, period, setPeriod,
}: {
  totals: CatTotal[];
  total: number;
  catType: CatType;
  setCatType: (t: CatType) => void;
  period: Period;
  setPeriod: (p: Period) => void;
}) {
  const top7 = totals.slice(0, 7);
  let acc = 0;
  const segments = top7.map((c, i) => {
    const start = total > 0 ? (acc / total) * 360 : 0;
    acc += c.amount;
    const end = total > 0 ? (acc / total) * 360 : 0;
    return { start, end, color: DONUT_PALETTE[i] ?? DONUT_PALETTE[6], cat: c };
  });

  const totalLabel = total >= 10000
    ? `¥${(total / 10000).toFixed(total >= 1000000 ? 0 : 1)}万`
    : `¥${total.toLocaleString()}`;

  const typeLabel = catType === 'income' ? '収入' : '支出';

  return (
    <View style={styles.tabContent}>
      {/* 支出 / 収入 トグル */}
      <View style={styles.typeRow}>
        {(['expense', 'income'] as CatType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, catType === t && styles.typeBtnActive]}
            onPress={() => setCatType(t)}
          >
            <Text style={[styles.typeBtnText, catType === t && styles.typeBtnTextActive]}>
              {t === 'expense' ? '支出' : '収入'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period tabs */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => { setPeriod(p); trackReportPeriodChanged(p); }}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Donut hero card */}
      <View style={styles.heroCard}>
        <AsanohaBg opacity={0.35} />
        <View style={{ alignItems: 'center', position: 'relative' }}>
          {total === 0 ? (
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
          <Text style={styles.emptyText}>{`この期間の${typeLabel}データがありません`}</Text>
        ) : (
          totals.slice(0, 7).map((cat, i) => {
            const pct = total > 0 ? (cat.amount / total) * 100 : 0;
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
  totalExpense: number;
  totalIncome: number;
  netBalance: number;
  netDiff: number;
  avgNetDaily: number;
  maxDayAmt: number;
  maxDayNum: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
}

const BAR_UNITS: [BarUnit, string][] = [['day', '日'], ['week', '週'], ['month', '月']];
const BAR_TITLE: Record<BarUnit, string> = { day: '日別収支', week: '週別収支', month: '月別収支' };

// 収支推移の棒グラフ（ゼロ基準・黒字は上/赤字は下／バー数可変・SVG手描き）
function BarChart({ bars }: { bars: Bar[] }) {
  // react-native-svg は width="100%" だけだと高さが 0 に潰れるため、
  // 実幅を onLayout で測り width/height を数値で渡す
  const [boxW, setBoxW] = useState(0);
  const H = 164, padX = 8, padTop = 22, padBottom = 24;
  const W = boxW > 0 ? boxW : 280;
  const n = bars.length;
  // 正方向（黒字）と負方向（赤字）の最大幅からゼロ線の位置を決める
  const maxPos = Math.max(0, ...bars.map((b) => b.amount));
  const minNeg = Math.min(0, ...bars.map((b) => b.amount));
  const range = (maxPos - minNeg) || 1;
  const slot = (W - padX * 2) / n;
  const barW = Math.min(slot * 0.62, 30);
  const chartH = H - padTop - padBottom;
  const zeroY = padTop + (maxPos / range) * chartH;
  const showValues = n <= 8;

  const xAt = (i: number) => padX + slot * i + (slot - barW) / 2;

  return (
    <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      {boxW > 0 ? (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* zero line */}
      <Line x1={padX} x2={W - padX} y1={zeroY} y2={zeroY} stroke="rgba(241,232,211,0.25)" strokeWidth={0.6} />
      {/* bars（黒字=brass↑ / 赤字=expense↓） */}
      {bars.map((b, i) => {
        const isPos = b.amount >= 0;
        const h = (Math.abs(b.amount) / range) * chartH;
        return (
          <Rect
            key={`bar-${i}`}
            x={xAt(i)} y={isPos ? zeroY - h : zeroY}
            width={barW} height={Math.max(h, 0.5)} rx={2}
            fill={isPos ? AI.brass : AI.expense}
          />
        );
      })}
      {/* value labels（6〜8本のときのみ） */}
      {showValues && bars.map((b, i) => {
        if (b.amount === 0) return null;
        const isPos = b.amount >= 0;
        const h = (Math.abs(b.amount) / range) * chartH;
        const y = isPos ? zeroY - h - 4 : zeroY + h + 9;
        return (
          <SvgText
            key={`val-${i}`}
            x={xAt(i) + barW / 2} y={y}
            textAnchor="middle" fontSize={8} fill={AI.brassSoft}
          >
            {compactYen(b.amount)}
          </SvgText>
        );
      })}
      {/* x labels */}
      {bars.map((b, i) => (
        <SvgText
          key={`lbl-${i}`}
          x={xAt(i) + barW / 2} y={H - 5}
          textAnchor="middle" fontSize={8.5}
          fill={b.current ? AI.brass : AI.brassSoft}
        >
          {b.label}
        </SvgText>
      ))}
    </Svg>
      ) : (
        <View style={{ height: H }} />
      )}
    </View>
  );
}

function TrendTab({ data, bars, balanceInfo, barUnit, setBarUnit }: {
  data: TrendDataProps;
  bars: Bar[];
  balanceInfo: BalanceInfo;
  barUnit: BarUnit;
  setBarUnit: (u: BarUnit) => void;
}) {
  const {
    netBalance, netDiff, avgNetDaily,
    maxDayAmt, maxDayNum, daysElapsed,
  } = data;

  // 収支残高カード（選択中の日/週/月に対応）
  const { label: balLabel, income: balIncome, expense: balExpense, balance: balBalance } = balanceInfo;
  const dailyBudgetRemaining = balanceInfo.showBudget && balanceInfo.daysRemaining > 0 && balBalance > 0
    ? Math.floor(balBalance / balanceInfo.daysRemaining)
    : null;

  // 今月の収支（黒字=brass+ / 赤字=danger−）
  const isSurplus = netBalance >= 0;
  const netColor = isSurplus ? AI.brass : AI.danger;
  const netSign = isSurplus ? '+' : '−';

  // 前月同日比
  const diffAbs = Math.abs(netDiff);
  const diffSign = netDiff >= 0 ? '+' : '−';

  // 収支の日平均（黒字=income+ / 赤字=expense−）
  const avgColor = avgNetDaily >= 0 ? AI.income : AI.expense;
  const avgText = `${avgNetDaily >= 0 ? '+' : '−'}${formatCurrency(Math.abs(avgNetDaily))}`;

  return (
    <View style={styles.tabContent}>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <AsanohaBg opacity={0.35} />
        <View style={{ position: 'relative' }}>

          {/* Amount header（今月の収支） */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>{`今月の収支 · ${daysElapsed}日時点`}</Text>
              <View style={styles.heroAmtRow}>
                <Text style={[styles.heroYen, { color: netColor }]}>{`${netSign}¥`}</Text>
                <Text style={[styles.heroAmt, { color: netColor }]}>{Math.abs(netBalance).toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroDiff}>{`${diffSign}¥${diffAbs.toLocaleString()}`}</Text>
              <Text style={styles.heroDiffLabel}>{`前月比 ${netDiff >= 0 ? '↑' : '↓'}`}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {([
          ['日 平 均', avgText, avgColor],
          ['最 大 日', compactYen(maxDayAmt), AI.indigo],
          ['記 録 日', `${maxDayNum}日`, AI.indigo],
        ] as [string, string, string][]).map(([label, value, color], i) => (
          <View key={label} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* 収支推移の棒グラフ（日/週/月） */}
      <View style={styles.barUnitRow}>
        {BAR_UNITS.map(([u, label]) => (
          <TouchableOpacity
            key={u}
            style={[styles.periodBtn, barUnit === u && styles.periodBtnActive]}
            onPress={() => setBarUnit(u)}
          >
            <Text style={[styles.periodBtnText, barUnit === u && styles.periodBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.heroCard}>
        <AsanohaBg opacity={0.35} />
        <View style={{ position: 'relative' }}>
          <Text style={styles.heroLabel}>{BAR_TITLE[barUnit]}</Text>
          {bars.some((b) => b.amount !== 0) ? (
            <View style={{ marginTop: 6 }}>
              <BarChart bars={bars} />
            </View>
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>データなし</Text>
            </View>
          )}
        </View>
      </View>

      {/* 収支残高カード（日/週/月ボタンに対応） */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>{balLabel}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>収 入</Text>
            <Text style={[styles.balanceItemValue, { color: AI.income }]}>
              {formatCurrency(balIncome)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>支 出</Text>
            <Text style={[styles.balanceItemValue, { color: AI.expense }]}>
              {formatCurrency(balExpense)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>残 高</Text>
            <Text style={[styles.balanceItemValue, { color: balBalance >= 0 ? AI.income : AI.expense, fontWeight: 'bold' }]}>
              {balBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(balBalance))}
            </Text>
          </View>
        </View>
        {dailyBudgetRemaining !== null && (
          <Text style={styles.dailyBudgetText}>
            {'残り '}
            <Text style={styles.dailyBudgetHighlight}>{balanceInfo.daysRemaining}日</Text>
            {' で 1日あたり '}
            <Text style={styles.dailyBudgetHighlight}>{formatCurrency(dailyBudgetRemaining)}</Text>
            {' 使えます'}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AI.washi },
  content: { paddingBottom: 40 },

  // Scope + Family
  scopeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: 16, marginTop: 48,
  },
  scopeSelectorWrap: { flex: 1 },
  familyBtn: {
    flexShrink: 0, marginLeft: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: AI.rule,
    backgroundColor: AI.washi2,
  },
  familyBtnText: { fontSize: 12, color: AI.textSoft, fontWeight: '500' },

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

  // 支出/収入 トグル
  typeRow: {
    flexDirection: 'row', marginBottom: 12,
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: AI.rule,
  },
  typeBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', backgroundColor: AI.washi2 },
  typeBtnActive: { backgroundColor: AI.indigo },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: AI.textSoft, letterSpacing: 2 },
  typeBtnTextActive: { color: AI.brass },

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

  chartEmpty: {
    height: 120, alignItems: 'center', justifyContent: 'center',
  },
  chartEmptyText: { color: AI.brassSoft, fontSize: 12 },

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

  // Bar chart unit toggle
  barUnitRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },

  // 収支残高カード
  balanceCard: {
    marginTop: 12,
    backgroundColor: AI.washi2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AI.rule,
    padding: 16,
  },
  balanceTitle: {
    fontSize: 11, fontWeight: '600', color: AI.textSoft,
    letterSpacing: 3, marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  balanceItem: {
    flex: 1, alignItems: 'center',
  },
  balanceDivider: {
    width: 1, height: 32, backgroundColor: AI.rule,
  },
  balanceItemLabel: {
    fontSize: 10, color: AI.textSoft, letterSpacing: 2, marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 15, fontWeight: '600', color: AI.text,
  },
  dailyBudgetText: {
    marginTop: 12, fontSize: 12, color: AI.textSoft,
    textAlign: 'center', lineHeight: 18,
  },
  dailyBudgetHighlight: {
    color: AI.indigo, fontWeight: '700',
  },
});
