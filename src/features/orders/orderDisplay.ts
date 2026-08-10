import type { OrderListItem } from './orders.types';
import { getOrderStatusPresentation } from './orderStatus';

export type RecentOrderRow = {
  id: string;
  code: string;
  subtitle: string;
  amount: string;
  status: string;
  statusColor: string;
  statusBg: string;
};

function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

export function formatOrderDateTime(iso?: string | null, fallback = '--') {
  if (!iso) return fallback;

  const raw = iso.trim();
  const isMidnightInIso = /T00:00(?::00(?:\.0+)?)?(?:Z|[+-]\d{2}:\d{2})?$/i.test(raw);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;

  const hideTime = isMidnightInIso || (date.getHours() === 0 && date.getMinutes() === 0);
  if (hideTime) {
    return date.toLocaleDateString('vi-VN');
  }

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function appendCurrency(value: string | null | undefined, currency: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text) return '--';
  if (/[đ₫]$/i.test(text)) return text;

  const cur = (currency ?? '').trim();
  if (!cur) return `${text} đ`;

  return `${text} ${cur}`;
}

export function formatTierLimitLabel(params: {
  tierLimitLabel?: string | null;
  minValue?: string | number | null;
  maxValue?: string | number | null;
  rewardPercent?: string | number | null;
  rewardAmountPerUnit?: number | null;
}): string {
  const withQtyPrefix = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return '';
    if (/^số lượng\b/i.test(trimmed)) return trimmed;
    return `Số lượng ${trimmed}`;
  };

  const ready = (params.tierLimitLabel ?? '').trim();
  if (ready) return withQtyPrefix(ready);

  const fmt = (value: string | number | null | undefined, fallback = '0') => {
    if (value == null || value === '') return fallback;
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return Number.isInteger(num) ? String(num) : String(num).replace(/\.0+$/, '');
  };

  const min = fmt(params.minValue, '0');
  const max =
    params.maxValue == null || params.maxValue === ''
      ? '∞'
      : fmt(params.maxValue, '∞');
  const range = `${min} → ${max}`;

  const percent = Number(params.rewardPercent);
  if (Number.isFinite(percent) && percent > 0) {
    const percentLabel = Number.isInteger(percent)
      ? String(percent)
      : String(Number(percent.toFixed(2))).replace(/\.0+$/, '');
    return withQtyPrefix(`${range} (${percentLabel}%)`);
  }

  const amount = Number(params.rewardAmountPerUnit);
  if (Number.isFinite(amount) && amount > 0) {
    return withQtyPrefix(`${range} (${amount.toLocaleString('vi-VN')} đ)`);
  }

  return withQtyPrefix(range);
}

export function mapOrderToRecentRow(order: OrderListItem): RecentOrderRow {
  const name = order.customer?.customer_name?.trim() || '—';
  const date = formatOrderDate(order.order_date);
  const status = getOrderStatusPresentation(order.order_status, order.order_label_status);
  const code = order.order_no.startsWith('#') ? order.order_no : `#${order.order_no}`;

  return {
    id: String(order.id),
    code,
    subtitle: date ? `${name} • ${date}` : name,
    amount: appendCurrency(order.net_amount, order.currency),
    status: status.label,
    statusColor: status.textColor,
    statusBg: status.bgColor,
  };
}
