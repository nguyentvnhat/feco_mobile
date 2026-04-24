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

function appendCurrency(value: string | null | undefined, currency: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text) return '--';
  if (/[đ₫]$/i.test(text)) return text;

  const cur = (currency ?? '').trim();
  if (!cur) return `${text} đ`;

  return `${text} ${cur}`;
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
