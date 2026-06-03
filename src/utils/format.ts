import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths, getMonth, getDate, getYear } from 'date-fns';
import { ja } from 'date-fns/locale';

const WAFU_MONTHS = [
  '睦月', '如月', '弥生', '卯月', '皐月', '水無月',
  '文月', '葉月', '長月', '神無月', '霜月', '師走',
];

export function formatCurrency(cents: number): string {
  return `¥${(cents).toLocaleString('ja-JP')}`;
}

export function formatDate(isoDate: string): string {
  const date = parseISO(isoDate);
  const weekday = format(date, 'E', { locale: ja });
  return `${WAFU_MONTHS[getMonth(date)]}${getDate(date)}日(${weekday})`;
}

export function formatMonth(isoDate: string): string {
  const date = parseISO(isoDate);
  return `${getYear(date)}年 ${WAFU_MONTHS[getMonth(date)]}`;
}

export function formatDateFull(date: Date): string {
  const weekday = format(date, 'E', { locale: ja });
  return `${getYear(date)}年 ${WAFU_MONTHS[getMonth(date)]}${getDate(date)}日(${weekday})`;
}

export function getMonthRange(isoDate: string): { from: string; to: string } {
  const date = parseISO(isoDate);
  return {
    from: format(startOfMonth(date), 'yyyy-MM-dd'),
    to: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}

export function prevMonth(isoDate: string): string {
  return format(subMonths(parseISO(isoDate), 1), 'yyyy-MM-dd');
}

export function nextMonth(isoDate: string): string {
  return format(addMonths(parseISO(isoDate), 1), 'yyyy-MM-dd');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonthISO(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}
