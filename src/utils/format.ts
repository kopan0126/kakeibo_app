import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatCurrency(cents: number): string {
  return `¥${(cents).toLocaleString('ja-JP')}`;
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'M月d日(E)', { locale: ja });
}

export function formatMonth(isoDate: string): string {
  return format(parseISO(isoDate), 'yyyy年M月', { locale: ja });
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
